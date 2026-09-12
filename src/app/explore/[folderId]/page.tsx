"use client";

import { useEffect, useState, useMemo, use } from "react";
import Link from "next/link";
import type { DriveFolder, DriveFile, DriveItem } from "@/lib/drive";
import { findFolderById } from "@/lib/drive";
import Breadcrumb from "@/components/Breadcrumb";
import FolderCard from "@/components/FolderCard";
import FileCard from "@/components/FileCard";
import FilePreview from "@/components/FilePreview";

export default function ExploreFolderPage(
  props: PageProps<"/explore/[folderId]">
) {
  const { folderId: rawFolderId } = use(props.params);

  // SECURITY: Validate folderId format — Google Drive IDs are only
  // alphanumeric, hyphens, and underscores. Reject everything else.
  const SAFE_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
  const folderId = SAFE_ID_PATTERN.test(rawFolderId) ? rawFolderId : "";

  const [tree, setTree] = useState<DriveFolder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewFile, setPreviewFile] = useState<DriveFile | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    async function fetchData() {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      try {
        const res = await fetch("/api/drive", { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) throw new Error("Failed to load content");
        const data = await res.json();
        setTree(data);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          setError("Connection timed out. Please try again.");
        } else {
          setError(err instanceof Error ? err.message : "Something went wrong");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Find folder by ID in the tree
  const searchResult = useMemo(() => {
    if (!tree) return null;
    return findFolderById(tree, folderId);
  }, [tree, folderId]);

  const currentFolder = searchResult?.folder ?? null;

  // Build breadcrumb items from the search result path
  const breadcrumbItems = useMemo(() => {
    const items = [
      { label: "Home", href: "/" },
      { label: "Explore", href: "/explore" },
    ];
    if (searchResult) {
      // Skip the root (already represented by "Explore")
      for (let i = 1; i < searchResult.breadcrumbs.length; i++) {
        const crumb = searchResult.breadcrumbs[i];
        items.push({
          label: crumb.name,
          href: `/explore/${crumb.id}`,
        });
      }
    }
    return items;
  }, [searchResult]);

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!currentFolder) return [];
    if (!searchQuery.trim()) return currentFolder.children;

    const query = searchQuery.toLowerCase();
    return currentFolder.children.filter((item) =>
      item.name.toLowerCase().includes(query)
    );
  }, [currentFolder, searchQuery]);

  if (loading) {
    return (
      <div className="explore-page">
        <div className="container page-enter">
          <div className="explore-header">
            <h1 className="explore-title">Loading...</h1>
          </div>
          <div className="content-grid">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton skeleton-card" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="explore-page">
        <div className="container">
          <div className="error-state">
            <div className="error-state-title">Unable to load content</div>
            <div className="error-state-desc">{error}</div>
            <Link href="/explore" className="btn btn-primary">
              Back to Explore
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!currentFolder) {
    return (
      <div className="explore-page">
        <div className="container">
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-title">Folder not found</div>
            <div className="empty-state-desc">
              This folder may have been moved or renamed.
            </div>
            <Link
              href="/explore"
              className="btn btn-primary"
              style={{ marginTop: 16 }}
            >
              Back to Explore
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const folders = filteredItems.filter(
    (item): item is DriveFolder => item.type === "folder"
  );
  const files = filteredItems.filter(
    (item): item is DriveFile => item.type === "file"
  );

  // Find parent folder ID for back navigation
  const parentId =
    searchResult && searchResult.breadcrumbs.length > 1
      ? searchResult.breadcrumbs[searchResult.breadcrumbs.length - 2].id
      : null;

  // Check if parent is the root (go back to /explore instead of /explore/rootId)
  const backHref =
    parentId && tree && parentId !== tree.id
      ? `/explore/${parentId}`
      : "/explore";

  return (
    <div className="explore-page">
      <div className="container page-enter">
        {/* Back Button */}
        <Link href={backHref} className="back-btn">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back
        </Link>

        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} />

        {/* Header */}
        <div className="explore-header">
          <h1 className="explore-title">{currentFolder.name}</h1>
        </div>

        {/* Search — only show if there are enough items */}
        {currentFolder.children.length > 3 && (
          <div className="search-bar">
            <svg
              className="search-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder={`Search in ${currentFolder.name}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="search-subfolder"
            />
          </div>
        )}

        {/* View Controls */}
        <div className="view-controls">
          <span className="view-controls-left">
            {filteredItems.length} items
          </span>
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="Grid view"
              aria-label="Grid view"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </button>
            <button
              className={`view-toggle-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
              title="List view"
              aria-label="List view"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="4" width="18" height="3" rx="1" />
                <rect x="3" y="10.5" width="18" height="3" rx="1" />
                <rect x="3" y="17" width="18" height="3" rx="1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        {filteredItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              {searchQuery ? "🔍" : "📂"}
            </div>
            <div className="empty-state-title">
              {searchQuery ? "No results found" : "This folder is empty"}
            </div>
            <div className="empty-state-desc">
              {searchQuery
                ? "Try a different search term"
                : "No files or folders have been added here yet"}
            </div>
          </div>
        ) : (
          <div
            className={viewMode === "grid" ? "content-grid" : "content-list"}
          >
            {folders.map((folder) => (
              <FolderCard key={folder.id} folder={folder} />
            ))}
            {files.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                onPreview={setPreviewFile}
              />
            ))}
          </div>
        )}
      </div>

      {/* File Preview Modal */}
      {previewFile && (
        <FilePreview
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
}

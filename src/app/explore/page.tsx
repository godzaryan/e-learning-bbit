"use client";

import { useEffect, useState, useMemo } from "react";
import type { DriveFolder, DriveFile, DriveItem } from "@/lib/drive";
import FolderCard from "@/components/FolderCard";
import FileCard from "@/components/FileCard";
import FilePreview from "@/components/FilePreview";

export default function ExplorePage() {
  const [tree, setTree] = useState<DriveFolder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewFile, setPreviewFile] = useState<DriveFile | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/drive");
        if (!res.ok) throw new Error("Failed to load content");
        const data = await res.json();
        setTree(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!tree) return [];
    if (!searchQuery.trim()) return tree.children;

    const query = searchQuery.toLowerCase();

    function searchInFolder(folder: DriveFolder): DriveItem[] {
      const results: DriveItem[] = [];
      for (const child of folder.children) {
        if (child.name.toLowerCase().includes(query)) {
          results.push(child);
        }
        if (child.type === "folder") {
          results.push(...searchInFolder(child));
        }
      }
      return results;
    }

    return searchInFolder(tree);
  }, [tree, searchQuery]);

  if (loading) {
    return (
      <div className="explore-page">
        <div className="container page-enter">
          <div className="explore-header">
            <h1 className="explore-title">Explore Content</h1>
            <p className="explore-desc">Loading resources...</p>
          </div>
          <div className="content-grid">
            {[...Array(6)].map((_, i) => (
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
            <button
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
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

  return (
    <div className="explore-page">
      <div className="container page-enter">
        <div className="explore-header">
          <h1 className="explore-title">
            {tree?.name || "Explore Content"}
          </h1>
          <p className="explore-desc">
            Browse and download study materials organized by department
          </p>
        </div>

        {/* Search */}
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
            placeholder="Search files and folders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="search-input"
          />
        </div>

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
            <div className="empty-state-icon">🔍</div>
            <div className="empty-state-title">No results found</div>
            <div className="empty-state-desc">
              Try a different search term
            </div>
          </div>
        ) : (
          <div className={viewMode === "grid" ? "content-grid" : "content-list"}>
            {folders.map((folder) => (
              <FolderCard
                key={folder.id}
                folder={folder}
              />
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

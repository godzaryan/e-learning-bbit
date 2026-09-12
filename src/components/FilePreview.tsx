"use client";

import { useEffect, useCallback } from "react";
import type { DriveFile } from "@/lib/drive";
import { getDownloadUrl, getViewUrl, getFileInfo } from "@/lib/drive";

interface FilePreviewProps {
  file: DriveFile;
  onClose: () => void;
}

function getFileCategory(
  mimeType: string
): "image" | "video" | "audio" | "pdf" | "document" | "other" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf") return "pdf";
  if (
    mimeType.includes("document") ||
    mimeType.includes("wordprocessing") ||
    mimeType.includes("spreadsheet") ||
    mimeType.includes("presentation") ||
    mimeType.includes("powerpoint") ||
    mimeType.includes("excel") ||
    mimeType.includes("msword") ||
    mimeType.includes("text/")
  )
    return "document";
  return "other";
}

function getGoogleViewerUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

function getImageUrl(fileId: string): string {
  return `https://lh3.googleusercontent.com/d/${fileId}=w1600`;
}

function getImageFallbackUrl(fileId: string): string {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`;
}

export default function FilePreview({ file, onClose }: FilePreviewProps) {
  const category = getFileCategory(file.mimeType);
  const info = getFileInfo(file.mimeType);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  const handleClose = useCallback(() => {
    // Defer the unmount slightly to prevent Android touch dispatcher from freezing
    // when removing heavy iframes synchronously during a click event.
    setTimeout(() => {
      onClose();
    }, 10);
  }, [onClose]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    // Save original overflow to restore it properly
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [handleKeyDown]);

  return (
    <div
      className="preview-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Preview: ${file.name}`}
    >
      <div className={`preview-modal preview-modal--${category}`}>
        {/* Header */}
        <div className="preview-header">
          <div className="preview-header-left">
            <span className="preview-file-icon">{info.icon}</span>
            <div className="preview-title-group">
              <h3 className="preview-title">{file.name}</h3>
              <span
                className="preview-type-badge"
                style={{
                  background: `${info.color}18`,
                  color: info.color,
                }}
              >
                {info.label}
              </span>
            </div>
          </div>
          <div className="preview-actions">
            <a
              href={getViewUrl(file.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-secondary"
              title="Open in Google Drive"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              <span className="preview-btn-text">Open</span>
            </a>
            <a
              href={getDownloadUrl(file.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-primary"
              title="Download file"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span className="preview-btn-text">Download</span>
            </a>
            <button
              className="preview-close-btn"
              onClick={handleClose}
              onTouchEnd={(e) => {
                e.preventDefault(); // Prevent ghost clicks
                handleClose();
              }}
              onPointerDown={(e) => {
                // Ensure focus doesn't get trapped by iframe
                e.preventDefault();
              }}
              aria-label="Close preview"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body — type-specific viewer */}
        <div className="preview-body">
          {category === "image" && (
            <ImageViewer fileId={file.id} fileName={file.name} />
          )}
          {category === "video" && (
            <VideoViewer fileId={file.id} />
          )}
          {category === "audio" && (
            <AudioViewer fileId={file.id} fileName={file.name} fileIcon={info.icon} />
          )}
          {(category === "pdf" || category === "document") && (
            <DocumentViewer fileId={file.id} />
          )}
          {category === "other" && (
            <OtherViewer fileId={file.id} fileName={file.name} fileIcon={info.icon} downloadUrl={getDownloadUrl(file.id)} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Image Viewer ── */
function ImageViewer({
  fileId,
  fileName,
}: {
  fileId: string;
  fileName: string;
}) {
  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    // Fallback to thumbnail API if lh3 fails
    if (!img.src.includes("thumbnail")) {
      img.src = getImageFallbackUrl(fileId);
    }
  };

  return (
    <div className="viewer-image">
      <div className="viewer-image-container">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getImageUrl(fileId)}
          alt={fileName}
          className="viewer-image-img"
          onError={handleImgError}
          loading="eager"
        />
      </div>
    </div>
  );
}

/* ── Video Viewer ── */
function VideoViewer({ fileId }: { fileId: string }) {
  return (
    <div className="viewer-video">
      <iframe
        src={getGoogleViewerUrl(fileId)}
        className="viewer-video-iframe"
        title="Video player"
        allow="autoplay; fullscreen"
        allowFullScreen
        sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

/* ── Audio Viewer ── */
function AudioViewer({
  fileId,
  fileName,
  fileIcon,
}: {
  fileId: string;
  fileName: string;
  fileIcon: string;
}) {
  return (
    <div className="viewer-audio">
      <div className="viewer-audio-visual">
        <div className="viewer-audio-icon">{fileIcon}</div>
        <div className="viewer-audio-name">{fileName}</div>
        <div className="viewer-audio-bars" aria-hidden="true">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="viewer-audio-bar"
              style={{
                animationDelay: `${i * 0.08}s`,
                height: `${20 + Math.random() * 60}%`,
              }}
            />
          ))}
        </div>
      </div>
      <iframe
        src={getGoogleViewerUrl(fileId)}
        className="viewer-audio-iframe"
        title="Audio player"
        allow="autoplay"
        sandbox="allow-scripts allow-same-origin allow-popups"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

/* ── Document/PDF Viewer ── */
function DocumentViewer({ fileId }: { fileId: string }) {
  return (
    <div className="viewer-document">
      <iframe
        src={getGoogleViewerUrl(fileId)}
        className="viewer-document-iframe"
        title="Document viewer"
        allow="autoplay"
        sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

/* ── Other/Unknown File Viewer ── */
function OtherViewer({
  fileId,
  fileName,
  fileIcon,
  downloadUrl,
}: {
  fileId: string;
  fileName: string;
  fileIcon: string;
  downloadUrl: string;
}) {
  return (
    <div className="viewer-other">
      <div className="viewer-other-content">
        <div className="viewer-other-icon">{fileIcon}</div>
        <h3 className="viewer-other-name">{fileName}</h3>
        <p className="viewer-other-hint">
          This file type cannot be previewed directly.
        </p>
        <div className="viewer-other-actions">
          <a
            href={getViewUrl(fileId)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            Open in Google Drive ↗
          </a>
          <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            Download File
          </a>
        </div>
      </div>
    </div>
  );
}

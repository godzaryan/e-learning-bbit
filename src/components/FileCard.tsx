"use client";

import type { DriveFile } from "@/lib/drive";
import { getFileInfo, formatFileSize, getDownloadUrl } from "@/lib/drive";

interface FileCardProps {
  file: DriveFile;
  onPreview: (file: DriveFile) => void;
}

export default function FileCard({ file, onPreview }: FileCardProps) {
  const info = getFileInfo(file.mimeType);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(getDownloadUrl(file.id), "_blank");
  };

  return (
    <div
      className="file-card"
      onClick={() => onPreview(file)}
      id={`file-${file.id}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onPreview(file);
        }
      }}
    >
      <div
        className="file-card-icon"
        style={{ background: `${info.color}15` }}
      >
        {info.icon}
      </div>
      <div className="file-card-info">
        <div className="file-card-name" title={file.name}>
          {file.name}
        </div>
        <div className="file-card-meta">
          <span
            className="file-card-type-badge"
            style={{
              background: `${info.color}18`,
              color: info.color,
            }}
          >
            {info.label}
          </span>
          <span>{formatFileSize(file.size)}</span>
        </div>
      </div>
      <div className="file-card-actions">
        <button
          className="file-action-btn"
          onClick={handleDownload}
          title="Download"
          aria-label={`Download ${file.name}`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
      </div>
    </div>
  );
}

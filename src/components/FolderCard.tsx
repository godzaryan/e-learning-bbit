import Link from "next/link";
import type { DriveFolder } from "@/lib/drive";

interface FolderCardProps {
  folder: DriveFolder;
}

export default function FolderCard({ folder }: FolderCardProps) {
  const itemCount = folder.children?.length || 0;
  const href = `/explore/${folder.id}`;

  return (
    <Link href={href} className="folder-card" id={`folder-${folder.id}`}>
      <div className="folder-card-icon">📂</div>
      <div className="folder-card-info">
        <div className="folder-card-name" title={folder.name}>
          {folder.name}
        </div>
        <div className="folder-card-meta">
          {itemCount > 0 ? `${itemCount} items` : "Empty"}
        </div>
      </div>
      <svg
        className="folder-card-arrow"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </Link>
  );
}

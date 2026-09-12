// Drive item types
export interface DriveFile {
  id: string;
  name: string;
  type: "file";
  mimeType: string;
  size: number;
  lastUpdated: string;
  downloadUrl: string;
  previewUrl: string;
}

export interface DriveFolder {
  id: string;
  name: string;
  type: "folder";
  children: DriveItem[];
}

export type DriveItem = DriveFile | DriveFolder;

// MIME type to icon/label mappings
const mimeIcons: Record<string, { icon: string; label: string; color: string }> = {
  "application/pdf": { icon: "📄", label: "PDF", color: "#e74c3c" },
  "application/vnd.google-apps.document": { icon: "📝", label: "Doc", color: "#4285f4" },
  "application/vnd.google-apps.spreadsheet": { icon: "📊", label: "Sheet", color: "#0f9d58" },
  "application/vnd.google-apps.presentation": { icon: "📽️", label: "Slides", color: "#f4b400" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { icon: "📝", label: "DOCX", color: "#4285f4" },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { icon: "📊", label: "XLSX", color: "#0f9d58" },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": { icon: "📽️", label: "PPTX", color: "#f4b400" },
  "application/msword": { icon: "📝", label: "DOC", color: "#4285f4" },
  "application/vnd.ms-excel": { icon: "📊", label: "XLS", color: "#0f9d58" },
  "application/vnd.ms-powerpoint": { icon: "📽️", label: "PPT", color: "#f4b400" },
  "application/zip": { icon: "📦", label: "ZIP", color: "#9b59b6" },
  "application/x-rar-compressed": { icon: "📦", label: "RAR", color: "#9b59b6" },
  "text/plain": { icon: "📃", label: "TXT", color: "#95a5a6" },
  "text/csv": { icon: "📊", label: "CSV", color: "#0f9d58" },
  "application/json": { icon: "📃", label: "JSON", color: "#f39c12" },
  "video/mp4": { icon: "🎬", label: "MP4", color: "#e74c3c" },
  "video/x-matroska": { icon: "🎬", label: "MKV", color: "#e74c3c" },
  "audio/mpeg": { icon: "🎵", label: "MP3", color: "#9b59b6" },
  "image/jpeg": { icon: "🖼️", label: "JPG", color: "#3498db" },
  "image/png": { icon: "🖼️", label: "PNG", color: "#3498db" },
  "image/svg+xml": { icon: "🖼️", label: "SVG", color: "#3498db" },
  "image/gif": { icon: "🖼️", label: "GIF", color: "#3498db" },
};

export function getFileInfo(mimeType: string) {
  if (mimeType.startsWith("image/")) {
    return mimeIcons["image/jpeg"] || { icon: "🖼️", label: "Image", color: "#3498db" };
  }
  if (mimeType.startsWith("video/")) {
    return mimeIcons["video/mp4"] || { icon: "🎬", label: "Video", color: "#e74c3c" };
  }
  if (mimeType.startsWith("audio/")) {
    return mimeIcons["audio/mpeg"] || { icon: "🎵", label: "Audio", color: "#9b59b6" };
  }
  return mimeIcons[mimeType] || { icon: "📁", label: "File", color: "#95a5a6" };
}

export function getPreviewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

export function getDownloadUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

export function getViewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function isPreviewable(mimeType: string): boolean {
  const previewable = [
    "application/pdf",
    "application/vnd.google-apps.document",
    "application/vnd.google-apps.spreadsheet",
    "application/vnd.google-apps.presentation",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/msword",
    "application/vnd.ms-excel",
    "application/vnd.ms-powerpoint",
  ];
  return (
    previewable.includes(mimeType) ||
    mimeType.startsWith("image/") ||
    mimeType.startsWith("video/") ||
    mimeType.startsWith("text/")
  );
}

// Find a folder by ID anywhere in the tree, returning the folder and its breadcrumb path
export interface FolderSearchResult {
  folder: DriveFolder;
  breadcrumbs: { id: string; name: string }[];
}

export function findFolderById(
  tree: DriveFolder,
  targetId: string
): FolderSearchResult | null {
  // Root level match
  if (tree.id === targetId) {
    return { folder: tree, breadcrumbs: [{ id: tree.id, name: tree.name }] };
  }

  // Recursive search
  function search(
    node: DriveFolder,
    path: { id: string; name: string }[]
  ): FolderSearchResult | null {
    for (const child of node.children) {
      if (child.type === "folder") {
        const currentPath = [...path, { id: child.id, name: child.name }];
        if (child.id === targetId) {
          return { folder: child, breadcrumbs: currentPath };
        }
        const result = search(child, currentPath);
        if (result) return result;
      }
    }
    return null;
  }

  return search(tree, [{ id: tree.id, name: tree.name }]);
}

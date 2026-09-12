/*
 * Google Apps Script — BBIT E-Learning Drive Proxy
 * 
 * SETUP INSTRUCTIONS:
 * ──────────────────
 * 1. Go to https://script.google.com and create a new project
 * 2. Replace the default code with this entire file
 * 3. Click "Deploy" → "New deployment"
 * 4. Select type: "Web app"
 * 5. Set "Execute as": "Me"
 * 6. Set "Who has access": "Anyone"
 * 7. Click "Deploy" and authorize when prompted
 * 8. Copy the Web App URL
 * 9. Add it to your .env.local file as:
 *    APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_ID/exec
 *
 * This script serves the Google Drive folder tree as JSON.
 * It uses Apps Script's built-in CacheService for 6-hour caching,
 * so even the Drive API calls from this script are minimized.
 */

// Root folder ID — the shared "PEDAGOGICAL INITIATIVE" folder
var ROOT_FOLDER_ID = "12m989O-EbtuuuRoAdc5bnwld19iaSVbo";

function doGet(e) {
  var folderId = (e && e.parameter && e.parameter.folderId) || ROOT_FOLDER_ID;
  var depth = (e && e.parameter && e.parameter.depth) || "all";
  var bustCache = (e && e.parameter && e.parameter.bustCache) || null;
  
  var cacheKey = "drive_tree_" + folderId + "_" + depth;
  var cache = CacheService.getScriptCache();
  
  // Skip cache if bustCache param is provided
  if (!bustCache) {
    var cached = cache.get(cacheKey);
    if (cached) {
      return ContentService
        .createTextOutput(cached)
        .setMimeType(ContentService.MimeType.JSON);
    }
  } else {
    // Clear existing cache entry
    cache.remove(cacheKey);
  }
  
  var result;
  if (depth === "1") {
    result = getShallowFolder(folderId);
  } else {
    result = getFolderTree(folderId);
  }
  
  var json = JSON.stringify(result);
  
  // Cache for 6 hours (21600 seconds) — max allowed by Apps Script
  try {
    cache.put(cacheKey, json, 21600);
  } catch (err) {
    // If response is too large for cache (>100KB), skip caching
    // It will still return the response
  }
  
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Get only immediate children of a folder (no recursion)
 */
function getShallowFolder(folderId) {
  var folder = DriveApp.getFolderById(folderId);
  var result = {
    id: folderId,
    name: folder.getName(),
    type: "folder",
    children: []
  };
  
  // Get subfolders
  var subFolders = folder.getFolders();
  while (subFolders.hasNext()) {
    var sub = subFolders.next();
    result.children.push({
      id: sub.getId(),
      name: sub.getName(),
      type: "folder",
      children: [] // placeholder — fetch on demand
    });
  }
  
  // Get files
  var files = folder.getFiles();
  while (files.hasNext()) {
    var file = files.next();
    result.children.push({
      id: file.getId(),
      name: file.getName(),
      type: "file",
      mimeType: file.getMimeType(),
      size: file.getSize(),
      lastUpdated: file.getLastUpdated().toISOString(),
      downloadUrl: file.getDownloadUrl(),
      previewUrl: "https://drive.google.com/file/d/" + file.getId() + "/preview"
    });
  }
  
  // Sort: folders first, then files, alphabetically within each group
  result.children.sort(function(a, b) {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  
  return result;
}

/**
 * Recursively get the full folder tree
 */
function getFolderTree(folderId) {
  var folder = DriveApp.getFolderById(folderId);
  return buildTree(folder);
}

function buildTree(folder) {
  var result = {
    id: folder.getId(),
    name: folder.getName(),
    type: "folder",
    children: []
  };
  
  // Get subfolders recursively
  var subFolders = folder.getFolders();
  while (subFolders.hasNext()) {
    var sub = subFolders.next();
    result.children.push(buildTree(sub));
  }
  
  // Get files
  var files = folder.getFiles();
  while (files.hasNext()) {
    var file = files.next();
    result.children.push({
      id: file.getId(),
      name: file.getName(),
      type: "file",
      mimeType: file.getMimeType(),
      size: file.getSize(),
      lastUpdated: file.getLastUpdated().toISOString(),
      downloadUrl: file.getDownloadUrl(),
      previewUrl: "https://drive.google.com/file/d/" + file.getId() + "/preview"
    });
  }
  
  // Sort: folders first, then files, alphabetically
  result.children.sort(function(a, b) {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  
  return result;
}

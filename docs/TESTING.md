# BBIT E-Learning — Test Documentation

> Comprehensive test results for the BBIT E-Learning platform.
> Last tested: September 13, 2026

---

## Table of Contents

- [1. Feature Tests](#1-feature-tests)
- [2. Security Tests](#2-security-tests)
- [3. Responsive UI Tests](#3-responsive-ui-tests)
- [4. Build & Deployment Tests](#4-build--deployment-tests)
- [5. How to Replicate Tests](#5-how-to-replicate-tests)

---

## 1. Feature Tests

### 1.1 Route Availability

**What:** Verified that every page and API endpoint returns the correct HTTP status.

| Route | Method | Expected | Actual | Status |
|-------|--------|----------|--------|--------|
| `/` | GET | 200 | 200 | ✅ Pass |
| `/explore` | GET | 200 | 200 | ✅ Pass |
| `/explore/[folderId]` | GET | 200 | 200 | ✅ Pass |
| `/api/drive` | GET | 200 | 200 | ✅ Pass |
| `/api/drive` | POST | 401 (no secret) | 401 | ✅ Pass |
| `/explore/nonexistent` | GET | 200 (shows "not found" UI) | 200 | ✅ Pass |
| `/random-page` | GET | 404 | 404 | ✅ Pass |

**How to replicate:**
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/explore
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/drive
```

---

### 1.2 Google Drive API Proxy

**What:** Verified the API correctly fetches, caches, and serves Google Drive folder data.

| Test | Result |
|------|--------|
| Root folder name returned | `PEDAGOGICAL INITIATIVE` ✅ |
| Root folder ID matches config | `12m989O-EbtuuuRoAdc5bnwld19iaSVbo` ✅ |
| Top-level children count | 3 (2022, 2023, 2024-2025) ✅ |
| Subfolders resolve by ID | 9 subfolders per year ✅ |
| Files visible in subfolders | 6 files in CA-1 PPT/PDF (2024-2025) ✅ |
| Cache HIT on second request | < 5ms response time ✅ |
| Cache auto-expires after 5 min | Fresh data after TTL ✅ |

**How to replicate:**
```bash
# Fetch root data
curl http://localhost:3000/api/drive | jq '.name, .id, (.children | length)'

# Test cache speed (second request should be <5ms)
time curl http://localhost:3000/api/drive > /dev/null
time curl http://localhost:3000/api/drive > /dev/null
```

---

### 1.3 Manual Cache Revalidation

**What:** Verified the POST endpoint clears cache and fetches fresh data.

| Test | Expected | Actual | Status |
|------|----------|--------|--------|
| POST with no secret | 401 | 401 | ✅ Pass |
| POST with wrong secret | 401 | 401 | ✅ Pass |
| POST with correct secret | 200 + fresh data | 200 | ✅ Pass |

**How to replicate:**
```bash
# Should fail (401)
curl -X POST "http://localhost:3000/api/drive?secret=wrong"

# Should succeed (200) — use your REVALIDATE_SECRET value
curl -X POST "http://localhost:3000/api/drive?secret=YOUR_SECRET"
```

---

### 1.4 Folder Navigation (ID-based Routing)

**What:** Verified that all folder navigation works using Google Drive IDs instead of folder names (to handle special characters like spaces and slashes).

| Folder | ID | Children | Status |
|--------|----|----------|--------|
| 2022 | `1GIgMscolCNul3F17oriAAaSNU5rzwIHL` | 9 folders | ✅ |
| CA-1- PPT / PDF (2022) | `1fddCD5KLr7LIoU_UBZA3zdUuRKchxKlE` | 0 files | ✅ |
| 2023 | `18S8ZMxh3pOiJECZX2XL9nRVj-M1DwcZm` | 9 folders | ✅ |
| CA1 -PPT / PDF (2023) | `1OsreNwL8bgUldLgt4j9fY21SeahWK8vU` | 2 files | ✅ |
| 2024- 2025 | `1kobqdAaPHRbWc_ZlEfpLeQ2bLEGLWy0k` | 9 folders | ✅ |
| CA-1- PPT / PDF (2024-2025) | `1hIiLo-qTXvmobnHRtMwXhxwqlpUgeKEb` | 6 files | ✅ |

**Previous bug fixed:** Folder names containing `/` or spaces caused URL encoding issues. Switching to ID-based routing resolved this permanently.

---

### 1.5 Theme Toggle

**What:** Verified light/dark theme switching persists across page loads.

| Test | Status |
|------|--------|
| Default theme is light | ✅ |
| Toggle switches to dark | ✅ |
| Theme persists after refresh (localStorage) | ✅ |
| No flash of wrong theme on load (SSR script) | ✅ |

---

### 1.6 File Preview Modal

**What:** Verified file preview works for each supported file type.

| File Type | Preview Method | Status |
|-----------|---------------|--------|
| Images (JPG, PNG, WEBP, HEIC) | `lh3.googleusercontent.com` with fallback to `drive.google.com/thumbnail` | ✅ |
| Videos (MP4, MOV) | Google Drive embed iframe with sandbox | ✅ |
| Audio (MP3) | Animated visualizer + Google Drive embed | ✅ |
| PDF | Google Drive embed iframe | ✅ |
| Documents (DOCX, PPTX, XLSX) | Google Drive embed iframe | ✅ |
| Unknown (ZIP, RAR, etc.) | Fallback UI with "Open in Drive" + "Download" buttons | ✅ |
| Download button | Opens `drive.google.com/uc?export=download` | ✅ |
| Close with Escape key | ✅ |
| Close by clicking overlay | ✅ |

---

## 2. Security Tests

### Test Suite: 74 automated tests across 20 attack categories

**Test runner location:** `docs/security_tests.mjs`

| # | Category | Tests | Result |
|---|----------|-------|--------|
| 1 | HTTP Method Attacks (PUT/DELETE/PATCH) | 4 | ✅ All 405 |
| 2 | SQL Injection via query params | 4 | ✅ Params ignored |
| 3 | Path Traversal (`.env`, `.git`, source) | 10 | ✅ All 404 |
| 4 | XSS via URL params | 5 | ✅ No reflection |
| 5 | Security Headers (7 headers × 3 pages) | 18 | ✅ All present |
| 6 | CORS from foreign origin | 1 | ✅ No ACAO header |
| 7 | Response Data Leaks | 6 | ✅ No leaks |
| 8 | DoS / Large Payload | 2 | ✅ Rejected/handled |
| 9 | Prototype Pollution | 1 | ✅ Ignored |
| 10 | Open Redirect | 4 | ✅ All stay on domain |
| 11 | File ID Injection | 4 | ✅ No execution risk |
| 12 | Internal Route Exposure | 6 | ✅ All 404 |
| 13 | Source Map Exposure | 3 | ✅ All 404 |
| 14 | Timing Attack on Secret | 1 | ✅ 0ms difference |
| 15 | Cache Poisoning | 1 | ✅ Host not reflected |
| 16 | Content-Type Validation | 1 | ✅ application/json |
| 17 | Clickjacking | 2 | ✅ X-Frame-Options set |
| 18 | CRLF / Header Injection | 1 | ✅ No injection |
| 19 | Content Security Policy | 1 | ✅ Full CSP |
| 20 | Robots.txt | 1 | ✅ /api/ disallowed |

**How to replicate the full security suite:**
```bash
# Start dev server first
npm run dev

# Run the security test suite (wait 60s for any rate limit cooldown)
node docs/security_tests.mjs
```

### Additional Security Checks

| Check | Tool | Result |
|-------|------|--------|
| NPM dependency audit | `npm audit --omit=dev` | 0 vulnerabilities |
| Client bundle scan for secrets | Custom script | No secrets in client JS |
| Apps Script URL exposure | Client HTML scan | Not present ✅ |

---

## 3. Responsive UI Tests

### 3.1 Desktop (≥768px)

| Page/Component | Verified |
|----------------|----------|
| Landing page hero centered | ✅ |
| Navbar with Home + Explore + Theme toggle | ✅ |
| Content grid auto-fills columns | ✅ |
| File preview modal (max-width 1000px, rounded) | ✅ |
| Search bar full-width | ✅ |
| Breadcrumb wraps naturally | ✅ |
| Footer centered | ✅ |

### 3.2 Mobile (≤768px)

| Page/Component | Fix Applied | Verified |
|----------------|-------------|----------|
| Viewport meta tag | Added `viewport-fit=cover` | ✅ |
| Hero section | `100dvh`, smaller orbs, stacked buttons | ✅ |
| Navbar brand | Smaller icon (30px) and text (15px) | ✅ |
| Mobile hamburger menu | Already working | ✅ |
| Content grid | Single column at ≤600px | ✅ |
| Folder cards | Compact padding, smaller icons | ✅ |
| File cards | 13px name, 11px meta | ✅ |
| Breadcrumb | Horizontal scroll, hidden scrollbar | ✅ |
| Search input | Adjusted padding, 14px font | ✅ |
| Preview modal | Full-screen `100dvh`, no border-radius | ✅ |
| Preview header | Icon-only buttons, safe-area-inset-top | ✅ |
| Image viewer | `calc(100dvh - 70px)` | ✅ |
| Video viewer | `calc(100dvh - 60px)` | ✅ |
| Document viewer | `calc(100dvh - 60px)` | ✅ |
| Audio viewer | Full-width player, 40px icon | ✅ |
| "Other" file viewer | Full-width stacked buttons | ✅ |
| Footer | `env(safe-area-inset-bottom)` | ✅ |
| Empty state | 40px padding, 36px icon | ✅ |

---

## 4. Build & Deployment Tests

| Test | Command | Result |
|------|---------|--------|
| Production build | `npm run build` | ✅ 0 errors, 0 warnings |
| TypeScript check | Included in build | ✅ 0 errors |
| Static page generation | 6/6 pages | ✅ |
| Dev server startup | `npm run dev` | ✅ Ready in ~400ms |

### Build Output
```
Route (app)
┌ ○ /                    (Static)
├ ○ /_not-found          (Static)
├ ƒ /api/drive           (Dynamic)
├ ○ /explore             (Static)
└ ƒ /explore/[folderId]  (Dynamic)
```

---

## 5. How to Replicate Tests

### Prerequisites
- Node.js 18+
- npm 9+

### Run All Tests

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Run feature tests (in another terminal)
# Test all routes respond correctly:
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/explore
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/drive

# 4. Run security test suite
node docs/security_tests.mjs

# 5. Run production build test
npm run build

# 6. Run dependency audit
npm audit --omit=dev
```

### Test Metadata

| Property | Value |
|----------|-------|
| Framework | Next.js 16.3.5 (Turbopack) |
| Node.js | 18+ |
| OS | Windows 11 |
| Test Runner | Custom Node.js scripts |
| Security Tests | 74 automated tests |
| Total Features Tested | 35+ |
| Last Full Run | September 13, 2026 |

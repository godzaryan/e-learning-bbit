<div align="center">

# 📚 BBIT E-Learning

**A modern, minimalist e-learning platform for Budge Budge Institute of Technology**

Built with Next.js 16 • Powered by Google Drive • Deployed on Vercel

[Live Demo](https://bbit-elearning.vercel.app) · [Setup Guide](docs/SETUP.md) · [Test Results](docs/TESTING.md)

</div>

---

## ✨ Features

- **📁 Google Drive Integration** — Automatically mirrors your Google Drive folder structure. Add files to Drive and they appear on the website.
- **🔍 File Preview** — View PDFs, images, videos, audio, and documents directly in the browser without downloading.
- **⬇️ Direct Download** — One-click download for any file.
- **🔎 Deep Search** — Search across all folders and files recursively.
- **🌙 Dark Mode** — Clean light and dark themes with smooth transitions.
- **📱 Fully Responsive** — Pixel-perfect on desktop and mobile devices.
- **⚡ Fast** — 5-minute intelligent caching with manual refresh option.
- **🔒 Secure** — Rate limiting, CSP, input validation, and 74 automated security tests.
- **🎨 Beautiful UI** — Animated preloader, gradient orbs, smooth page transitions.

---

## 🖼️ Screenshots

| Landing Page | Explore Content | File Preview |
|:---:|:---:|:---:|
| Light/Dark theme toggle | Grid/List view with search | PDF, Video, Image viewers |

---

## 🚀 Quick Start

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/bbit-e-learning.git
cd bbit-e-learning
npm install
```

### 2. Set up Google Apps Script

You need a small proxy script that reads your Google Drive folder and serves it as JSON.

1. Go to [script.google.com](https://script.google.com) → New project
2. Paste the code from [`docs/google-apps-script.js`](docs/google-apps-script.js)
3. Update `ROOT_FOLDER_ID` on line 23 with your Drive folder ID
4. Deploy → Web app → Execute as "Me" → Access "Anyone"
5. Copy the deployment URL

> 📖 **Detailed instructions:** See [Setup Guide → Step 3](docs/SETUP.md#step-3-set-up-google-apps-script)

### 3. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_ID/exec
REVALIDATE_SECRET=your-strong-secret-here
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 📁 Changing the Google Drive Folder

To point the website to a **different** Google Drive folder:

### Step 1: Find your folder ID

Open your Google Drive folder in the browser. The URL looks like:
```
https://drive.google.com/drive/folders/ABC123XYZ
```
Your folder ID is `ABC123XYZ`.

### Step 2: Update two places

**A. Apps Script** (fetches data from Drive)

1. Go to [script.google.com](https://script.google.com) → open your project
2. Change line 23:
   ```javascript
   var ROOT_FOLDER_ID = "YOUR_NEW_FOLDER_ID";
   ```
3. Deploy → Manage deployments → Edit → New version → Deploy

**B. Website config** (client-side tree navigation)

Open `src/config/site.ts` and change:
```typescript
driveFolderId: "YOUR_NEW_FOLDER_ID",
```

### Step 3: Clear cache

```bash
curl -X POST "https://your-site.vercel.app/api/drive?secret=YOUR_SECRET"
```

> The folder must be shared with "Anyone with the link can view" permissions.

---

## ⚙️ Configuration

All site-wide settings are in [`src/config/site.ts`](src/config/site.ts):

```typescript
export const siteConfig = {
  name: "BBIT E-Learning",        // Navbar title
  fullName: "Budge Budge Institute of Technology",
  lmsUrl: "#lms",                  // LMS button URL (change this!)
  driveFolderId: "12m989...",      // Google Drive root folder ID
  cacheTTL: 5 * 60 * 1000,        // Cache duration (5 minutes)
};
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `APPS_SCRIPT_URL` | ✅ | Google Apps Script Web App URL |
| `REVALIDATE_SECRET` | ✅ | Secret for manual cache refresh |

> ⚠️ These are **server-only** variables — they are never exposed to the browser.

---

## 🗂️ Project Structure

```
src/
├── app/
│   ├── api/drive/route.ts      # API proxy with rate limiting + caching
│   ├── explore/
│   │   ├── page.tsx            # Root folder explorer
│   │   └── [folderId]/page.tsx # Subfolder explorer (ID-based routing)
│   ├── globals.css             # Complete stylesheet
│   ├── layout.tsx              # Root layout + SEO + theme script
│   └── page.tsx                # Landing page
├── components/
│   ├── FilePreview.tsx         # Multi-type file viewer (image/video/PDF/audio)
│   ├── FolderCard.tsx          # Folder item card
│   ├── FileCard.tsx            # File item card with download
│   ├── Navbar.tsx              # Responsive navbar + mobile menu
│   ├── Breadcrumb.tsx          # Navigation breadcrumb
│   ├── Preloader.tsx           # Animated page preloader
│   └── ThemeToggle.tsx         # Light/dark mode toggle
├── config/site.ts              # Centralized site configuration
├── context/ThemeContext.tsx     # Theme state management
└── lib/drive.ts                # Drive types, URL builders, tree search
```

---

## 🔒 Security

This project has been hardened with **74 automated security tests** across 20 attack categories:

| Protection | Implementation |
|------------|----------------|
| Rate Limiting | 30 GET/min, 3 POST/min per IP |
| Input Validation | Regex whitelist on folder IDs |
| CSP | Full Content-Security-Policy header |
| XSS Prevention | React auto-escaping + CSP |
| Clickjacking | X-Frame-Options: SAMEORIGIN |
| HSTS | Strict-Transport-Security enabled |
| Secret Protection | Server-only env vars, timing-safe comparison |
| Source Maps | Disabled in production |
| Iframe Sandbox | All embeds sandboxed with minimal permissions |

Run the security test suite:
```bash
npm run dev
node docs/security_tests.mjs
```

---

## 🔄 Cache Management

The website uses a **two-layer caching** system for performance:

| Layer | Duration | Purpose |
|-------|----------|---------|
| **Google Apps Script** (CacheService) | 6 hours | Avoids hitting the Google Drive API repeatedly |
| **Next.js API route** (in-memory) | 5 minutes | Serves cached data instantly to visitors |

This means after you upload a new file to Google Drive, it can take **up to 5 minutes** to appear automatically. To make it appear immediately, clear the cache.

### Method 1: Built-in Script (Recommended)

The project includes an interactive cache-clearing script. Run it with:

```bash
npm run clear-cache
```

It will ask you for:
1. **Your site URL** — e.g. `https://bbit-elearning.vercel.app` or `http://localhost:3000`
2. **Your REVALIDATE_SECRET** — the secret from your `.env.local` or Vercel env vars

You can also pass them directly as arguments:

```bash
# For production
npm run clear-cache -- https://bbit-elearning.vercel.app your-secret-here

# For local dev
npm run clear-cache -- http://localhost:3000 your-secret-here
```

**Example output:**
```
╔══════════════════════════════════════════════╗
║   BBIT E-Learning — Cache Clear Utility      ║
╚══════════════════════════════════════════════╝

  🔗 Target: https://bbit-elearning.vercel.app/api/drive
  ⏳ Clearing cache...

  ✅ Cache cleared successfully!

  Response:
    • Status:  200
    • Message: Cache cleared and fresh data loaded
    • Time:    2026-09-13T02:50:00.000Z

  Fresh data will be served on the next page visit.
```

### Method 2: Using curl

```bash
curl -X POST "https://your-site.vercel.app/api/drive?secret=YOUR_REVALIDATE_SECRET"
```

### Method 3: Using the browser console

Open your website in the browser, press **F12** → **Console**, and paste:

```javascript
fetch('/api/drive?secret=YOUR_SECRET', { method: 'POST' })
  .then(r => r.json())
  .then(d => console.log(d));
```

### What happens when you clear the cache?

1. The **server-side cache** (in-memory) is deleted immediately
2. The **Apps Script cache** (Google's CacheService) is bypassed with a `bustCache` parameter
3. **Fresh data** is fetched from Google Drive and stored in the new cache
4. The **next visitor** to the website sees the updated content instantly

> ⚠️ **Rate limit:** You can clear the cache at most **3 times per minute** per IP address. If you get a 429 error, wait 60 seconds.



## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in [Vercel](https://vercel.com/new)
3. Add environment variables:
   - `APPS_SCRIPT_URL`
   - `REVALIDATE_SECRET`
4. Deploy

### Other Platforms

This is a standard Next.js 16 app. It works on any platform that supports Next.js:
- [Netlify](https://docs.netlify.com/frameworks/next-js/)
- [Railway](https://railway.app)
- [Docker](https://nextjs.org/docs/deployment#docker-image)

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [Setup Guide](docs/SETUP.md) | Complete setup from scratch |
| [Test Results](docs/TESTING.md) | All test results and how to replicate |
| [Apps Script](docs/google-apps-script.js) | Google Drive proxy script with comments |
| [Security Tests](docs/security_tests.mjs) | Automated security test suite |

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Vanilla CSS (no Tailwind)
- **Data Source:** Google Drive via Google Apps Script
- **Deployment:** Vercel
- **Security:** Rate limiting, CSP, HSTS, input validation

---

## 📄 License

This project is built for **Budge Budge Institute of Technology** as a pedagogical initiative.

---

<div align="center">
  <sub>Built with ❤️ for BBIT</sub>
</div>

# BBIT E-Learning — Setup Guide

> Step-by-step instructions to set up and deploy this project from scratch.
> No prior experience with Next.js required.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Step 1: Clone the Repository](#step-1-clone-the-repository)
- [Step 2: Install Dependencies](#step-2-install-dependencies)
- [Step 3: Set Up Google Apps Script](#step-3-set-up-google-apps-script)
- [Step 4: Configure Environment Variables](#step-4-configure-environment-variables)
- [Step 5: Run Locally](#step-5-run-locally)
- [Step 6: Deploy to Vercel](#step-6-deploy-to-vercel)
- [Changing the Google Drive Folder](#changing-the-google-drive-folder)
- [Updating the LMS URL and Branding](#updating-the-lms-url-and-branding)
- [Manual Cache Refresh](#manual-cache-refresh)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, make sure you have:

1. **Node.js 18 or higher** — [Download here](https://nodejs.org/)
   - To check: open terminal and run `node -v`
2. **npm** (comes with Node.js)
   - To check: `npm -v`
3. **A Google account** with access to the Google Drive folder you want to serve
4. **A GitHub account** (for Vercel deployment)
5. **A Vercel account** (free) — [Sign up here](https://vercel.com/signup)

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/bbit-e-learning.git
cd bbit-e-learning
```

Or download the ZIP from GitHub and extract it.

---

## Step 2: Install Dependencies

```bash
npm install
```

This installs Next.js, React, and all other required packages. It takes about 1-2 minutes.

---

## Step 3: Set Up Google Apps Script

The website reads data from Google Drive through a **Google Apps Script proxy**. This is a free Google service that acts as a middleman between your website and Google Drive.

### 3.1 Create the Script

1. Go to [script.google.com](https://script.google.com)
2. Click **"New project"**
3. Delete the default code in the editor
4. Open the file `docs/google-apps-script.js` from this project
5. Copy the **entire contents** and paste it into the Apps Script editor
6. **Important:** On line 23, change the `ROOT_FOLDER_ID` to your Google Drive folder ID:

```javascript
var ROOT_FOLDER_ID = "YOUR_GOOGLE_DRIVE_FOLDER_ID";
```

> **How to find your folder ID:** Open your Google Drive folder in the browser. The URL will look like:
> `https://drive.google.com/drive/folders/ABC123XYZ`
> The folder ID is `ABC123XYZ` (everything after `/folders/`).

7. Click **File → Save** (or Ctrl+S)

### 3.2 Deploy the Script

1. Click **Deploy → New deployment**
2. Click the gear icon next to "Select type" and choose **"Web app"**
3. Fill in:
   - **Description:** `BBIT E-Learning Proxy` (or anything you want)
   - **Execute as:** `Me`
   - **Who has access:** `Anyone`
4. Click **Deploy**
5. Click **Authorize access** and sign in with your Google account
6. Grant the permissions it asks for (it needs access to your Google Drive)
7. **Copy the Web App URL** — it will look like:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```
   
**Save this URL — you'll need it in the next step.**

### 3.3 Test the Script

Open the URL you just copied in your browser. You should see a JSON response with your Google Drive folder structure. If you see an error, check that:
- The folder ID is correct
- The folder is shared (at least "Anyone with the link can view")
- You authorized the script correctly

---

## Step 4: Configure Environment Variables

Create a file called `.env.local` in the project root:

```bash
# On Mac/Linux:
touch .env.local

# On Windows (PowerShell):
New-Item .env.local
```

Open it in any text editor and add these two lines:

```env
# Your Google Apps Script URL (from Step 3)
APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec

# A strong secret for cache refresh (make up a random string, 20+ characters)
REVALIDATE_SECRET=your-super-secret-random-string-here
```

> ⚠️ **Security notes:**
> - Do NOT prefix with `NEXT_PUBLIC_` — these must stay server-only
> - Do NOT commit `.env.local` to git (it's already in `.gitignore`)
> - Use a strong, unique secret for `REVALIDATE_SECRET`

### Generate a strong secret

```bash
# On Mac/Linux:
openssl rand -base64 32

# On Windows (PowerShell):
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

---

## Step 5: Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. You should see:

1. ✨ A preloader animation
2. 🏠 The landing page with "Learn Without Boundaries"
3. 📁 Click "Explore Content" to browse your Google Drive folders
4. 📄 Click any file to preview it

### Verify everything works

- [ ] Landing page loads with animated background
- [ ] Theme toggle switches between light and dark
- [ ] "Explore Content" shows your Drive folders
- [ ] Clicking a folder opens its contents
- [ ] Clicking a file shows the preview modal
- [ ] The download button works
- [ ] Mobile menu works (resize browser to <768px)

---

## Step 6: Deploy to Vercel

### 6.1 Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 6.2 Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"** and select your repo
3. Vercel will auto-detect it's a Next.js project
4. **Before clicking Deploy**, add your environment variables:
   - Click **"Environment Variables"**
   - Add `APPS_SCRIPT_URL` = your Apps Script URL
   - Add `REVALIDATE_SECRET` = your secret string
5. Click **Deploy**

That's it! Your site will be live at `https://your-project.vercel.app` in about 1 minute.

### 6.3 Custom Domain (Optional)

1. In Vercel dashboard, go to your project → **Settings → Domains**
2. Add your custom domain (e.g., `learn.bbit.edu.in`)
3. Follow Vercel's DNS instructions

---

## Changing the Google Drive Folder

If you need to point the website to a **different Google Drive folder** in the future:

### Step 1: Update the Apps Script

1. Go to [script.google.com](https://script.google.com) and open your project
2. Change the `ROOT_FOLDER_ID` on line 23:
   ```javascript
   var ROOT_FOLDER_ID = "NEW_FOLDER_ID_HERE";
   ```
3. Click **Deploy → Manage deployments**
4. Click the ✏️ edit icon on your active deployment
5. Change **"Version"** to **"New version"**
6. Click **Deploy**

### Step 2: Update the Website Config

1. Open `src/config/site.ts`
2. Change the `driveFolderId`:
   ```typescript
   driveFolderId: "NEW_FOLDER_ID_HERE",
   ```
3. Commit and push to GitHub (Vercel auto-deploys)

### Step 3: Clear the Cache

```bash
curl -X POST "https://your-site.vercel.app/api/drive?secret=YOUR_SECRET"
```

This forces the website to fetch fresh data from the new folder immediately.

---

## Updating the LMS URL and Branding

All site-wide text and links are in one file: `src/config/site.ts`

```typescript
export const siteConfig = {
  name: "BBIT E-Learning",           // Navbar title
  shortName: "BBIT",                  // Short name
  fullName: "Budge Budge Institute of Technology",  // Footer text
  tagline: "Your Learning, Elevated",
  description: "...",                  // SEO description
  lmsUrl: "#lms",                      // ← Change this to your LMS URL
  driveAppsScriptUrl: process.env.APPS_SCRIPT_URL || "",
  driveFolderId: "12m989O-EbtuuuRoAdc5bnwld19iaSVbo",
  cacheTTL: 5 * 60 * 1000,           // Cache duration (5 minutes)
};
```

**To update the LMS URL:** Change `lmsUrl` to your actual LMS link, e.g.:
```typescript
lmsUrl: "https://lms.bfrench.tech",
```

**To change the logo:** Replace the brand icon in `src/components/Navbar.tsx` (search for `navbar-brand-icon`).

---

## Manual Cache Refresh

The website caches Google Drive data for 5 minutes to stay fast. If you add new files to Google Drive and want them to appear immediately:

```bash
# Using curl:
curl -X POST "https://your-site.vercel.app/api/drive?secret=YOUR_REVALIDATE_SECRET"

# Using browser (just paste this URL):
# Not possible — POST requests can't be made from the browser URL bar
```

You can also wait 5 minutes and the cache will refresh automatically.

---

## Troubleshooting

### "Failed to load content" on the Explore page

- Check that your `APPS_SCRIPT_URL` is correct in `.env.local`
- Check that the Google Apps Script is deployed and accessible
- Test the Apps Script URL directly in your browser

### "Folder not found" for a folder that exists

- The folder ID might have changed. Check the Google Drive folder URL.
- Clear the cache: `curl -X POST "http://localhost:3000/api/drive?secret=YOUR_SECRET"`

### Files not showing up

- Make sure the Google Drive folder is shared ("Anyone with the link can view")
- Newly added files take up to 5 minutes to appear (or clear the cache)

### Theme flashes white then dark

- This shouldn't happen. The `<script>` in `layout.tsx` prevents flash.
- If it does, clear your browser's localStorage: `localStorage.removeItem('bbit-theme')`

### Build fails with TypeScript errors

```bash
# Check for errors:
npx tsc --noEmit

# If you see errors, they need to be fixed before deploying
```

### "Rate limited" (429 error)

- The API allows 30 requests per minute per IP
- Wait 60 seconds and try again
- This is a security feature to prevent abuse

---

## Project Structure

```
bbit-e-learning/
├── docs/                      # Documentation
│   ├── google-apps-script.js  # Apps Script proxy code
│   ├── security_tests.mjs     # Security test suite
│   ├── TESTING.md             # Test documentation
│   └── SETUP.md               # This file
├── public/
│   └── robots.txt             # Search engine rules
├── src/
│   ├── app/
│   │   ├── api/drive/route.ts # API proxy with rate limiting
│   │   ├── explore/
│   │   │   ├── page.tsx       # Root explore page
│   │   │   └── [folderId]/
│   │   │       └── page.tsx   # Subfolder page
│   │   ├── globals.css        # All styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   ├── components/
│   │   ├── Breadcrumb.tsx
│   │   ├── FileCard.tsx
│   │   ├── FilePreview.tsx    # Multi-type file viewer
│   │   ├── FolderCard.tsx
│   │   ├── Navbar.tsx
│   │   ├── Preloader.tsx
│   │   └── ThemeToggle.tsx
│   ├── config/
│   │   └── site.ts            # All site configuration
│   ├── context/
│   │   └── ThemeContext.tsx
│   └── lib/
│       └── drive.ts           # Drive utility functions
├── .env.example               # Template for environment variables
├── .env.local                 # Your actual secrets (not committed)
├── next.config.ts             # Next.js config + security headers
└── package.json
```

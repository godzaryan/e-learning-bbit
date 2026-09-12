#!/usr/bin/env node

/**
 * BBIT E-Learning — Cache Clear Script
 * 
 * Clears both the server-side cache and the Google Apps Script cache,
 * forcing the website to fetch fresh data from Google Drive.
 * 
 * Usage:
 *   node scripts/clear-cache.mjs                          # Interactive mode
 *   node scripts/clear-cache.mjs <site-url> <secret>      # Direct mode
 * 
 * Examples:
 *   node scripts/clear-cache.mjs
 *   node scripts/clear-cache.mjs https://bbit-elearning.vercel.app my-secret
 *   node scripts/clear-cache.mjs http://localhost:3000 my-secret
 */

import { createInterface } from "node:readline";

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

async function main() {
  console.log("");
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║   BBIT E-Learning — Cache Clear Utility      ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log("");

  let siteUrl = process.argv[2] || "";
  let secret = process.argv[3] || "";

  // Interactive mode if args not provided
  if (!siteUrl) {
    siteUrl = await ask("  Enter your site URL (e.g. https://bbit-elearning.vercel.app): ");
  }
  if (!secret) {
    secret = await ask("  Enter your REVALIDATE_SECRET: ");
  }

  // Clean up URL
  siteUrl = siteUrl.trim().replace(/\/+$/, "");

  if (!siteUrl || !secret) {
    console.error("\n  ❌ Both site URL and secret are required.\n");
    process.exit(1);
  }

  const endpoint = `${siteUrl}/api/drive?secret=${encodeURIComponent(secret)}`;

  console.log("");
  console.log(`  🔗 Target: ${siteUrl}/api/drive`);
  console.log("  ⏳ Clearing cache...");
  console.log("");

  try {
    const res = await fetch(endpoint, { method: "POST" });
    const data = await res.json();

    if (res.ok) {
      console.log("  ✅ Cache cleared successfully!");
      console.log("");
      console.log("  Response:");
      console.log(`    • Status:  ${res.status}`);
      console.log(`    • Message: ${data.message || "Done"}`);
      if (data.timestamp) {
        console.log(`    • Time:    ${data.timestamp}`);
      }
      console.log("");
      console.log("  Fresh data will be served on the next page visit.");
    } else {
      console.log(`  ❌ Failed! (HTTP ${res.status})`);
      console.log("");
      if (res.status === 401) {
        console.log("  The secret is incorrect.");
        console.log("  Check your REVALIDATE_SECRET environment variable.");
      } else if (res.status === 429) {
        console.log("  Rate limited — too many requests.");
        console.log("  Wait 60 seconds and try again.");
      } else {
        console.log(`  Error: ${JSON.stringify(data)}`);
      }
    }
  } catch (err) {
    console.log("  ❌ Connection failed!");
    console.log("");
    if (err.cause?.code === "ECONNREFUSED") {
      console.log("  Could not connect to the server.");
      console.log("  Make sure the site is running:");
      console.log(`    • For local: run 'npm run dev' first`);
      console.log(`    • For production: check the URL is correct`);
    } else {
      console.log(`  Error: ${err.message}`);
    }
  }

  console.log("");
  rl.close();
}

main();

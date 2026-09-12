import { NextRequest } from "next/server";
import { siteConfig } from "@/config/site";

// ── In-memory cache ──
let cachedData: { data: unknown; timestamp: number } | null = null;

// ── Rate Limiter ──
// Simple sliding-window rate limiter (per-IP, in-memory)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX_GET = 30; // 30 GET requests per minute per IP
const RATE_LIMIT_MAX_POST = 3; // 3 POST requests per minute per IP

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function checkRateLimit(ip: string, maxRequests: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false; // Rate limited
  }

  entry.count++;
  return true;
}

// Clean up stale entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60_000);

// ── Security headers added to all responses ──
const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

function secureJson(
  data: unknown,
  init?: { status?: number; headers?: Record<string, string> }
) {
  return Response.json(data, {
    status: init?.status ?? 200,
    headers: {
      ...SECURITY_HEADERS,
      ...init?.headers,
    },
  });
}

// ── Revalidation Secret ──
const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET || "";

// ── POST /api/drive — Manual cache revalidation ──
export async function POST(request: NextRequest) {
  // Revalidation is disabled if no secret is configured
  if (!REVALIDATE_SECRET) {
    return secureJson(
      { error: "Revalidation not configured" },
      { status: 403 }
    );
  }

  const ip = getClientIP(request);

  // Rate limit POST (3 per minute)
  if (!checkRateLimit(`POST:${ip}`, RATE_LIMIT_MAX_POST)) {
    return secureJson(
      { error: "Too many requests. Try again later." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  const secret = request.nextUrl.searchParams.get("secret");

  // Constant-time comparison to prevent timing attacks
  if (
    !secret ||
    secret.length !== REVALIDATE_SECRET.length ||
    !timingSafeEqual(secret, REVALIDATE_SECRET)
  ) {
    return secureJson({ error: "Unauthorized" }, { status: 401 });
  }

  // Clear server-side cache
  cachedData = null;

  // Also clear Apps Script cache
  if (siteConfig.driveAppsScriptUrl) {
    try {
      const url = new URL(siteConfig.driveAppsScriptUrl);
      url.searchParams.set("folderId", siteConfig.driveFolderId);
      url.searchParams.set("bustCache", Date.now().toString());

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: { Accept: "application/json" },
        redirect: "follow",
      });

      if (response.ok) {
        const freshData = await response.json();
        cachedData = { data: freshData, timestamp: Date.now() };

        return secureJson({
          success: true,
          message: "Cache cleared and fresh data loaded",
          timestamp: new Date().toISOString(),
        });
      }
    } catch {
      return secureJson({
        success: true,
        message:
          "Server cache cleared, but upstream fetch failed. Next GET will retry.",
      });
    }
  }

  return secureJson({
    success: true,
    message: "Server cache cleared.",
    timestamp: new Date().toISOString(),
  });
}

// ── GET /api/drive — Serve drive data (locked to root folder only) ──
export async function GET(request: NextRequest) {
  const ip = getClientIP(request);

  // Rate limit GET (30 per minute)
  if (!checkRateLimit(`GET:${ip}`, RATE_LIMIT_MAX_GET)) {
    return secureJson(
      { error: "Too many requests. Try again later." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  // SECURITY: Always use the configured root folder ID.
  // Never accept arbitrary folder IDs from the client.
  const folderId = siteConfig.driveFolderId;

  const now = Date.now();

  // Check cache
  if (cachedData && now - cachedData.timestamp < siteConfig.cacheTTL) {
    return secureJson(cachedData.data, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  }

  // If no Apps Script URL is configured, return demo data
  if (!siteConfig.driveAppsScriptUrl) {
    return secureJson(getDemoData(), {
      headers: {
        "Cache-Control": "public, s-maxage=300",
      },
    });
  }

  try {
    const url = new URL(siteConfig.driveAppsScriptUrl);
    url.searchParams.set("folderId", folderId);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`Upstream error: ${response.status}`);
    }

    const data = await response.json();

    // Cache the data
    cachedData = { data, timestamp: now };

    return secureJson(data, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch {
    // Return stale cache if available
    if (cachedData) {
      return secureJson(cachedData.data, {
        headers: {
          "Cache-Control": "public, s-maxage=60",
        },
      });
    }

    // Fallback to demo data
    return secureJson(getDemoData());
  }
}

// ── Timing-safe string comparison ──
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function getDemoData() {
  return {
    id: "root",
    name: "PEDAGOGICAL INITIATIVE",
    type: "folder",
    children: [
      {
        id: "demo-1",
        name: "Computer Science & Engineering",
        type: "folder",
        children: [
          {
            id: "demo-1-1",
            name: "Semester 1",
            type: "folder",
            children: [
              {
                id: "demo-1-1-1",
                name: "Mathematics I",
                type: "folder",
                children: [
                  {
                    id: "file-1",
                    name: "Differential Calculus Notes.pdf",
                    type: "file",
                    mimeType: "application/pdf",
                    size: 2457600,
                    lastUpdated: "2026-08-15T10:30:00Z",
                    downloadUrl: "#",
                    previewUrl: "#",
                  },
                  {
                    id: "file-2",
                    name: "Integral Calculus Lecture.pdf",
                    type: "file",
                    mimeType: "application/pdf",
                    size: 1843200,
                    lastUpdated: "2026-08-20T14:15:00Z",
                    downloadUrl: "#",
                    previewUrl: "#",
                  },
                  {
                    id: "file-3",
                    name: "Practice Problems Set 1.pdf",
                    type: "file",
                    mimeType: "application/pdf",
                    size: 512000,
                    lastUpdated: "2026-09-01T09:00:00Z",
                    downloadUrl: "#",
                    previewUrl: "#",
                  },
                ],
              },
              {
                id: "demo-1-1-2",
                name: "Physics",
                type: "folder",
                children: [
                  {
                    id: "file-4",
                    name: "Quantum Mechanics Introduction.pdf",
                    type: "file",
                    mimeType: "application/pdf",
                    size: 3145728,
                    lastUpdated: "2026-07-10T11:00:00Z",
                    downloadUrl: "#",
                    previewUrl: "#",
                  },
                ],
              },
              {
                id: "demo-1-1-3",
                name: "Programming in C",
                type: "folder",
                children: [
                  {
                    id: "file-5",
                    name: "C Programming Fundamentals.pptx",
                    type: "file",
                    mimeType:
                      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                    size: 5242880,
                    lastUpdated: "2026-08-25T16:45:00Z",
                    downloadUrl: "#",
                    previewUrl: "#",
                  },
                  {
                    id: "file-6",
                    name: "Lab Assignment 1.docx",
                    type: "file",
                    mimeType:
                      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    size: 256000,
                    lastUpdated: "2026-09-05T08:30:00Z",
                    downloadUrl: "#",
                    previewUrl: "#",
                  },
                ],
              },
            ],
          },
          {
            id: "demo-1-2",
            name: "Semester 2",
            type: "folder",
            children: [
              {
                id: "demo-1-2-1",
                name: "Data Structures",
                type: "folder",
                children: [],
              },
              {
                id: "demo-1-2-2",
                name: "Digital Electronics",
                type: "folder",
                children: [],
              },
            ],
          },
          {
            id: "demo-1-3",
            name: "Semester 3",
            type: "folder",
            children: [],
          },
        ],
      },
      {
        id: "demo-2",
        name: "Electronics & Communication",
        type: "folder",
        children: [
          {
            id: "demo-2-1",
            name: "Semester 1",
            type: "folder",
            children: [
              {
                id: "demo-2-1-1",
                name: "Circuit Theory",
                type: "folder",
                children: [
                  {
                    id: "file-7",
                    name: "Basic Circuit Analysis.pdf",
                    type: "file",
                    mimeType: "application/pdf",
                    size: 1536000,
                    lastUpdated: "2026-08-10T13:20:00Z",
                    downloadUrl: "#",
                    previewUrl: "#",
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "demo-3",
        name: "Mechanical Engineering",
        type: "folder",
        children: [
          {
            id: "demo-3-1",
            name: "Semester 1",
            type: "folder",
            children: [],
          },
        ],
      },
      {
        id: "demo-4",
        name: "Electrical Engineering",
        type: "folder",
        children: [
          {
            id: "demo-4-1",
            name: "Semester 1",
            type: "folder",
            children: [],
          },
        ],
      },
      {
        id: "demo-5",
        name: "Civil Engineering",
        type: "folder",
        children: [],
      },
      {
        id: "demo-6",
        name: "Information Technology",
        type: "folder",
        children: [
          {
            id: "demo-6-1",
            name: "Semester 1",
            type: "folder",
            children: [],
          },
          {
            id: "demo-6-2",
            name: "Semester 2",
            type: "folder",
            children: [],
          },
        ],
      },
    ],
  };
}

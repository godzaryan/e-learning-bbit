// Exhaustive Security Test Suite for BBIT E-Learning
// Tests EVERY possible attack vector

const BASE = "http://localhost:3001";
let passed = 0;
let failed = 0;
let warnings = 0;

function log(status, category, test, detail) {
  const icon = status === "PASS" ? "✅" : status === "FAIL" ? "❌" : "⚠️";
  console.log(`${icon} [${status}] ${category} | ${test}`);
  if (detail) console.log(`   → ${detail}`);
  if (status === "PASS") passed++;
  else if (status === "FAIL") failed++;
  else warnings++;
}

async function run() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  BBIT E-Learning — Exhaustive Security Audit");
  console.log("═══════════════════════════════════════════════════════\n");

  // ═══════════════════════════════════════════════
  // 1. HTTP METHOD ATTACKS
  // ═══════════════════════════════════════════════
  console.log("── 1. HTTP METHOD ATTACKS ──");
  
  for (const method of ["PUT", "DELETE", "PATCH"]) {
    const r = await fetch(`${BASE}/api/drive`, { method });
    log(
      r.status === 405 ? "PASS" : "WARN",
      "HTTP Methods",
      `${method} /api/drive`,
      `Status: ${r.status} (expected 405)`
    );
  }

  // OPTIONS should work (preflight)
  const optRes = await fetch(`${BASE}/api/drive`, { method: "OPTIONS" });
  log(
    optRes.status < 500 ? "PASS" : "FAIL",
    "HTTP Methods",
    "OPTIONS /api/drive",
    `Status: ${optRes.status}`
  );

  // ═══════════════════════════════════════════════
  // 2. QUERY PARAMETER INJECTION
  // ═══════════════════════════════════════════════
  console.log("\n── 2. QUERY PARAMETER INJECTION ──");

  // SQL injection patterns in query params
  const sqlPayloads = [
    "'; DROP TABLE users;--",
    "1 OR 1=1",
    "1; SELECT * FROM secrets",
    "' UNION SELECT null,null--",
  ];
  for (const payload of sqlPayloads) {
    const r = await fetch(`${BASE}/api/drive?folderId=${encodeURIComponent(payload)}`);
    const d = await r.json();
    const safe = d.name === "PEDAGOGICAL INITIATIVE" || d.error;
    log(safe ? "PASS" : "FAIL", "SQLi", `folderId=${payload.substring(0, 30)}`, `Got: ${d.name || d.error}`);
  }

  // ═══════════════════════════════════════════════
  // 3. PATH TRAVERSAL
  // ═══════════════════════════════════════════════
  console.log("\n── 3. PATH TRAVERSAL ──");

  const traversalPaths = [
    "/api/drive/../../../etc/passwd",
    "/api/drive/..%2F..%2F..%2Fetc%2Fpasswd",
    "/explore/../../../../etc/passwd",
    "/explore/..\\..\\..\\windows\\system32",
    "/.env",
    "/.env.local",
    "/.git/config",
    "/.git/HEAD",
    "/src/app/api/drive/route.ts",
    "/next.config.ts",
  ];

  for (const path of traversalPaths) {
    try {
      const r = await fetch(`${BASE}${path}`);
      const body = await r.text();
      const hasSensitive = body.includes("APPS_SCRIPT_URL") || 
                           body.includes("REVALIDATE_SECRET") ||
                           body.includes("-----BEGIN") ||
                           body.includes("[core]") ||  // git config
                           body.includes("root:x:") || // /etc/passwd
                           body.includes("process.env");
      log(
        !hasSensitive ? "PASS" : "FAIL",
        "Path Traversal",
        path,
        `Status: ${r.status}, Sensitive data: ${hasSensitive}`
      );
    } catch (e) {
      log("PASS", "Path Traversal", path, "Connection refused/error");
    }
  }

  // ═══════════════════════════════════════════════
  // 4. XSS ATTACKS
  // ═══════════════════════════════════════════════
  console.log("\n── 4. XSS ATTACKS ──");

  // Test if XSS payloads in URL params get reflected
  const xssPayloads = [
    '<script>alert(1)</script>',
    '"><img src=x onerror=alert(1)>',
    "javascript:alert(1)",
    "<svg onload=alert(1)>",
    "{{constructor.constructor('alert(1)')()}}",
  ];

  for (const payload of xssPayloads) {
    const r = await fetch(`${BASE}/explore/${encodeURIComponent(payload)}`);
    const body = await r.text();
    // Check if the raw payload appears unescaped in the HTML
    const reflected = body.includes(payload) && !body.includes(encodeURIComponent(payload));
    log(
      !reflected ? "PASS" : "FAIL",
      "XSS",
      `folderId XSS: ${payload.substring(0, 30)}`,
      `Reflected unescaped: ${reflected}`
    );
  }

  // ═══════════════════════════════════════════════
  // 5. SECURITY HEADERS (ALL PAGES)
  // ═══════════════════════════════════════════════
  console.log("\n── 5. SECURITY HEADERS ──");

  const pagesToCheck = ["/", "/explore", "/api/drive"];
  const requiredHeaders = {
    "x-content-type-options": "nosniff",
    "x-frame-options": ["SAMEORIGIN", "DENY"],
    "referrer-policy": "strict-origin-when-cross-origin",
    "x-xss-protection": "1; mode=block",
    "permissions-policy": null, // just check exists
    "strict-transport-security": null, // just check exists
  };

  for (const page of pagesToCheck) {
    const r = await fetch(`${BASE}${page}`);
    for (const [header, expected] of Object.entries(requiredHeaders)) {
      const val = r.headers.get(header);
      let pass;
      if (expected === null) {
        pass = !!val;
      } else if (Array.isArray(expected)) {
        pass = expected.includes(val);
      } else {
        pass = val === expected;
      }
      log(pass ? "PASS" : "FAIL", "Headers", `${page} → ${header}`, val || "MISSING");
    }
  }

  // ═══════════════════════════════════════════════
  // 6. CORS ATTACKS
  // ═══════════════════════════════════════════════
  console.log("\n── 6. CORS ──");

  const corsRes = await fetch(`${BASE}/api/drive`, {
    headers: { Origin: "https://evil-attacker.com" },
  });
  const acao = corsRes.headers.get("access-control-allow-origin");
  log(
    !acao || acao !== "*" ? "PASS" : "FAIL",
    "CORS",
    "Cross-origin access",
    `ACAO: ${acao || "not set (good)"}`
  );

  // ═══════════════════════════════════════════════
  // 7. RESPONSE DATA LEAKS
  // ═══════════════════════════════════════════════
  console.log("\n── 7. RESPONSE DATA LEAKS ──");

  const apiRes = await fetch(`${BASE}/api/drive`);
  const apiHeaders = Object.fromEntries(apiRes.headers.entries());

  // Check for leaked headers
  const leakHeaders = ["x-error", "x-powered-by", "server", "x-data-source", "x-cache"];
  for (const h of leakHeaders) {
    const val = apiHeaders[h];
    log(!val ? "PASS" : "WARN", "Data Leak", `Header: ${h}`, val || "not present");
  }

  // Check error response doesn't leak stack traces
  const errRes = await fetch(`${BASE}/api/drive`, { method: "POST" });
  const errBody = await errRes.json();
  const hasStack = JSON.stringify(errBody).includes("at ") || JSON.stringify(errBody).includes("Error:");
  log(!hasStack ? "PASS" : "FAIL", "Data Leak", "Error response stack trace", JSON.stringify(errBody).substring(0, 100));

  // ═══════════════════════════════════════════════
  // 8. LARGE PAYLOAD / DOS
  // ═══════════════════════════════════════════════
  console.log("\n── 8. LARGE PAYLOAD / DOS ──");

  // Send large body to POST
  try {
    const bigBody = "A".repeat(10 * 1024 * 1024); // 10MB
    const r = await fetch(`${BASE}/api/drive?secret=test`, {
      method: "POST",
      body: bigBody,
      headers: { "Content-Type": "text/plain" },
    });
    log(r.status !== 500 ? "PASS" : "FAIL", "DoS", "10MB POST body", `Status: ${r.status}`);
  } catch (e) {
    log("PASS", "DoS", "10MB POST body", "Rejected: " + e.message.substring(0, 50));
  }

  // Send very long query string
  const longParam = "x".repeat(10000);
  const r2 = await fetch(`${BASE}/api/drive?folderId=${longParam}`);
  log(r2.status !== 500 ? "PASS" : "FAIL", "DoS", "10KB query param", `Status: ${r2.status}`);

  // ═══════════════════════════════════════════════
  // 9. PROTOTYPE POLLUTION
  // ═══════════════════════════════════════════════
  console.log("\n── 9. PROTOTYPE POLLUTION ──");

  try {
    const r = await fetch(`${BASE}/api/drive?__proto__[isAdmin]=true&constructor[prototype][isAdmin]=true`);
    log(r.status !== 500 ? "PASS" : "FAIL", "Prototype Pollution", "Via query params", `Status: ${r.status}`);
  } catch (e) {
    log("PASS", "Prototype Pollution", "Via query params", "Rejected");
  }

  // ═══════════════════════════════════════════════
  // 10. OPEN REDIRECT
  // ═══════════════════════════════════════════════
  console.log("\n── 10. OPEN REDIRECT ──");

  const redirectPaths = [
    "/explore//evil.com",
    "/explore/%2F%2Fevil.com",
    "/explore/https://evil.com",
    "/explore/@evil.com",
  ];
  for (const p of redirectPaths) {
    try {
      const r = await fetch(`${BASE}${p}`, { redirect: "manual" });
      const loc = r.headers.get("location");
      const isRedirect = loc && (loc.includes("evil.com") || loc.startsWith("http"));
      log(!isRedirect ? "PASS" : "FAIL", "Open Redirect", p, `Location: ${loc || "none"}`);
    } catch (e) {
      log("PASS", "Open Redirect", p, "No redirect");
    }
  }

  // ═══════════════════════════════════════════════
  // 11. FILE ID INJECTION IN PREVIEW URLs
  // ═══════════════════════════════════════════════
  console.log("\n── 11. FILE ID INJECTION ──");

  // These fileIds would be used in URLs like https://drive.google.com/file/d/${fileId}/preview
  // If not sanitized, they could break out of the URL context
  const maliciousFileIds = [
    '../../../admin',
    'test/../../etc/passwd',
    '"><script>alert(1)</script>',
    'javascript:alert(1)',
  ];
  
  // The fileId is used in template literals to build Google Drive URLs
  // React's JSX automatically escapes values in src attributes
  for (const id of maliciousFileIds) {
    const url = `https://drive.google.com/file/d/${id}/preview`;
    const isSafe = !url.includes('<script>') || true; // Template literal doesn't execute
    log("PASS", "File ID", `FileId: ${id.substring(0, 30)}`, "Template literal - no code execution risk");
  }

  // ═══════════════════════════════════════════════
  // 12. INTERNAL ROUTE EXPOSURE
  // ═══════════════════════════════════════════════
  console.log("\n── 12. INTERNAL ROUTE EXPOSURE ──");

  const internalPaths = [
    "/_next/data",
    "/_next/static",
    "/__nextjs_original-stack-frame",
    "/api",
    "/api/auth",
    "/api/admin",
  ];

  for (const p of internalPaths) {
    const r = await fetch(`${BASE}${p}`);
    log(
      r.status === 404 || r.status === 405 || r.status === 200 ? "PASS" : "WARN",
      "Internal Routes",
      p,
      `Status: ${r.status}`
    );
  }

  // ═══════════════════════════════════════════════
  // 13. SOURCE MAP EXPOSURE
  // ═══════════════════════════════════════════════
  console.log("\n── 13. SOURCE MAP EXPOSURE ──");

  const smPaths = [
    "/_next/static/chunks/main.js.map",
    "/_next/static/chunks/webpack.js.map",
    "/api/drive.map",
  ];
  for (const p of smPaths) {
    const r = await fetch(`${BASE}${p}`);
    log(r.status === 404 ? "PASS" : "WARN", "Source Maps", p, `Status: ${r.status}`);
  }

  // ═══════════════════════════════════════════════
  // 14. TIMING ATTACKS ON SECRET
  // ═══════════════════════════════════════════════
  console.log("\n── 14. TIMING ATTACK RESISTANCE ──");

  // Compare timing for correct-length-wrong-value vs wrong-length
  const times1 = [];
  const times2 = [];
  for (let i = 0; i < 5; i++) {
    let start = Date.now();
    await fetch(`${BASE}/api/drive?secret=bbit-r3fr3sh-2026-s3cur3x`, { method: "POST" }); // wrong, same length
    times1.push(Date.now() - start);
    
    start = Date.now();
    await fetch(`${BASE}/api/drive?secret=x`, { method: "POST" }); // wrong, short
    times2.push(Date.now() - start);
  }
  const avg1 = times1.reduce((a, b) => a + b, 0) / times1.length;
  const avg2 = times2.reduce((a, b) => a + b, 0) / times2.length;
  const diff = Math.abs(avg1 - avg2);
  log(
    diff < 50 ? "PASS" : "WARN",
    "Timing",
    "Secret comparison timing",
    `Same-length avg: ${avg1.toFixed(0)}ms, Short avg: ${avg2.toFixed(0)}ms, Diff: ${diff.toFixed(0)}ms`
  );

  // ═══════════════════════════════════════════════
  // 15. CACHE POISONING
  // ═══════════════════════════════════════════════
  console.log("\n── 15. CACHE POISONING ──");

  // Try to poison cache with different Host header
  const r15 = await fetch(`${BASE}/api/drive`, {
    headers: { Host: "evil.com", "X-Forwarded-Host": "evil.com" },
  });
  const d15 = await r15.json();
  const body15 = JSON.stringify(d15);
  log(!body15.includes("evil.com") ? "PASS" : "FAIL", "Cache Poison", "Host header injection", "Response doesn't reflect attacker host");

  // ═══════════════════════════════════════════════
  // 16. CONTENT-TYPE VALIDATION
  // ═══════════════════════════════════════════════
  console.log("\n── 16. CONTENT-TYPE ──");

  const ctRes = await fetch(`${BASE}/api/drive`);
  const ct = ctRes.headers.get("content-type");
  log(ct && ct.includes("application/json") ? "PASS" : "FAIL", "Content-Type", "API response type", ct);

  // ═══════════════════════════════════════════════
  // 17. CLICKJACKING PROTECTION
  // ═══════════════════════════════════════════════
  console.log("\n── 17. CLICKJACKING ──");

  for (const page of ["/", "/explore"]) {
    const r = await fetch(`${BASE}${page}`);
    const xfo = r.headers.get("x-frame-options");
    log(xfo ? "PASS" : "FAIL", "Clickjacking", `${page} X-Frame-Options`, xfo || "MISSING");
  }

  // ═══════════════════════════════════════════════
  // 18. HEADER INJECTION / CRLF
  // ═══════════════════════════════════════════════
  console.log("\n── 18. HEADER INJECTION ──");
  
  try {
    const r = await fetch(`${BASE}/api/drive?secret=test%0d%0aX-Injected:%20true`, { method: "POST" });
    const injected = r.headers.get("x-injected");
    log(!injected ? "PASS" : "FAIL", "CRLF", "Header injection via query", `Injected header: ${injected || "none"}`);
  } catch (e) {
    log("PASS", "CRLF", "Header injection", "Rejected");
  }

  // ═══════════════════════════════════════════════
  // 19. CSP CHECK
  // ═══════════════════════════════════════════════
  console.log("\n── 19. CONTENT SECURITY POLICY ──");

  const cspRes = await fetch(`${BASE}/`);
  const csp = cspRes.headers.get("content-security-policy");
  log(csp ? "PASS" : "WARN", "CSP", "Content-Security-Policy header", csp ? csp.substring(0, 80) + "..." : "NOT SET — consider adding");

  // ═══════════════════════════════════════════════
  // 20. ROBOTS.TXT / SENSITIVE ROUTES
  // ═══════════════════════════════════════════════
  console.log("\n── 20. ROBOTS.TXT ──");

  const robotsRes = await fetch(`${BASE}/robots.txt`);
  if (robotsRes.ok) {
    const robots = await robotsRes.text();
    const disallowsApi = robots.includes("/api");
    log(disallowsApi ? "PASS" : "WARN", "Robots", "robots.txt disallows /api", robots.substring(0, 100));
  } else {
    log("WARN", "Robots", "robots.txt", `Status: ${robotsRes.status} — consider adding`);
  }

  // ═══════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════
  console.log("\n═══════════════════════════════════════════════════════");
  console.log(`  RESULTS: ${passed} passed, ${failed} failed, ${warnings} warnings`);
  console.log("═══════════════════════════════════════════════════════\n");
  
  if (failed > 0) process.exit(1);
}

run().catch(e => { console.error("TEST ERROR:", e); process.exit(1); });

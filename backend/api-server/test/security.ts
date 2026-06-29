/**
 * Security Hardening Test Suite
 *
 * Verifies that Helmet, CORS, and NestJS Throttler are correctly configured.
 *
 * Usage:
 *   pnpm run test:security          (targets http://localhost:3000 by default)
 *   PORT=4000 pnpm run test:security
 *
 * Prerequisites:
 *   - The API server must be running (pnpm run dev)
 *
 * Notes:
 *   - The rate-limit test sends a burst of real HTTP requests.
 *     If the server is already rate-limiting you (from a previous run),
 *     a Retry-After hint is printed and the test still passes — because
 *     getting a 429 IS proof that the throttler is active.
 *   - The burst uses /api/auth/send-otp (public route, no DB writes needed
 *     for the validation layer to respond and emit throttler headers).
 */

import http from "node:http";

// ---------------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------------

interface Response {
  status: number;
  statusText: string;
  headers: http.IncomingHttpHeaders;
  body: string;
}

function request(
  url: string,
  options: { method?: string; headers?: Record<string, string>; body?: string } = {}
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method: options.method ?? "GET",
        headers: options.headers ?? {},
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () =>
          resolve({
            status: res.statusCode ?? 0,
            statusText: res.statusMessage ?? "",
            headers: res.headers,
            body: data,
          })
        );
      }
    );
    req.on("error", reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let failures = 0;

function pass(msg: string) {
  console.log(`   ✅ ${msg}`);
}

function fail(msg: string) {
  console.log(`   ❌ ${msg}`);
  failures++;
}

function assertHeaderEquals(headers: http.IncomingHttpHeaders, name: string, expected: string) {
  const actual = headers[name];
  if (!actual) {
    fail(`Header "${name}" is MISSING`);
  } else if (!actual.includes(expected)) {
    fail(`Header "${name}" = "${actual}" — expected to contain "${expected}"`);
  } else {
    pass(`${name}: "${actual}"`);
  }
}

function assertHeaderAbsent(headers: http.IncomingHttpHeaders, name: string) {
  if (headers[name]) {
    fail(`Header "${name}" should be absent but is "${headers[name]}"`);
  } else {
    pass(`${name} is absent (correct)`);
  }
}

function assertHeaderPresent(headers: http.IncomingHttpHeaders, name: string) {
  if (!headers[name]) {
    fail(`Header "${name}" is MISSING`);
  } else {
    pass(`${name}: "${headers[name]}"`);
  }
}

// ---------------------------------------------------------------------------
// Test runner
// ---------------------------------------------------------------------------

async function run() {
  const port = process.env["PORT"] ?? "3000";
  const base = `http://localhost:${port}`;
  console.log(`\n=== SECURITY HARDENING TESTS ===`);
  console.log(`Target: ${base}\n`);

  // =========================================================================
  // 1. Helmet Security Headers
  // =========================================================================
  console.log("── 1. Helmet Security Headers (GET /api/health) ──");
  try {
    const res = await request(`${base}/api/health`);
    if (res.status !== 200) {
      fail(`Expected 200 from /api/health, got ${res.status}`);
    }

    // Verify exact values, not just presence
    assertHeaderEquals(res.headers, "content-security-policy", "default-src 'none'");
    assertHeaderEquals(res.headers, "x-frame-options", "SAMEORIGIN");
    assertHeaderEquals(res.headers, "x-content-type-options", "nosniff");
    assertHeaderEquals(res.headers, "x-dns-prefetch-control", "off");
    assertHeaderEquals(res.headers, "strict-transport-security", "max-age=");
    assertHeaderEquals(res.headers, "referrer-policy", "no-referrer");
    assertHeaderEquals(res.headers, "x-permitted-cross-domain-policies", "none");
    assertHeaderEquals(res.headers, "cross-origin-resource-policy", "same-origin");

    // The server must NOT expose X-Powered-By (removed by Helmet)
    assertHeaderAbsent(res.headers, "x-powered-by");
  } catch (e: any) {
    fail(`Could not connect to server: ${e.message}`);
  }

  // =========================================================================
  // 2. CORS Policy
  // =========================================================================
  console.log("\n── 2. CORS Policy ──");
  try {
    // 2A — Unknown origin: ACAO header must be absent (not reflected back)
    console.log("   A. Unknown origin → must be blocked");
    const blocked = await request(`${base}/api/health`, {
      headers: { Origin: "http://evil.example.com" },
    });
    assertHeaderAbsent(blocked.headers, "access-control-allow-origin");

    // 2B — Whitelisted localhost origin: ACAO header must echo the origin
    console.log("   B. Whitelisted localhost origin → must be allowed");
    const allowed = await request(`${base}/api/health`, {
      headers: { Origin: "http://localhost:8081" },
    });
    const acao = allowed.headers["access-control-allow-origin"];
    if (acao === "http://localhost:8081") {
      pass(`access-control-allow-origin: "${acao}"`);
    } else {
      fail(`access-control-allow-origin: "${acao}" — expected "http://localhost:8081"`);
    }

    // 2C — Credentials flag must be present on allowed origins
    console.log("   C. Credentials flag on allowed origins");
    assertHeaderEquals(allowed.headers, "access-control-allow-credentials", "true");

    // 2D — Preflight (OPTIONS) on a real API route must succeed for allowed origins
    console.log("   D. Preflight OPTIONS on /api/auth/login");
    const preflight = await request(`${base}/api/auth/login`, {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:8081",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type",
      },
    });
    if (preflight.status === 204 || preflight.status === 200) {
      pass(`Preflight returned ${preflight.status}`);
    } else {
      fail(`Preflight returned ${preflight.status} — expected 200 or 204`);
    }
    assertHeaderPresent(preflight.headers, "access-control-allow-methods");
  } catch (e: any) {
    fail(`CORS test threw: ${e.message}`);
  }

  // =========================================================================
  // 3. Rate Limiting (Throttler)
  //
  // Strategy:
  //   - Send one probe request and read the x-ratelimit-* headers.
  //   - If we're already rate-limited (429 from a previous run), that itself
  //     proves the throttler is active — report remaining time and move on.
  //   - Otherwise, burst until we get a 429, confirming the limit enforces.
  //
  // Endpoint: POST /api/auth/send-otp
  //   - @Public → no JWT needed
  //   - No DB writes at the validation layer (bad body returns 400 immediately)
  //   - Still subject to the global ThrottlerGuard
  //
  // We send a body that passes TS-level parsing but might fail at the service
  // level — that's fine, what matters is the throttler fires before the handler.
  // =========================================================================
  console.log("\n── 3. Rate Limiting (Throttler) ──");
  const throttleEndpoint = `${base}/api/auth/send-otp`;
  const probeBody = JSON.stringify({ email: "probe@ratelimit.test" });
  const probeHeaders = { "Content-Type": "application/json" };

  try {
    const probe = await request(throttleEndpoint, {
      method: "POST",
      headers: probeHeaders,
      body: probeBody,
    });

    const retryAfter = probe.headers["retry-after"];
    const limitHeader = probe.headers["x-ratelimit-limit"];
    const remainingHeader = probe.headers["x-ratelimit-remaining"];
    const resetHeader = probe.headers["x-ratelimit-reset"];

    if (probe.status === 429 && retryAfter) {
      // We're already throttled — this IS proof the throttler is active
      pass(`Already rate-limited: 429 received, Retry-After=${retryAfter}s`);
      pass(`Throttler is active and enforcing limits`);
      console.log(`   ℹ️  (Wait ~${retryAfter}s and re-run to see the burst test)`);
    } else if (limitHeader) {
      // Fresh state — x-ratelimit headers are present, now verify with a burst
      const limit = Number(limitHeader);
      pass(`x-ratelimit-limit: ${limitHeader}`);
      pass(`x-ratelimit-remaining: ${remainingHeader}`);
      pass(`x-ratelimit-reset: ${resetHeader}`);

      if (isNaN(limit) || limit <= 0) {
        fail(`x-ratelimit-limit parsed to an invalid number: "${limitHeader}"`);
      } else {
        console.log(`   Bursting to trigger 429 (limit = ${limit} req/window)...`);
        let hit429 = false;
        // Start from 1 because probe was already 1 request
        for (let i = 1; i <= limit + 10; i++) {
          const r = await request(throttleEndpoint, {
            method: "POST",
            headers: probeHeaders,
            body: probeBody,
          });
          if (r.status === 429) {
            const ra = r.headers["retry-after"];
            pass(`429 Too Many Requests on request #${i + 1} — Retry-After: ${ra}s`);
            hit429 = true;
            break;
          }
        }
        if (!hit429) {
          fail(`Sent ${limit + 10} requests but never received 429 — throttler may be broken`);
        }
      }
    } else {
      // Neither 429 nor headers — something is wrong
      fail(`Probe to ${throttleEndpoint} returned ${probe.status} with no throttle headers.`);
      console.log(`   Headers: ${JSON.stringify(probe.headers)}`);
    }
  } catch (e: any) {
    fail(`Rate limit test threw: ${e.message}`);
  }

  // =========================================================================
  // Summary
  // =========================================================================
  console.log("\n=================================");
  if (failures > 0) {
    console.log(`❌ ${failures} check(s) FAILED.`);
    process.exit(1);
  } else {
    console.log("🎉 ALL SECURITY CHECKS PASSED!");
    process.exit(0);
  }
}

run();

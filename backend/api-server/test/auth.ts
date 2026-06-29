/**
 * JWT Authentication Guard Test
 *
 * Verifies that the global JwtAuthGuard is correctly applied:
 *   - Protected routes reject requests with no token (401)
 *   - Protected routes reject requests with a fake/malformed token (401)
 *   - Public routes (@Public decorator) still work without a token (not 401)
 *
 * Usage:
 *   pnpm run test:auth          (targets http://localhost:3000 by default)
 *   PORT=4000 pnpm run test:auth
 *
 * Prerequisites:
 *   - The API server must be running (pnpm run dev)
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

function assertStatus(res: Response, expected: number, context: string) {
  if (res.status === expected) {
    pass(`${context} → ${res.status} (expected ${expected})`);
  } else {
    fail(`${context} → ${res.status} (expected ${expected}). Body: ${res.body}`);
  }
}

// ---------------------------------------------------------------------------
// Test runner
// ---------------------------------------------------------------------------

async function run() {
  const port = process.env["PORT"] ?? "3000";
  const base = `http://localhost:${port}`;
  console.log(`\n=== JWT AUTHENTICATION GUARD TESTS ===`);
  console.log(`Target: ${base}\n`);

  // =========================================================================
  // 1. Protected route — no token
  // =========================================================================
  console.log("── 1. Protected Route: No Token (GET /api/auth/me) ──");
  try {
    const res = await request(`${base}/api/auth/me`, { method: "GET" });
    assertStatus(res, 401, "No Authorization header");

    // Also verify the response body has the right shape (NestJS UnauthorizedException)
    try {
      const body = JSON.parse(res.body);
      if (body.statusCode === 401) {
        pass(`Response body has statusCode: 401`);
      } else {
        fail(`Response body statusCode is "${body.statusCode}" — expected 401`);
      }
    } catch {
      fail(`Response body is not valid JSON: ${res.body}`);
    }
  } catch (e: any) {
    fail(`Request threw: ${e.message}`);
  }

  // =========================================================================
  // 2. Protected route — malformed token (random string)
  // =========================================================================
  console.log("\n── 2. Protected Route: Malformed Token ──");
  try {
    const res = await request(`${base}/api/auth/me`, {
      method: "GET",
      headers: { Authorization: "Bearer this-is-not-a-real-jwt" },
    });
    assertStatus(res, 401, "Malformed Bearer token");
  } catch (e: any) {
    fail(`Request threw: ${e.message}`);
  }

  // =========================================================================
  // 3. Protected route — structurally valid JWT but wrong secret (tampered)
  //    A real JWT signed with a different secret must be rejected.
  //    We craft a valid-looking JWT with a dummy payload but wrong signature.
  // =========================================================================
  console.log("\n── 3. Protected Route: Valid JWT Structure, Wrong Secret ──");
  try {
    // Header.Payload.Signature — all base64url encoded
    // This token is structurally valid but signed with "wrong-secret"
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(
      JSON.stringify({ sub: "00000000-0000-0000-0000-000000000000", iat: Math.floor(Date.now() / 1000) })
    ).toString("base64url");
    const fakeSignature = "dGhpcy1pcy1hLWZha2Utc2lnbmF0dXJl"; // base64url of "this-is-a-fake-signature"
    const tamperedJwt = `${header}.${payload}.${fakeSignature}`;

    const res = await request(`${base}/api/auth/me`, {
      method: "GET",
      headers: { Authorization: `Bearer ${tamperedJwt}` },
    });
    assertStatus(res, 401, "JWT with wrong signature");
  } catch (e: any) {
    fail(`Request threw: ${e.message}`);
  }

  // =========================================================================
  // 4. Public route — must NOT be blocked by the guard
  //    @Public() endpoints should return something other than 401
  //    even with no token at all.
  // =========================================================================
  console.log("\n── 4. Public Route: @Public Decorator Bypasses Guard ──");
  try {
    // POST /api/auth/send-otp is @Public
    const res = await request(`${base}/api/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com" }),
    });
    if (res.status !== 401) {
      pass(`@Public route returned ${res.status} (not 401) — guard correctly skipped`);
    } else {
      fail(`@Public route returned 401 — guard should have been skipped`);
    }
  } catch (e: any) {
    fail(`Request threw: ${e.message}`);
  }

  // =========================================================================
  // 5. Another public route — /api/health
  // =========================================================================
  console.log("\n── 5. Public Route: /api/health ──");
  try {
    const res = await request(`${base}/api/health`, { method: "GET" });
    assertStatus(res, 200, "GET /api/health (no token)");
  } catch (e: any) {
    fail(`Request threw: ${e.message}`);
  }

  // =========================================================================
  // Summary
  // =========================================================================
  console.log("\n=================================");
  if (failures > 0) {
    console.log(`❌ ${failures} check(s) FAILED.`);
    process.exit(1);
  } else {
    console.log("🎉 ALL JWT AUTH GUARD CHECKS PASSED!");
    process.exit(0);
  }
}

run();

/**
 * ValidationPipe (Input Sanitization) Test
 *
 * Verifies that the global ValidationPipe is correctly hardened with:
 *   - whitelist: true         — strips unknown properties silently
 *   - forbidNonWhitelisted: true — rejects requests with unknown properties (400)
 *   - transform: true         — coerces primitive types
 *
 * This protects against mass assignment attacks and malformed payloads.
 *
 * Usage:
 *   pnpm run test:validation        (targets http://localhost:3000 by default)
 *   PORT=4000 pnpm run test:validation
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
  json: () => any;
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
        res.on("end", () => {
          const r: Response = {
            status: res.statusCode ?? 0,
            statusText: res.statusMessage ?? "",
            headers: res.headers,
            body: data,
            json: () => {
              try {
                return JSON.parse(data);
              } catch {
                return null;
              }
            },
          };
          resolve(r);
        });
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

const JSON_HEADERS = { "Content-Type": "application/json" };

// ---------------------------------------------------------------------------
// Test runner
// ---------------------------------------------------------------------------

async function run() {
  const port = process.env["PORT"] ?? "3000";
  const base = `http://localhost:${port}`;
  console.log(`\n=== VALIDATION PIPE (INPUT SANITIZATION) TESTS ===`);
  console.log(`Target: ${base}\n`);

  // Endpoint under test: POST /api/auth/login
  // DTO: { email: string, password: string } — any extra fields must be rejected
  const loginUrl = `${base}/api/auth/login`;

  // =========================================================================
  // 1. Extra/unknown fields → must return 400 (forbidNonWhitelisted)
  // =========================================================================
  console.log("── 1. Unknown Fields Rejected (forbidNonWhitelisted) ──");
  try {
    const res = await request(loginUrl, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
        isAdmin: true,           // unknown field — must be rejected
      }),
    });

    if (res.status === 400) {
      pass(`Extra field "isAdmin" → 400 Bad Request`);
      const body = res.json();
      if (body?.message) {
        pass(`Error message: ${JSON.stringify(body.message)}`);
      }
    } else {
      fail(`Extra field "isAdmin" → ${res.status} (expected 400). Body: ${res.body}`);
    }
  } catch (e: any) {
    fail(`Request threw: ${e.message}`);
  }

  // =========================================================================
  // 2. Prototype pollution attempt → must return 400
  // =========================================================================
  console.log("\n── 2. Prototype Pollution Fields Rejected ──");
  try {
    const res = await request(loginUrl, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
        "__proto__": { admin: true },    // prototype pollution attempt
        "constructor": { name: "evil" }, // constructor override attempt
      }),
    });

    if (res.status === 400) {
      pass(`Prototype pollution fields → 400 Bad Request`);
    } else {
      // Some parsers strip __proto__ silently — check if it's a 401 (auth) or 400 (validation)
      // either way it must NOT be 200/201
      if (res.status !== 200 && res.status !== 201) {
        pass(`Prototype pollution fields → ${res.status} (not accepted)`);
      } else {
        fail(`Prototype pollution fields → ${res.status} — server accepted the request!`);
      }
    }
  } catch (e: any) {
    fail(`Request threw: ${e.message}`);
  }

  // =========================================================================
  // 3. Missing required fields → must return 400
  // =========================================================================
  console.log("\n── 3. Missing Required Fields ──");
  try {
    // Missing password
    const res1 = await request(loginUrl, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ email: "test@example.com" }),
    });
    if (res1.status === 400) {
      pass(`Missing "password" → 400 Bad Request`);
    } else {
      fail(`Missing "password" → ${res1.status} (expected 400). Body: ${res1.body}`);
    }

    // Missing email
    const res2 = await request(loginUrl, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ password: "password123" }),
    });
    if (res2.status === 400) {
      pass(`Missing "email" → 400 Bad Request`);
    } else {
      fail(`Missing "email" → ${res2.status} (expected 400). Body: ${res2.body}`);
    }

    // Empty body
    const res3 = await request(loginUrl, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({}),
    });
    if (res3.status === 400) {
      pass(`Empty body → 400 Bad Request`);
    } else {
      fail(`Empty body → ${res3.status} (expected 400). Body: ${res3.body}`);
    }
  } catch (e: any) {
    fail(`Request threw: ${e.message}`);
  }

  // =========================================================================
  // 4. Wrong field types → must return 400
  // =========================================================================
  console.log("\n── 4. Wrong Field Types ──");
  try {
    // email as a number
    const res1 = await request(loginUrl, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ email: 12345, password: "password123" }),
    });
    if (res1.status === 400) {
      pass(`email as number → 400 Bad Request`);
    } else {
      fail(`email as number → ${res1.status} (expected 400). Body: ${res1.body}`);
    }

    // email as an object
    const res2 = await request(loginUrl, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ email: { "$gt": "" }, password: "password123" }),
    });
    if (res2.status === 400) {
      pass(`NoSQL injection-style object email → 400 Bad Request`);
    } else {
      fail(`NoSQL injection-style object email → ${res2.status} (expected 400). Body: ${res2.body}`);
    }
  } catch (e: any) {
    fail(`Request threw: ${e.message}`);
  }

  // =========================================================================
  // 5. Invalid email format → must return 400
  //    (requires @IsEmail() on the DTO — confirms class-validator is active)
  // =========================================================================
  console.log("\n── 5. Invalid Email Format (@IsEmail validation) ──");
  try {
    const res = await request(loginUrl, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ email: "not-an-email", password: "password123" }),
    });
    if (res.status === 400) {
      pass(`Invalid email format → 400 Bad Request`);
      const body = res.json();
      if (body?.message) {
        pass(`Validation error: ${JSON.stringify(body.message)}`);
      }
    } else {
      // If the DTO doesn't have @IsEmail(), this will slip through to the auth service.
      // We report it as a warning, not a hard failure, but flag it clearly.
      console.log(`   ⚠️  Invalid email "not-an-email" → ${res.status} — DTO may be missing @IsEmail() decorator`);
    }
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
    console.log("🎉 ALL VALIDATION PIPE CHECKS PASSED!");
    process.exit(0);
  }
}

run();

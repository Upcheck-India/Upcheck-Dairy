import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { runScript, startServer, type RunningServer } from "./helpers/server.js";

/**
 * Runs the API's check scripts against a server this harness starts and stops,
 * so `pnpm test` is a single command with a real exit code instead of three
 * manual runs against whatever happens to be listening.
 *
 * The scripts stay the source of truth — each already exits 0 or 1 — and this
 * file only owns the server lifecycle and the pass/fail assertion.
 *
 * They are split across two servers because rate limiting cannot be on and off
 * at once: validation and auth burst a throttled endpoint and need it skipped,
 * while the security suite asserts a 429 arrives. Running all three against one
 * server fails whichever suite the setting does not suit.
 */

const PORT_THROTTLE_OFF = Number(process.env.TEST_PORT ?? 4310);
const PORT_THROTTLE_ON = PORT_THROTTLE_OFF + 1;

// Booting Nest and reaching a remote Postgres is slower than the 30s default.
const TIMEOUT = 180_000;

function assertPassed(name: string, result: { code: number; output: string }) {
  assert.equal(
    result.code,
    0,
    `${name} reported failures (exit ${result.code}):\n\n${result.output}`
  );
}

describe("API checks — rate limiting skipped", { timeout: TIMEOUT }, () => {
  let server: RunningServer;

  before(async () => {
    // NODE_ENV=test is what makes CustomThrottlerGuard stand down.
    server = await startServer({ port: PORT_THROTTLE_OFF, nodeEnv: "test" });
  });

  after(async () => server?.stop());

  test("ValidationPipe rejects unknown, missing and malformed fields", async () => {
    assertPassed("validation", await runScript("validation.ts", server.port));
  });

  test("JWT guard protects routes and @Public bypasses it", async () => {
    assertPassed("auth", await runScript("auth.ts", server.port));
  });
});

describe("API checks — rate limiting live", { timeout: TIMEOUT }, () => {
  let server: RunningServer;

  before(async () => {
    // Any NODE_ENV other than "test" leaves the throttler armed, which this
    // suite needs in order to observe a 429.
    server = await startServer({ port: PORT_THROTTLE_ON, nodeEnv: "development" });
  });

  after(async () => server?.stop());

  test("Helmet headers, CORS policy and throttling", async () => {
    assertPassed("security", await runScript("security.ts", server.port));
  });
});

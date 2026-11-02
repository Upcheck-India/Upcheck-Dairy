import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

/** The loader that emits decorator metadata — see .swcrc and AUTHENTICATION.md. */
const LOADER = ["--import", "@swc-node/register/esm-register"];

export interface RunningServer {
  port: number;
  baseUrl: string;
  stop: () => Promise<void>;
  /** Server output, for reporting when something fails. */
  output: () => string;
}

/**
 * Boot the API on its own port for a test run.
 *
 * `nodeEnv` is load-bearing rather than cosmetic: CustomThrottlerGuard skips
 * rate limiting entirely when NODE_ENV === "test", so the suites that hammer
 * an endpoint need "test" and the suite that asserts 429s needs anything else.
 * Getting this wrong makes the other suite fail for reasons unrelated to it.
 */
export async function startServer(opts: {
  port: number;
  nodeEnv: "test" | "development";
}): Promise<RunningServer> {
  const { port, nodeEnv } = opts;
  let log = "";

  const child: ChildProcess = spawn(
    process.execPath,
    [...LOADER, path.join(apiRoot, "src/main.ts")],
    {
      cwd: apiRoot,
      env: { ...process.env, PORT: String(port), NODE_ENV: nodeEnv },
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  child.stdout?.on("data", (d) => (log += d.toString()));
  child.stderr?.on("data", (d) => (log += d.toString()));

  const exited = new Promise<never>((_, reject) => {
    child.once("exit", (code) =>
      reject(new Error(`API exited before becoming ready (code ${code})\n${log}`))
    );
  });

  const baseUrl = `http://localhost:${port}`;
  const ready = (async () => {
    const deadline = Date.now() + 90_000;
    while (Date.now() < deadline) {
      try {
        const res = await fetch(`${baseUrl}/api/health`, {
          signal: AbortSignal.timeout(2000),
        });
        if (res.ok) return;
      } catch {
        /* not up yet */
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error(`API did not become ready on ${baseUrl}\n${log}`);
  })();

  // Whichever settles first: a crash reports its own output, a timeout reports
  // the log too. Either way the caller sees why rather than a bare timeout.
  await Promise.race([ready, exited]);

  return {
    port,
    baseUrl,
    output: () => log,
    stop: () =>
      new Promise<void>((resolve) => {
        if (child.exitCode !== null || child.signalCode !== null) return resolve();
        child.once("exit", () => resolve());
        child.kill();
        // Windows ignores SIGTERM for some child shapes; make sure we do not
        // leave a port bound and the next run failing on EADDRINUSE.
        setTimeout(() => {
          try {
            child.kill("SIGKILL");
          } catch {
            /* already gone */
          }
          resolve();
        }, 5000);
      }),
  };
}

/** Run one of the legacy check scripts; resolve with its exit code and output. */
export function runScript(
  script: string,
  port: number
): Promise<{ code: number; output: string }> {
  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      [...LOADER, path.join(apiRoot, "test", script)],
      {
        cwd: apiRoot,
        env: { ...process.env, PORT: String(port) },
        stdio: ["ignore", "pipe", "pipe"],
      }
    );
    let output = "";
    child.stdout?.on("data", (d) => (output += d.toString()));
    child.stderr?.on("data", (d) => (output += d.toString()));
    child.once("exit", (code) => resolve({ code: code ?? 1, output }));
  });
}

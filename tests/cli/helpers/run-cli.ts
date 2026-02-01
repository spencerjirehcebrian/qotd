import { execFile } from "child_process";
import path from "path";

interface RunCliOptions {
  env?: Record<string, string>;
  timeout?: number;
}

interface RunCliResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const CLI_ENTRY = path.join(PROJECT_ROOT, "cli/index.ts");

export function runCli(
  args: string[],
  options: RunCliOptions = {}
): Promise<RunCliResult> {
  const timeout = options.timeout ?? 180_000;

  return new Promise((resolve) => {
    execFile(
      "npx",
      ["tsx", CLI_ENTRY, ...args],
      {
        cwd: PROJECT_ROOT,
        env: {
          ...process.env,
          ...options.env,
          NODE_ENV: "test",
        },
        timeout,
        maxBuffer: 10 * 1024 * 1024,
      },
      (error, stdout, stderr) => {
        const exitCode =
          error && "code" in error && typeof error.code === "number"
            ? error.code
            : error
              ? 1
              : 0;
        resolve({
          stdout: stdout.toString(),
          stderr: stderr.toString(),
          exitCode,
        });
      }
    );
  });
}

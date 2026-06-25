import { spawn } from "node:child_process";

const TIME_RE = /time=(\d+):(\d+):(\d+(?:\.\d+)?)/;

/** Parse an ffmpeg `time=HH:MM:SS.xx` progress line into seconds. */
export function parseTimeSeconds(line: string): number | null {
  const m = TIME_RE.exec(line);
  if (!m) return null;
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + parseFloat(m[3]);
}

interface RunOpts {
  /** Called with elapsed output seconds, parsed live from stderr. */
  onProgress?: (seconds: number) => void;
}

/**
 * Run ffmpeg with the given args. Resolves with the full stderr on success,
 * rejects with a readable error (including the stderr tail) on non-zero exit.
 */
export function runFfmpeg(args: string[], opts: RunOpts = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffmpeg", ["-hide_banner", "-y", ...args]);
    let stderr = "";
    proc.stderr.on("data", (chunk: Buffer) => {
      const s = chunk.toString();
      stderr += s;
      const t = parseTimeSeconds(s);
      if (t != null) opts.onProgress?.(t);
    });
    proc.on("error", reject);
    proc.on("close", (code) =>
      code === 0
        ? resolve(stderr)
        : reject(new Error(`ffmpeg exited ${code}: ${stderr.slice(-1500)}`))
    );
  });
}

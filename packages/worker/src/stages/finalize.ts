import path from "node:path";
import { readdir } from "node:fs/promises";
import { BUCKETS, uploadFile } from "../storage.js";

const CONTENT_TYPES: Record<string, string> = {
  ".m3u8": "application/vnd.apple.mpegurl",
  ".ts": "video/mp2t",
  ".jpg": "image/jpeg",
};

function contentType(file: string): string {
  return CONTENT_TYPES[path.extname(file)] ?? "application/octet-stream";
}

async function* walk(dir: string): AsyncGenerator<string> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

/**
 * Stage 5 — upload HLS output to outputs/<videoId>/ and thumbnails to
 * thumbnails/<videoId>/. Keys are deterministic so re-runs overwrite (idempotent).
 * Reports progress across the 98%→100% band (100 is set by the caller).
 */
export async function finalize(
  videoId: string,
  outDir: string,
  thumbFiles: string[],
  report: (pct: number) => void
): Promise<void> {
  for await (const file of walk(outDir)) {
    const rel = path.relative(outDir, file).split(path.sep).join("/");
    await uploadFile(BUCKETS.outputs, `${videoId}/${rel}`, file, contentType(file));
  }
  report(99);

  for (const file of thumbFiles) {
    await uploadFile(BUCKETS.thumbs, `${videoId}/${path.basename(file)}`, file, contentType(file));
  }
}

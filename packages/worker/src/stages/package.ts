import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { runFfmpeg } from "../ffmpeg/run.js";
import { bitrateToBps } from "../renditions.js";
import type { TranscodedRendition } from "./transcode.js";

/**
 * Stage 4 — segment each rendition into 6s HLS (.ts + per-rendition .m3u8)
 * and write a master playlist. Source codecs are already H.264/AAC, so we
 * stream-copy. Returns the local output dir (containing master.m3u8).
 * Reports progress across the 85%→98% band.
 */
export async function packageHls(
  rends: TranscodedRendition[],
  workDir: string,
  source: { width?: number; height: number },
  report: (pct: number) => void
): Promise<string> {
  const outDir = path.join(workDir, "out");
  const START = 85;
  const each = 13 / rends.length;

  const masterLines = ["#EXTM3U", "#EXT-X-VERSION:3"];

  for (let i = 0; i < rends.length; i++) {
    const { rendition: r } = rends[i];
    const name = `${r.height}p`;
    const dir = path.join(outDir, name);
    await mkdir(dir, { recursive: true });

    await runFfmpeg([
      "-i", rends[i].file,
      "-c", "copy",
      "-hls_time", "6",
      "-hls_playlist_type", "vod",
      "-hls_segment_filename", path.join(dir, "seg_%03d.ts"),
      path.join(dir, "index.m3u8"),
    ]);

    const bandwidth = bitrateToBps(r.videoBitrate) + bitrateToBps(r.audioBitrate);
    const res =
      source.width && source.height
        ? `,RESOLUTION=${even(Math.round((r.height * source.width) / source.height))}x${r.height}`
        : "";
    masterLines.push(`#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth}${res}`);
    masterLines.push(`${name}/index.m3u8`);

    report(START + (i + 1) * each);
  }

  await writeFile(path.join(outDir, "master.m3u8"), masterLines.join("\n") + "\n");
  return outDir;
}

function even(n: number): number {
  return n % 2 === 0 ? n : n + 1;
}

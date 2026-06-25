import path from "node:path";
import { runFfmpeg } from "../ffmpeg/run.js";
import type { Rendition } from "../renditions.js";

export interface TranscodedRendition {
  rendition: Rendition;
  file: string;
}

/**
 * Stage 2 — produce an H.264/AAC mp4 per rendition, capped at source height.
 * Reports progress across the 10%→70% band.
 */
export async function transcode(
  source: string,
  workDir: string,
  renditions: Rendition[],
  duration: number,
  report: (pct: number) => void
): Promise<TranscodedRendition[]> {
  const START = 10;
  const SPAN = 60;
  const each = SPAN / renditions.length;
  const out: TranscodedRendition[] = [];

  for (let i = 0; i < renditions.length; i++) {
    const r = renditions[i];
    const base = START + i * each;
    const file = path.join(workDir, `r_${r.height}.mp4`);

    await runFfmpeg(
      [
        "-i", source,
        "-vf", `scale=-2:${r.height}`,
        "-c:v", "libx264", "-profile:v", "main", "-preset", "veryfast",
        "-b:v", r.videoBitrate, "-maxrate", r.videoBitrate, "-bufsize", r.videoBitrate,
        "-c:a", "aac", "-b:a", r.audioBitrate,
        "-movflags", "+faststart",
        file,
      ],
      {
        onProgress: (sec) => {
          const frac = duration > 0 ? Math.min(sec / duration, 1) : 0;
          report(base + frac * each);
        },
      }
    );

    report(base + each);
    out.push({ rendition: r, file });
  }

  return out;
}

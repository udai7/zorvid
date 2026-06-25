export interface Rendition {
  height: number;
  videoBitrate: string; // e.g. "800k"
  audioBitrate: string; // e.g. "96k"
}

// H.264 ladder. Renditions taller than the source are dropped (no upscaling).
const LADDER: Rendition[] = [
  { height: 360, videoBitrate: "800k", audioBitrate: "96k" },
  { height: 480, videoBitrate: "1400k", audioBitrate: "128k" },
  { height: 720, videoBitrate: "2800k", audioBitrate: "128k" },
];

/** Pick ladder rungs that fit the source; if the source is tiny, encode at source height. */
export function selectRenditions(sourceHeight: number): Rendition[] {
  const fit = LADDER.filter((r) => r.height <= sourceHeight);
  if (fit.length) return fit;
  const even = Math.max(2, sourceHeight - (sourceHeight % 2));
  return [{ height: even, videoBitrate: "600k", audioBitrate: "96k" }];
}

/** Parse "800k"/"1.5m" into bits per second. */
export function bitrateToBps(b: string): number {
  const n = parseFloat(b);
  if (b.endsWith("m")) return Math.round(n * 1_000_000);
  if (b.endsWith("k")) return Math.round(n * 1_000);
  return Math.round(n);
}

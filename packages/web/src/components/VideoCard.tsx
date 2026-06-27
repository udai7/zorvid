import { motion } from "framer-motion";
import type { Video } from "../types";
import { btn, cn } from "../lib/ui";

interface Props {
  video: Video;
  onPlay: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
}

const STAGE_LABELS: Record<string, string> = {
  pending: "Queued",
  analyzing: "Analyzing source",
  transcoding: "Transcoding renditions",
  thumbnails: "Generating thumbnail",
  packaging: "Packaging HLS",
};

export function VideoCard({ video: v, onPlay, onToggleVisibility, onDelete }: Props) {
  const progress = v.progress ?? 0;
  const done = v.status === "completed";
  const failed = v.status === "failed";
  const processing = !done && !failed;
  const indeterminate = processing && progress <= 0;

  const badgeTone = done
    ? "border-green-200 bg-ok-soft text-ok"
    : failed
      ? "border-red-200 bg-err-soft text-err"
      : "border-line bg-sunken text-muted";

  return (
    <div className="flex h-full flex-col gap-2.5 rounded-[10px] border border-line bg-white p-5 transition-shadow hover:border-line-strong hover:shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 className="max-w-[70%] truncate text-[0.98rem] font-semibold" title={v.title}>
          {v.title || v.original_filename}
        </h3>
        <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[0.68rem] uppercase tracking-wide", badgeTone, processing && "animate-pulse")}>
          {processing && (
            <span className="mr-1.5 inline-block h-2 w-2 animate-spin rounded-full border-[1.5px] border-current border-t-transparent" />
          )}
          {v.status}
        </span>
      </div>

      {!failed && (
        <>
          <div className="relative h-2 overflow-hidden rounded-full bg-sunken">
            <span
              className={cn(
                "block h-full rounded-full bg-brand transition-[width] duration-500",
                processing && !indeterminate && "bar-sheen",
                indeterminate && "bar-indeterminate",
              )}
              style={indeterminate ? undefined : { width: `${progress}%` }}
            />
          </div>
          <div className="text-sm text-muted">
            {done
              ? formatMeta(v)
              : `${STAGE_LABELS[v.stage ?? v.status] ?? v.stage ?? "Queued"}${progress > 0 ? ` · ${progress}%` : "…"}`}
          </div>
        </>
      )}

      {failed && v.error_message && (
        <div className="whitespace-pre-wrap rounded-lg border border-red-200 bg-err-soft p-2 text-[0.82rem] text-err">
          {v.error_message}
        </div>
      )}

      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        {done && (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onPlay}
            className={cn(btn.primary, "flex items-center gap-1.5 px-3 py-1.5 text-[0.82rem]")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M6.3 2.841A1.5 1.5 0 0 0 4 4.11v11.78a1.5 1.5 0 0 0 2.3 1.269l9.324-5.89a1.5 1.5 0 0 0 0-2.538L6.3 2.84Z" />
            </svg>
            Play
          </motion.button>
        )}
        {done && (
          <button
            onClick={onToggleVisibility}
            className={cn(btn.secondary, "flex items-center gap-1.5 px-3 py-1.5 text-[0.82rem]")}
          >
            {v.visibility === "public" ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-.778.099-1.533.284-2.253" />
                </svg>
                Public
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
                Private
              </>
            )}
          </button>
        )}
        <button onClick={onDelete} className={cn(btn.danger, "px-3 py-1.5 text-[0.82rem]")}>
          Delete
        </button>
      </div>
    </div>
  );
}

function formatMeta(v: Video): string {
  const m = v.metadata;
  if (!m) return "completed";
  const parts: string[] = [];
  if (m.height) parts.push(`${m.height}p`);
  if (m.duration) parts.push(`${Math.round(m.duration)}s`);
  if (m.videoCodec) parts.push(m.videoCodec);
  return parts.join(" · ") || "completed";
}

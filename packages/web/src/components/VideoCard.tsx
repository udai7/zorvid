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
          <motion.button whileTap={{ scale: 0.96 }} onClick={onPlay} className={cn(btn.primary, "px-3 py-1.5 text-[0.82rem]")}>
            ▶ Play
          </motion.button>
        )}
        {done && (
          <button onClick={onToggleVisibility} className={cn(btn.secondary, "px-3 py-1.5 text-[0.82rem]")}>
            {v.visibility === "public" ? "🌐 Public" : "🔒 Private"}
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

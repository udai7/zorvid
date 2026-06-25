import type { Video } from "../types";

interface Props {
  video: Video;
  onPlay: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
}

export function VideoCard({ video: v, onPlay, onToggleVisibility, onDelete }: Props) {
  const progress = v.progress ?? 0;
  const done = v.status === "completed";
  const failed = v.status === "failed";

  return (
    <div className="card video-card">
      <div className="row between">
        <h3 title={v.title}>{v.title || v.original_filename}</h3>
        <span className={`badge ${v.status}`}>{v.status}</span>
      </div>

      {!failed && (
        <>
          <div className="progress">
            <span style={{ width: `${progress}%` }} />
          </div>
          <div className="muted small">
            {done ? formatMeta(v) : `${v.stage ?? "queued"} · ${progress}%`}
          </div>
        </>
      )}

      {failed && v.error_message && <div className="errmsg">{v.error_message}</div>}

      <div className="actions">
        {done && <button onClick={onPlay}>▶ Play</button>}
        {done && (
          <button className="secondary" onClick={onToggleVisibility}>
            {v.visibility === "public" ? "🌐 Public" : "🔒 Private"}
          </button>
        )}
        <button className="danger" onClick={onDelete}>
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

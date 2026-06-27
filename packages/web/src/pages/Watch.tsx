import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { VideoSurface } from "../components/VideoSurface";
import { ShareModal } from "../components/ShareModal";
import { useApp } from "../layouts/AppLayout";
import { btn, cn } from "../lib/ui";
import type { Video } from "../types";

function formatDuration(seconds?: number): string | null {
  if (!seconds) return null;
  const s = Math.round(seconds);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

function formatBitrate(bps?: number): string | null {
  if (!bps) return null;
  return `${(bps / 1_000_000).toFixed(1)} Mbps`;
}

function formatDate(iso?: string): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function Watch() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { refresh } = useApp();

  const [video, setVideo] = useState<Video | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [sharing, setSharing] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setVideo(null);
    setError(null);
    api
      .getVideo(id)
      .then((v) => !cancelled && setVideo(v))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "could not load video"));
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!id) return null;

  async function saveTitle() {
    if (!video) return;
    const next = titleDraft.trim();
    if (!next || next === video.title) {
      setEditing(false);
      return;
    }
    setBusy(true);
    try {
      const res = await api.updateVideo(video.id, { title: next });
      setVideo({ ...video, title: res.title });
      refresh();
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "rename failed");
    } finally {
      setBusy(false);
    }
  }

  async function toggleVisibility() {
    if (!video) return;
    const next = video.visibility === "public" ? "private" : "public";
    setBusy(true);
    try {
      await api.setVisibility(video.id, next);
      setVideo({ ...video, visibility: next });
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "could not change visibility");
    } finally {
      setBusy(false);
    }
  }

  async function download() {
    if (!video) return;
    try {
      const { url } = await api.getDownload(video.id);
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "download failed");
    }
  }

  async function remove() {
    if (!video || !window.confirm("Delete this video and all its files? This cannot be undone.")) return;
    setBusy(true);
    try {
      await api.deleteVideo(video.id);
      refresh();
      navigate("/dashboard", { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "delete failed");
      setBusy(false);
    }
  }

  const ready = video?.status === "completed";
  const meta = video?.metadata;
  const facts: Array<[string, string]> = [];
  if (meta?.width && meta?.height) facts.push(["Resolution", `${meta.width}×${meta.height}`]);
  const dur = formatDuration(meta?.duration);
  if (dur) facts.push(["Duration", dur]);
  const br = formatBitrate(meta?.bitrate);
  if (br) facts.push(["Bitrate", br]);
  if (meta?.videoCodec) facts.push(["Video codec", meta.videoCodec]);
  if (meta?.audioCodec) facts.push(["Audio codec", meta.audioCodec]);
  if (video) facts.push(["Visibility", video.visibility]);
  if (video) facts.push(["Status", video.status]);
  const created = formatDate(video?.created_at);
  if (created) facts.push(["Uploaded", created]);

  return (
    <div className="py-8">
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink">
        <span aria-hidden>←</span> Back to library
      </Link>

      {error && <div className="mt-6 rounded-[10px] border border-red-200 bg-err-soft p-4 text-sm text-err">{error}</div>}

      {!error && !video && <div className="mt-6 aspect-video w-full max-w-[960px] animate-pulse rounded-lg bg-sunken" />}

      {video && (
        <div className="mt-6 max-w-[960px]">
          {/* Title + rename */}
          {editing ? (
            <div className="flex flex-wrap items-center gap-2">
              <input
                autoFocus
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveTitle()}
                className="min-w-[260px] flex-1 rounded-lg border border-line-strong bg-white px-3 py-2 text-[1.1rem] font-semibold focus:border-ink focus:outline-none"
              />
              <button onClick={saveTitle} disabled={busy} className={cn(btn.primarySm)}>Save</button>
              <button onClick={() => setEditing(false)} className={btn.secondarySm}>Cancel</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-[1.4rem] font-semibold tracking-[-0.02em] text-ink">{video.title || video.original_filename}</h1>
              <button
                onClick={() => {
                  setTitleDraft(video.title);
                  setEditing(true);
                }}
                className="text-muted transition-colors hover:text-ink"
                aria-label="Rename"
                title="Rename"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
                </svg>
              </button>
            </div>
          )}

          {/* Player */}
          {ready ? (
            <div className="mt-4">
              <VideoSurface videoId={video.id} />
            </div>
          ) : (
            <div className="mt-4 grid aspect-video w-full place-items-center rounded-lg border border-line bg-sunken text-center">
              <div>
                <p className="font-medium text-ink">{video.status === "failed" ? "Processing failed" : "Still processing…"}</p>
                <p className="mt-1 text-sm text-muted">
                  {video.status === "failed"
                    ? video.error_message ?? "This video could not be transcoded."
                    : "This video is being transcoded. Check back in a moment."}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={toggleVisibility} disabled={busy} className={btn.secondary}>
              {video.visibility === "public" ? "🌐 Public" : "🔒 Private"}
            </button>
            {ready && (
              <button onClick={() => setSharing(true)} className={btn.secondary}>
                Share &amp; embed
              </button>
            )}
            <button onClick={download} className={btn.secondary}>
              Download original
            </button>
            <button onClick={remove} disabled={busy} className={cn(btn.danger, "ml-auto")}>
              Delete
            </button>
          </div>

          {/* Stats */}
          {facts.length > 0 && (
            <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-line bg-line sm:grid-cols-4">
              {facts.map(([label, value]) => (
                <div key={label} className="bg-white px-4 py-3">
                  <dt className="font-mono text-[0.68rem] uppercase tracking-wide text-muted">{label}</dt>
                  <dd className={cn("mt-0.5 text-[0.95rem] font-medium text-ink", (label === "Visibility" || label === "Status") && "capitalize")}>{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}

      {sharing && video && <ShareModal id={video.id} isPublic={video.visibility === "public"} onClose={() => setSharing(false)} />}
    </div>
  );
}

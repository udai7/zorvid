import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { VideoSurface } from "../components/VideoSurface";
import { cn } from "../lib/ui";
import type { Video } from "../types";

function formatDuration(seconds?: number): string | null {
  if (!seconds) return null;
  const s = Math.round(seconds);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

export function Watch() {
  const { id } = useParams<{ id: string }>();
  const [video, setVideo] = useState<Video | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const ready = video?.status === "completed";
  const meta = video?.metadata;
  const facts: Array<[string, string]> = [];
  if (meta?.height) facts.push(["Resolution", `${meta.height}p`]);
  const dur = formatDuration(meta?.duration);
  if (dur) facts.push(["Duration", dur]);
  if (meta?.videoCodec) facts.push(["Codec", meta.videoCodec]);
  if (video) facts.push(["Visibility", video.visibility]);

  return (
    <div className="py-8">
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink">
        <span aria-hidden>←</span> Back to library
      </Link>

      {error && (
        <div className="mt-6 rounded-[10px] border border-red-200 bg-err-soft p-6 text-err">{error}</div>
      )}

      {!error && !video && (
        <div className="mt-6 aspect-video w-full max-w-[960px] animate-pulse rounded-lg bg-sunken" />
      )}

      {video && (
        <div className="mt-6 max-w-[960px]">
          <h1 className="text-[1.4rem] font-semibold tracking-[-0.02em] text-ink">
            {video.title || video.original_filename}
          </h1>

          {ready ? (
            <div className="mt-4">
              <VideoSurface videoId={video.id} />
            </div>
          ) : (
            <div className="mt-4 grid aspect-video w-full place-items-center rounded-lg border border-line bg-sunken text-center">
              <div>
                <p className="font-medium text-ink">
                  {video.status === "failed" ? "Processing failed" : "Still processing…"}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {video.status === "failed"
                    ? video.error_message ?? "This video could not be transcoded."
                    : "This video is being transcoded. Check back in a moment."}
                </p>
              </div>
            </div>
          )}

          {facts.length > 0 && (
            <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-line bg-line sm:grid-cols-4">
              {facts.map(([label, value]) => (
                <div key={label} className="bg-white px-4 py-3">
                  <dt className="font-mono text-[0.68rem] uppercase tracking-wide text-muted">{label}</dt>
                  <dd className={cn("mt-0.5 text-[0.95rem] font-medium text-ink", label === "Visibility" && "capitalize")}>{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { api } from "../api";
import { cn } from "../lib/ui";

/**
 * Adaptive HLS playback surface. Loads the playback URL for a video, then
 * drives hls.js. Private streams attach a short-lived token on every (nested)
 * request via xhrSetup so child playlists and segments stay authorized.
 */
export function VideoSurface({ videoId, autoPlay = true }: { videoId: string; autoPlay?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [levels, setLevels] = useState<string[]>([]);
  const [current, setCurrent] = useState(-1); // -1 = auto/ABR
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const el = videoRef.current;
    if (!el) return;

    setError(null);
    setLevels([]);
    setCurrent(-1);

    (async () => {
      try {
        const { url, token } = await api.getStream(videoId);
        if (cancelled) return;

        if (Hls.isSupported()) {
          const hls = new Hls({
            xhrSetup: token
              ? (xhr) => xhr.setRequestHeader("authorization", `Bearer ${token}`)
              : undefined,
          });
          hlsRef.current = hls;
          hls.loadSource(url);
          hls.attachMedia(el);
          hls.on(Hls.Events.MANIFEST_PARSED, (_e, data) => {
            setLevels(data.levels.map((l) => `${l.height}p`));
            if (autoPlay) el.play().catch(() => {});
          });
          hls.on(Hls.Events.LEVEL_SWITCHED, (_e, data) => setCurrent(data.level));
          hls.on(Hls.Events.ERROR, (_e, data) => {
            if (data.fatal) setError(`playback error: ${data.details}`);
          });
        } else if (el.canPlayType("application/vnd.apple.mpegurl")) {
          el.src = url; // Safari native HLS (public only)
        } else {
          setError("HLS is not supported in this browser");
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "could not load stream");
      }
    })();

    return () => {
      cancelled = true;
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [videoId, autoPlay]);

  function selectLevel(level: number) {
    setCurrent(level);
    if (hlsRef.current) hlsRef.current.currentLevel = level; // -1 = auto/ABR
  }

  const chip = (active: boolean) =>
    cn(
      "rounded-full border px-3 py-1 text-[0.78rem] transition-colors cursor-pointer",
      active ? "border-ink bg-ink text-white" : "border-line-strong bg-white text-ink-2 hover:border-ink",
    );

  return (
    <div>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video ref={videoRef} controls playsInline className="aspect-video w-full rounded-lg bg-black" />
      {error && <p className="mt-2 text-sm text-err">{error}</p>}
      {levels.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted">Quality:</span>
          <button className={chip(current === -1)} onClick={() => selectLevel(-1)}>
            Auto
          </button>
          {levels.map((label, i) => (
            <button key={label} className={chip(current === i)} onClick={() => selectLevel(i)}>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

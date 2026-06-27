import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Hls from "hls.js";
import { api } from "../api";
import type { Video } from "../types";
import { cn } from "../lib/ui";

/**
 * HLS player modal. Loads the playback URL from the API, then drives hls.js.
 * Private streams attach a short-lived token on every (nested) request via
 * xhrSetup, so child playlists and segments stay authorized.
 */
export function Player({ video, onClose }: { video: Video; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [levels, setLevels] = useState<string[]>([]);
  const [current, setCurrent] = useState(-1); // -1 = auto
  const [error, setError] = useState<string | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    let cancelled = false;
    const el = videoRef.current;
    if (!el) return;

    (async () => {
      try {
        const { url, token } = await api.getStream(video.id);
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
            el.play().catch(() => {});
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
  }, [video.id]);

  function selectLevel(level: number) {
    setCurrent(level);
    if (hlsRef.current) hlsRef.current.currentLevel = level; // -1 = auto/ABR
  }

  const chip = (active: boolean) =>
    cn(
      "rounded-full border px-3 py-1 text-[0.78rem] transition-colors",
      active ? "border-ink bg-ink text-white" : "border-line-strong bg-white text-ink-2 hover:border-ink",
    );

  return (
    <motion.div
      className="fixed inset-0 z-20 grid place-items-center bg-black/55 p-4 backdrop-blur-sm"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="relative w-full max-w-[900px] rounded-[10px] border border-line bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] as const }}
      >
        <button
          className="absolute right-3 top-2 text-2xl leading-none text-muted transition-colors hover:text-ink"
          onClick={onClose}
        >
          ×
        </button>
        <h2 className="mb-3 text-[1.1rem] font-semibold">{video.title || video.original_filename}</h2>
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
      </motion.div>
    </motion.div>
  );
}

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { api } from "../api";
import type { Video } from "../types";

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

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-body" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose}>
          ×
        </button>
        <h2>{video.title || video.original_filename}</h2>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video ref={videoRef} controls playsInline />
        {error && <p className="error">{error}</p>}
        {levels.length > 0 && (
          <div className="quality row">
            <span className="muted small">Quality:</span>
            <button
              className={`chip${current === -1 ? " active" : ""}`}
              onClick={() => selectLevel(-1)}
            >
              Auto
            </button>
            {levels.map((label, i) => (
              <button
                key={label}
                className={`chip${current === i ? " active" : ""}`}
                onClick={() => selectLevel(i)}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

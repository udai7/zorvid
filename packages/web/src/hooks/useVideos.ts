import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api";
import type { Video } from "../types";

const TERMINAL = new Set(["completed", "failed"]);

/**
 * Polls the video list while any video is still processing. Stops polling once
 * everything is in a terminal state, and resumes when a new upload appears.
 */
export function useVideos(enabled: boolean) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      setVideos(await api.listVideos());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed to load videos");
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setVideos([]);
      return;
    }
    refresh();
    timer.current = window.setInterval(() => {
      // Only keep polling while something is in flight.
      setVideos((cur) => {
        if (cur.length === 0 || cur.some((v) => !TERMINAL.has(v.status))) refresh();
        return cur;
      });
    }, 1000);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [enabled, refresh]);

  return { videos, error, refresh };
}

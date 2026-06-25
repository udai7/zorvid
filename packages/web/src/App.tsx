import { useState } from "react";
import { api, getToken, setToken } from "./api";
import { useVideos } from "./hooks/useVideos";
import { Login } from "./components/Login";
import { Dropzone } from "./components/Dropzone";
import { VideoCard } from "./components/VideoCard";
import { Player } from "./components/Player";
import type { Video } from "./types";

export function App() {
  const [authed, setAuthed] = useState(!!getToken());
  const [playing, setPlaying] = useState<Video | null>(null);
  const { videos, error, refresh } = useVideos(authed);

  function logout() {
    setToken(null);
    setAuthed(false);
  }

  if (!authed) return <Login onAuthed={() => setAuthed(true)} />;

  return (
    <div className="app">
      <header>
        <h1>🎬 Video Processing Pipeline</h1>
        <button className="link" onClick={logout}>
          log out
        </button>
      </header>

      <main>
        <Dropzone onUploaded={refresh} />

        {error && <p className="error">{error}</p>}

        {videos.length === 0 ? (
          <p className="muted empty">No videos yet — upload one above to start the pipeline.</p>
        ) : (
          <section className="grid">
            {videos.map((v) => (
              <VideoCard
                key={v.id}
                video={v}
                onPlay={() => setPlaying(v)}
                onToggleVisibility={async () => {
                  await api.setVisibility(
                    v.id,
                    v.visibility === "public" ? "private" : "public"
                  );
                  refresh();
                }}
                onDelete={async () => {
                  await api.deleteVideo(v.id);
                  refresh();
                }}
              />
            ))}
          </section>
        )}
      </main>

      {playing && <Player video={playing} onClose={() => setPlaying(null)} />}
    </div>
  );
}

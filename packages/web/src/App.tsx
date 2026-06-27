import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api, getToken, setToken } from "./api";
import { useVideos } from "./hooks/useVideos";
import { Landing } from "./components/Landing";
import { Login } from "./components/Login";
import { Dropzone } from "./components/Dropzone";
import { VideoCard } from "./components/VideoCard";
import { Player } from "./components/Player";
import type { Video } from "./types";

const page = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

export function App() {
  const [authed, setAuthed] = useState(!!getToken());
  const [showAuth, setShowAuth] = useState(false);
  const [playing, setPlaying] = useState<Video | null>(null);
  const { videos, error, refresh } = useVideos(authed);

  function logout() {
    setToken(null);
    setAuthed(false);
    setShowAuth(false);
  }

  const view = authed ? "dash" : showAuth ? "auth" : "landing";

  return (
    <AnimatePresence mode="wait">
      {view === "landing" && (
        <motion.div key="landing" {...page}>
          <Landing onSignIn={() => setShowAuth(true)} />
        </motion.div>
      )}

      {view === "auth" && (
        <motion.div key="auth" {...page}>
          <Login onAuthed={() => setAuthed(true)} onBack={() => setShowAuth(false)} />
        </motion.div>
      )}

      {view === "dash" && (
        <motion.div key="dash" {...page} className="min-h-screen bg-paper text-ink">
          <header className="sticky top-0 z-10 border-b border-line bg-white/80 backdrop-blur">
            <div className="mx-auto flex h-[60px] max-w-[1280px] items-center justify-between px-6">
              <span className="flex items-center gap-2 text-[0.98rem] font-semibold">
                <span className="inline-block h-4 w-4 rounded-full border-[3px] border-ink" /> Video Pipeline
              </span>
              <button onClick={logout} className="text-sm text-muted transition-colors hover:text-ink">
                Log out
              </button>
            </div>
          </header>

          <main className="mx-auto max-w-[1280px] px-6 pb-16">
            <div className="py-8">
              <h1 className="text-2xl font-semibold tracking-[-0.02em]">Your videos</h1>
              <p className="mt-1 text-[0.95rem] text-muted">
                Upload a file to kick off the transcoding pipeline.
              </p>
            </div>

            <Dropzone onUploaded={refresh} />

            {error && <p className="mt-3 text-sm text-err">{error}</p>}

            {videos.length === 0 ? (
              <p className="py-12 text-center text-muted">
                No videos yet — upload one above to start the pipeline.
              </p>
            ) : (
              <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {videos.map((v) => (
                    <motion.div
                      key={v.id}
                      layout
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.25 }}
                    >
                      <VideoCard
                        video={v}
                        onPlay={() => setPlaying(v)}
                        onToggleVisibility={async () => {
                          await api.setVisibility(v.id, v.visibility === "public" ? "private" : "public");
                          refresh();
                        }}
                        onDelete={async () => {
                          await api.deleteVideo(v.id);
                          refresh();
                        }}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </section>
            )}
          </main>

          {playing && <Player video={playing} onClose={() => setPlaying(null)} />}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

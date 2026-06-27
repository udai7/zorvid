import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "../api";
import { useApp } from "../layouts/AppLayout";
import { VideoCard } from "../components/VideoCard";
import { Eyebrow } from "../components/Page";
import { btn } from "../lib/ui";

const TERMINAL = new Set(["completed", "failed"]);

export function Dashboard() {
  const { videos, error, refresh } = useApp();
  const navigate = useNavigate();

  const ready = videos.filter((v) => v.status === "completed").length;
  const processing = videos.filter((v) => !TERMINAL.has(v.status)).length;
  const failed = videos.filter((v) => v.status === "failed").length;

  const stats: Array<[label: string, value: number]> = [
    ["Total", videos.length],
    ["Ready", ready],
    ["Processing", processing],
    ["Failed", failed],
  ];

  return (
    <>
      <div className="mb-8 grid gap-6 border-b border-line py-12 md:grid-cols-2 md:items-end">
        <div>
          <Eyebrow left="MEDIA" right="LIBRARY" />
          <h1 className="mt-3 text-[clamp(1.8rem,4vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-ink">
            Your Videos
          </h1>
        </div>
        <div className="flex flex-col items-start gap-4 md:items-end">
          <p className="text-[0.98rem] text-muted md:max-w-[42ch] md:text-right">
            Upload a source file to kick off the transcoding pipeline and track every stage in real time.
          </p>
          <Link to="/upload" className={btn.primary}>
            Upload video →
          </Link>
        </div>
      </div>

      {videos.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-line bg-line sm:grid-cols-4">
          {stats.map(([label, value]) => (
            <div key={label} className="bg-white px-5 py-4">
              <div className="text-2xl font-semibold tabular-nums text-ink">{value}</div>
              <div className="mt-0.5 font-mono text-[0.7rem] uppercase tracking-wide text-muted">{label}</div>
            </div>
          ))}
        </div>
      )}

      {error && <p className="mt-3 text-sm text-err">{error}</p>}

      {videos.length === 0 ? (
        <div className="rounded-[10px] border border-dashed border-line-strong bg-subtle px-6 py-16 text-center">
          <p className="text-muted">No videos yet — upload one to start the pipeline.</p>
          <Link to="/upload" className={`${btn.secondary} mt-4`}>
            Upload your first video
          </Link>
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                  onPlay={() => navigate(`/watch/${v.id}`)}
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
    </>
  );
}

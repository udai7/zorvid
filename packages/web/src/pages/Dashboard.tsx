import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "../api";
import { useApp } from "../layouts/AppLayout";
import { VideoCard } from "../components/VideoCard";
import { Eyebrow } from "../components/Page";
import { btn } from "../lib/ui";
import type { Video } from "../types";

const TERMINAL = new Set(["completed", "failed"]);

type StatusFilter = "all" | "completed" | "processing" | "failed";
type VisFilter = "all" | "public" | "private";
type Sort = "newest" | "oldest" | "title";

function matchesStatus(v: Video, f: StatusFilter): boolean {
  if (f === "all") return true;
  if (f === "processing") return !TERMINAL.has(v.status);
  return v.status === f;
}

function formatWatchTime(totalSeconds: number): string {
  if (totalSeconds <= 0) return "0m";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.round((totalSeconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const selectClass =
  "rounded-lg border border-line-strong bg-white px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none cursor-pointer";

export function Dashboard() {
  const { videos, error, refresh } = useApp();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [visibility, setVisibility] = useState<VisFilter>("all");
  const [sort, setSort] = useState<Sort>("newest");

  const ready = videos.filter((v) => v.status === "completed").length;
  const processing = videos.filter((v) => !TERMINAL.has(v.status)).length;
  const failed = videos.filter((v) => v.status === "failed").length;
  const watchSeconds = videos.reduce((sum, v) => sum + (v.metadata?.duration ?? 0), 0);

  const stats: Array<[label: string, value: string | number]> = [
    ["Total", videos.length],
    ["Ready", ready],
    ["Processing", processing],
    ["Failed", failed],
    ["Watch time", formatWatchTime(watchSeconds)],
  ];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = videos.filter((v) => {
      if (!matchesStatus(v, status)) return false;
      if (visibility !== "all" && v.visibility !== visibility) return false;
      if (q && !`${v.title} ${v.original_filename}`.toLowerCase().includes(q)) return false;
      return true;
    });
    list.sort((a, b) => {
      if (sort === "title") return (a.title || a.original_filename).localeCompare(b.title || b.original_filename);
      const diff = +new Date(a.created_at) - +new Date(b.created_at);
      return sort === "oldest" ? diff : -diff;
    });
    return list;
  }, [videos, query, status, visibility, sort]);

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
        <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-line bg-line sm:grid-cols-3 lg:grid-cols-5">
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
        <>
          {/* Toolbar: search, filter, sort */}
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1">
              <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search videos…"
                className="w-full rounded-lg border border-line-strong bg-white py-2 pl-9 pr-3 text-sm focus:border-ink focus:outline-none"
              />
            </div>
            <select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} className={selectClass}>
              <option value="all">All statuses</option>
              <option value="completed">Ready</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
            </select>
            <select value={visibility} onChange={(e) => setVisibility(e.target.value as VisFilter)} className={selectClass}>
              <option value="all">All visibility</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={selectClass}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="title">Title A–Z</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-[10px] border border-dashed border-line-strong bg-subtle px-6 py-12 text-center text-muted">
              No videos match your filters.
            </div>
          ) : (
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {filtered.map((v) => (
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
      )}
    </>
  );
}

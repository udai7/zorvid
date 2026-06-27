import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PageHero, PageShell, Eyebrow } from "../components/Page";
import { btn, cn } from "../lib/ui";

const GROUPS = [
  {
    label: "Ingest",
    items: [
      ["Resumable uploads", "Large source files stream straight to object storage with progress reporting, so a dropped connection never costs the whole upload."],
      ["Any input format", "MP4, MOV, MKV, WebM, AVI and more are probed with FFmpeg and normalised before the ladder is built."],
      ["Automatic metadata", "Duration, resolution, codecs and bitrate are extracted on ingest and stored alongside each video."],
    ],
  },
  {
    label: "Process",
    items: [
      ["Multi-bitrate ladder", "Every upload is transcoded into a 1080p / 720p / 480p HLS ladder tuned for smooth adaptive playback."],
      ["Queue-backed workers", "Redis + BullMQ schedule jobs across a horizontally scalable worker pool with retries and backoff."],
      ["Live progress", "Each stage — analyzing, transcoding, packaging — reports percentage progress back to the dashboard in real time."],
    ],
  },
  {
    label: "Deliver",
    items: [
      ["Adaptive HLS", "hls.js negotiates the best rendition for each viewer's bandwidth and lets them override quality manually."],
      ["Private by default", "Streams are token-proxied and never cached until you explicitly flip a video to public."],
      ["Edge-cacheable", "Public HLS segments carry immutable cache headers, ready for nginx or a CDN like Cloudflare to serve at the edge."],
    ],
  },
];

export function Features() {
  return (
    <PageShell>
      <PageHero
        eyebrowLeft="PRODUCT"
        eyebrowRight="FEATURES"
        title="Everything you need to ship video."
        intro="Vodeum is a complete, self-hosted path from a raw upload to an adaptive stream — transcoding, packaging, storage and delivery, all on infrastructure you own."
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/register" className={cn(btn.primary, "glare-effect")}>Get started →</Link>
          <Link to="/how-it-works" className={btn.secondary}>How it works</Link>
        </div>
      </PageHero>

      {GROUPS.map((group) => (
        <section key={group.label} className="border-b border-line px-6 py-14">
          <Eyebrow left={group.label.toUpperCase()} right="CAPABILITIES" />
          <div className="mt-6 grid gap-px overflow-hidden rounded-[10px] border border-line bg-line sm:grid-cols-3">
            {group.items.map(([title, body], i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
                className="bg-white p-6"
              >
                <h3 className="text-[0.98rem] font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-[0.92rem] leading-relaxed text-muted">{body}</p>
              </motion.div>
            ))}
          </div>
        </section>
      ))}
    </PageShell>
  );
}

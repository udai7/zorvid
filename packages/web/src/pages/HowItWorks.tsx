import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PageHero, PageShell, Eyebrow } from "../components/Page";
import { btn } from "../lib/ui";

const STAGES = [
  ["01", "Upload", "The browser streams your source file to the API, which writes it straight to S3-compatible object storage and records the video as pending."],
  ["02", "Queue", "A processing job is enqueued in Redis via BullMQ. Workers pick it up as capacity frees, so the API never blocks on transcoding."],
  ["03", "Analyze", "A worker probes the file with FFmpeg to read duration, resolution and codecs, then plans the rendition ladder for the source."],
  ["04", "Transcode", "FFmpeg encodes the 1080p / 720p / 480p renditions in parallel, reporting progress back to the database at each step."],
  ["05", "Package", "Renditions are segmented into HLS and a master playlist is written, with a poster thumbnail generated from the timeline."],
  ["06", "Stream", "The dashboard plays the master playlist through hls.js. Private videos are token-proxied; public ones are cached at the edge."],
];

export function HowItWorks() {
  return (
    <PageShell>
      <PageHero
        eyebrowLeft="SYSTEM"
        eyebrowRight="WORKFLOW"
        title="From raw upload to adaptive stream."
        intro="Zorvid is a decoupled pipeline: the API stays responsive while a pool of workers does the heavy lifting. Here is the journey every video takes."
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/register" className={btn.primary}>Try the pipeline →</Link>
          <Link to="/features" className={btn.secondary}>See features</Link>
        </div>
      </PageHero>

      <section className="px-6 py-14">
        <Eyebrow left="SIX" right="STAGES" />
        <ol className="mt-8 border-l border-line">
          {STAGES.map(([num, title, body], i) => (
            <motion.li
              key={num}
              initial={{ opacity: 0, x: 12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              className="relative pb-10 pl-8 last:pb-0"
            >
              <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full border-2 border-brand bg-paper" />
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs text-brand">{num}</span>
                <h3 className="text-[1.05rem] font-semibold text-ink">{title}</h3>
              </div>
              <p className="mt-2 max-w-[60ch] text-[0.95rem] leading-relaxed text-muted">{body}</p>
            </motion.li>
          ))}
        </ol>
      </section>
    </PageShell>
  );
}

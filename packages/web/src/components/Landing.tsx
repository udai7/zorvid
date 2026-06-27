import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useReveal } from "../hooks/useReveal";
import { btn, cn } from "../lib/ui";
import gsap from "gsap";

interface Props {
  onSignIn: () => void;
}

const REPO = "https://github.com/udai7/video_processing_pipeline";

const FEATURES = [
  { title: "Transcoding", body: "Multi-bitrate FFmpeg pipeline that ingests any source file.", pill: null },
  { title: "Adaptive HLS", body: "Streams that switch quality to fit each viewer's bandwidth.", pill: null },
  { title: "Private by default", body: "Token-proxied delivery; flip a video public when you're ready.", pill: null },
  { title: "Self-hosted", body: "Own the whole stack — one docker compose up and you're live.", pill: "Open Source" },
];

const PIPELINE = [
  { ico: "⬆️", lbl: "Upload" },
  { ico: "🔍", lbl: "Analyze" },
  { ico: "🎞️", lbl: "Transcode" },
  { ico: "📦", lbl: "Package" },
  { ico: "📡", lbl: "Stream" },
];

const IconFFmpeg = () => (
  <svg className="w-8 h-8 text-muted group-hover:text-ink transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
    <path d="M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
);

const IconNode = () => (
  <svg className="w-8 h-8 text-muted group-hover:text-ink transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L3.5 7v10L12 22l8.5-5V7L12 2z" />
    <path d="M12 22V12" />
    <path d="M12 12L3.5 7" />
    <path d="M12 12l8.5-5" />
    <circle cx="12" cy="12" r="2.5" fill="currentColor" />
  </svg>
);

const IconReact = () => (
  <svg className="w-8 h-8 text-muted group-hover:text-ink transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(0 12 12)" />
    <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
    <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </svg>
);

const IconTypeScript = () => (
  <svg className="w-8 h-8 text-muted group-hover:text-ink transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M7 10h4M9 10v6M14 10h3M14 13h2.5c.3 0 .5.2.5.5v2c0 .5-.5 1-1 1H14" />
  </svg>
);

const IconRedis = () => (
  <svg className="w-8 h-8 text-muted group-hover:text-ink transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
    <path d="M2 7v10M22 7v10M12 12v10" />
  </svg>
);

const IconPostgreSQL = () => (
  <svg className="w-8 h-8 text-muted group-hover:text-ink transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v6c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    <path d="M3 11v6c0 1.66 4 3 9 3s9-1.34 9-3v-6" />
  </svg>
);

const IconMinIO = () => (
  <svg className="w-8 h-8 text-muted group-hover:text-ink transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 15.25" />
    <path d="M8 16l4-4 4 4" />
    <path d="M12 12v9" />
  </svg>
);

const IconDocker = () => (
  <svg className="w-8 h-8 text-muted group-hover:text-ink transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="4" height="4" rx="1" />
    <rect x="7" y="5" width="4" height="4" rx="1" />
    <rect x="12" y="5" width="4" height="4" rx="1" />
    <rect x="7" y="10" width="4" height="4" rx="1" />
    <rect x="12" y="10" width="4" height="4" rx="1" />
    <rect x="17" y="10" width="4" height="4" rx="1" />
    <path d="M2 15h20" />
    <path d="M19 15c0-2-1.5-3.5-3.5-3.5" />
  </svg>
);

const IconNginx = () => (
  <svg className="w-8 h-8 text-muted group-hover:text-ink transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="6" rx="1" />
    <rect x="2" y="15" width="20" height="6" rx="1" />
    <path d="M6 6h.01M6 18h.01M18 6h.01M18 18h.01M12 9v6" />
  </svg>
);

const IconTailwind = () => (
  <svg className="w-8 h-8 text-muted group-hover:text-ink transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3c-1.2 0-2.4.6-3.6 1.8L3 10.2c-1.2 1.2-1.8 2.4-1.8 3.6 0 1.2.6 2.4 1.8 3.6l5.4 5.4c1.2 1.2 2.4 1.8 3.6 1.8s2.4-.6 3.6-1.8l5.4-5.4c1.2-1.2 1.8-2.4 1.8-3.6 0-1.2-.6-2.4-1.8-3.6l-5.4-5.4C14.4 3.6 13.2 3 12 3z" />
  </svg>
);

const TECH_STACK = [
  { name: "FFmpeg", icon: <IconFFmpeg />, usecase: "Video transcoding & HLS segmenting" },
  { name: "Node.js", icon: <IconNode />, usecase: "Asynchronous job orchestration" },
  { name: "React", icon: <IconReact />, usecase: "Responsive, dynamic player UI" },
  { name: "TypeScript", icon: <IconTypeScript />, usecase: "Strongly typed codebase stability" },
  { name: "Redis", icon: <IconRedis />, usecase: "Real-time task queuing & Pub/Sub" },
  { name: "PostgreSQL", icon: <IconPostgreSQL />, usecase: "Reliable database persistence" },
  { name: "MinIO", icon: <IconMinIO />, usecase: "Self-hosted, S3-compatible storage" },
  { name: "Docker", icon: <IconDocker />, usecase: "Reproducible container runtime" },
  { name: "Nginx", icon: <IconNginx />, usecase: "High-performance streaming server" },
  { name: "Tailwind CSS", icon: <IconTailwind />, usecase: "Highly flexible utility design system" },
];

interface TechCellProps {
  name: string;
  icon: React.ReactNode;
  usecase: string;
  i: number;
}

function TechCell({ name, icon, usecase, i }: TechCellProps) {
  const reelRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (!reelRef.current) return;
    gsap.killTweensOf(reelRef.current);
    gsap.to(reelRef.current, {
      y: "-50%",
      duration: 0.35,
      ease: "power2.out"
    });
  };

  const handleMouseLeave = () => {
    if (!reelRef.current) return;
    gsap.killTweensOf(reelRef.current);
    gsap.to(reelRef.current, {
      y: "0%",
      duration: 0.35,
      ease: "power2.out"
    });
  };

  return (
    <div
      className={cn(
        "h-28 overflow-hidden relative cursor-pointer group select-none bg-paper",
        "border-r border-b border-line",
        (i + 1) % 2 === 0 && "border-r-0",
        (i + 1) % 3 === 0 ? "sm:border-r-0" : "sm:border-r",
        (i + 1) % 5 === 0 ? "md:border-r-0" : "md:border-r"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={reelRef}
        className="w-full h-[200%] flex flex-col absolute top-0 left-0"
      >
        {/* Slide 1: Front */}
        <div className="h-1/2 w-full flex flex-col items-center justify-center bg-paper group-hover:bg-subtle/50 transition-colors duration-200">
          <div className="flex items-center justify-center">{icon}</div>
          <span className="font-mono text-[0.65rem] text-muted group-hover:text-ink mt-2.5 tracking-wider uppercase font-semibold transition-colors duration-200">{name}</span>
        </div>
        {/* Slide 2: Back */}
        <div className="h-1/2 w-full flex flex-col items-center justify-center px-4 text-center bg-ink border-t border-line">
          <span className="text-[0.55rem] font-mono uppercase tracking-[0.1em] text-muted mb-1.5">{name}</span>
          <span className="text-[0.75rem] text-neutral-200 font-medium leading-tight max-w-[20ch]">{usecase}</span>
        </div>
      </div>
    </div>
  );
}

const FAQ_DATA = [
  {
    question: "What is Video Pipeline?",
    answer: "Video Pipeline is an open-source, self-hosted video-on-demand processing pipeline. It allows you to transcode, package, and serve adaptive streamable videos using your own storage and compute infrastructure."
  },
  {
    question: "How does self-hosting save costs?",
    answer: "Traditional video SaaS platforms markup bandwidth and transcoding costs by 5x-10x. By running your own transcoding worker and serving HLS streams directly from cheap object storage (like AWS S3 or MinIO), you eliminate per-minute licensing and markup."
  },
  {
    question: "What video formats are supported?",
    answer: "The pipeline supports almost any raw video input (including MP4, MOV, AVI, and WebM) and automatically transcodes them into standard HLS (HTTP Live Streaming) playlists with adaptive multi-resolution streams (e.g., 1080p, 720p, 480p)."
  },
  {
    question: "Where are my video files stored?",
    answer: "Your files are stored in S3-compatible object storage. You can run MinIO locally for development or configure the pipeline to connect to AWS S3, Cloudflare R2, Google Cloud Storage, or any other S3 provider in production."
  },
  {
    question: "How does the system handle massive video files?",
    answer: "Large files are queued using Redis and processed asynchronously by dedicated workers using FFmpeg. This prevents your API server from bottlenecking and ensures robust, reliable processing for files of any size."
  },
  {
    question: "Can I customize the encoding settings?",
    answer: "Yes, the entire transcoding logic is fully open and configurable. You can adjust the FFmpeg parameters, resolution tiers, bitrates, and keyframe intervals in the worker code to fit your specific playback quality requirements."
  }
];

interface FAQItemProps {
  question: string;
  answer: string;
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const verticalBarRef = useRef<HTMLDivElement>(null);
  const answerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      gsap.to(verticalBarRef.current, {
        rotate: 90,
        scaleY: 0,
        duration: 0.3,
        ease: "power2.out"
      });
      gsap.to(answerRef.current, {
        height: "auto",
        opacity: 1,
        duration: 0.3,
        ease: "power2.out"
      });
    } else {
      gsap.to(verticalBarRef.current, {
        rotate: 0,
        scaleY: 1,
        duration: 0.3,
        ease: "power2.out"
      });
      gsap.to(answerRef.current, {
        height: 0,
        opacity: 0,
        duration: 0.3,
        ease: "power2.out"
      });
    }
  }, [isOpen]);

  return (
    <div className="border-b border-line py-5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left group select-none gap-4"
      >
        <span className="text-[1.05rem] font-semibold text-ink transition-colors duration-200">
          {question}
        </span>
        <div className="relative w-4 h-4 flex items-center justify-center flex-shrink-0">
          <div className="absolute w-3.5 h-[1.5px] bg-ink rounded-full" />
          <div
            ref={verticalBarRef}
            className="absolute w-[1.5px] h-3.5 bg-ink rounded-full origin-center"
          />
        </div>
      </button>
      <div
        ref={answerRef}
        className="overflow-hidden h-0 opacity-0"
      >
        <p className="pt-3 text-[0.9rem] text-muted leading-relaxed max-w-[65ch]">
          {answer}
        </p>
      </div>
    </div>
  );
}

const fade = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as const } }),
};

export function Landing({ onSignIn }: Props) {
  const reveal = useReveal<HTMLDivElement>();

  return (
    <div ref={reveal} className="min-h-screen bg-paper text-ink">
      {/* Nav */}
      <header className="sticky top-0 z-10 border-b border-line bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-[60px] max-w-[1280px] items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-8">
            <Brand />
            <nav className="hidden gap-6 md:flex">
              {[["Features", "#features"], ["How it works", "#how"], ["Docs", REPO]].map(([t, h]) => (
                <a key={t} href={h} target={h.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="text-sm text-muted transition-colors hover:text-ink">
                  {t}
                </a>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <a href={REPO} target="_blank" rel="noreferrer" className="text-muted transition-colors hover:text-ink">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
            </a>
            <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} onClick={onSignIn} className={btn.primary}>
              Sign in
            </motion.button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] border-x border-line">
        {/* Hero */}
        <section className="border-b border-line px-6 pb-14 pt-24">
          <motion.span variants={fade} initial="hidden" animate="show" className="block font-mono text-xs uppercase tracking-[0.08em] text-muted">
            [ <span className="text-brand">OPEN SOURCE</span> · SELF-HOSTED VIDEO ]
          </motion.span>
          <motion.h1 variants={fade} custom={1} initial="hidden" animate="show" className="mt-6 max-w-[24ch] text-[clamp(2.4rem,6.2vw,4.1rem)] font-[650] leading-[1.04] tracking-[-0.02em]">
            The open-source video pipeline for developers.
          </motion.h1>
          <motion.p variants={fade} custom={2} initial="hidden" animate="show" className="mt-6 max-w-[85ch] text-[1.05rem] text-ink-2">
            Upload once and stream everywhere with self-hosted video transcoding and adaptive HLS.
          </motion.p>
          <motion.div variants={fade} custom={3} initial="hidden" animate="show" className="mt-8 flex flex-wrap gap-3">
            <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={onSignIn} className={cn(btn.primary, "glare-effect")}>
              Get started →
            </motion.button>
            <motion.a whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} href={REPO} target="_blank" rel="noreferrer" className={cn(btn.secondary, "glare-effect")}>
              View on GitHub
            </motion.a>
          </motion.div>
        </section>

        {/* Feature columns */}
        <section id="features" className="grid grid-cols-1 border-b border-line sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              data-reveal
              whileHover={{ backgroundColor: "rgba(244,244,245,0.7)" }}
              className={cn(
                "border-line p-6 transition-colors",
                i > 0 && "border-t sm:border-t-0 lg:border-l",
                i === 1 && "sm:border-l lg:border-l",
                i === 2 && "lg:border-l sm:border-t",
                i === 3 && "sm:border-l lg:border-l sm:border-t lg:border-t-0",
              )}
            >
              <div className="mb-1 flex items-center gap-2">
                <h3 className="text-[0.95rem] font-semibold">{f.title}</h3>
                {f.pill && (
                  <span className="rounded-full border border-line bg-sunken px-1.5 py-0.5 font-mono text-[0.62rem] uppercase tracking-wide text-muted">
                    {f.pill}
                  </span>
                )}
              </div>
              <p className="text-[0.95rem] text-muted">{f.body}</p>
            </motion.div>
          ))}
        </section>

        {/* How it works / pipeline preview */}
        <section id="how" className="border-b border-line bg-subtle px-6 py-14">
          <div data-reveal className="mb-8 text-center">
            <span className="font-mono text-xs uppercase tracking-[0.08em] text-muted">[ HOW IT WORKS ]</span>
            <h2 className="mt-3 text-[clamp(1.5rem,3vw,2rem)] font-semibold tracking-[-0.02em]">From raw file to adaptive stream</h2>
            <p className="mt-2 text-muted">Every upload flows through an async, observable transcoding pipeline.</p>
          </div>
          <div data-reveal className="mx-auto grid max-w-[760px] grid-cols-2 overflow-hidden rounded-[10px] border border-line bg-white sm:grid-cols-5">
            {PIPELINE.map((s, i) => (
              <div key={s.lbl} className={cn("p-4 text-center text-sm", i > 0 && "border-line sm:border-l", i % 2 === 1 && "border-l", i >= 2 && "border-t sm:border-t-0")}>
                <span className="mb-1 block text-[1.3rem]">{s.ico}</span>
                <span className="font-medium">{s.lbl}</span>
              </div>
            ))}
          </div>
          <pre data-reveal className="mx-auto mt-5 max-w-[760px] overflow-x-auto rounded-[10px] bg-ink px-5 py-4 font-mono text-[0.84rem] text-neutral-200">
            <span className="text-neutral-500"># clone, then bring the whole stack up</span>{"\n"}
            <span className="text-sky-300">docker</span> compose up -d --build
          </pre>
        </section>

        {/* Tech Stack Grid */}
        <section className="border-b border-line">
          <div className="mx-auto max-w-[1280px]">
            {/* Header: Split contents left and right */}
            <div className="pt-20 pb-12 px-6 grid gap-6 md:grid-cols-2 md:items-end">
              <div>
                <span className="font-mono text-xs uppercase tracking-[0.08em] text-muted">[ POWERING THE PIPELINE ]</span>
                <h2 className="mt-3 text-[clamp(1.8rem,4vw,2.5rem)] font-semibold tracking-[-0.03em] leading-[1.1] text-ink">
                  Our Open-Source Tech Stack
                </h2>
              </div>
              <p className="text-[0.98rem] text-muted md:max-w-[42ch]">
                Built entirely on industry-standard, high-performance technologies. Hover over any stack to reveal how it powers your video workflows.
              </p>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 border-t border-line">
              {TECH_STACK.map((tech, i) => (
                <TechCell
                  key={tech.name}
                  name={tech.name}
                  icon={tech.icon}
                  usecase={tech.usecase}
                  i={i}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Value Proposition Grid */}
        <section className="border-b border-line">
          <div className="mx-auto max-w-[1280px]">
            {/* Header: Label, H2 on left, Paragraph/Details on right */}
            <div className="pt-20 pb-12 px-6 grid gap-6 md:grid-cols-2 md:items-end">
              <div>
                <span className="font-mono text-xs uppercase tracking-[0.08em] text-muted">[ SCALABLE VIDEO INFRASTRUCTURE ]</span>
                <h2 className="mt-3 text-[clamp(1.8rem,4vw,2.5rem)] font-semibold tracking-[-0.03em] leading-[1.1] text-ink">
                  Get the most out of your video workflows
                </h2>
              </div>
              <p className="text-[0.98rem] text-muted md:max-w-[42ch]">
                Take full control of your media files. Transcode, package, and serve adaptive streams globally without the premium SaaS price tags.
              </p>
            </div>

            {/* Three Cards Grid */}
            <div className="grid gap-0 md:grid-cols-3 border-t border-line">
              {/* Card 1: API */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="flex flex-col md:border-r md:border-line border-b md:border-b-0"
              >
                <div className="pt-[7px] px-[7px]">
                  <div className="aspect-[6/5] w-full rounded-[6px] border border-line bg-sunken p-4 font-mono text-[0.7rem] flex flex-col justify-between overflow-hidden shadow-inner">
                    <div className="flex items-center justify-between border-b border-line pb-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-red-400" />
                        <span className="h-2 w-2 rounded-full bg-yellow-400" />
                        <span className="h-2 w-2 rounded-full bg-green-400" />
                      </div>
                      <span className="text-[0.6rem] text-muted">POST /api/jobs</span>
                    </div>
                    <div className="flex-1 gap-3 flex flex-col justify-center">
                      <div className="rounded bg-paper p-3 border border-line text-muted">
                        <span className="text-blue-500">const</span> pipeline = <span className="text-blue-500">new</span> VideoPipeline();{"\n"}
                        <span className="text-blue-500">await</span> pipeline.transcode(rawFile, {"{"} resolutions: [<span className="text-amber-600">'1080p'</span>] {"}"});
                      </div>
                      <div className="rounded bg-ink p-3 text-neutral-300">
                        <span className="text-emerald-400">{"{"}</span> status: <span className="text-emerald-300">"processing"</span>, progress: <span className="text-amber-300">"42%"</span> <span className="text-emerald-400">{"}"}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-6 md:pl-6 md:pr-10 pt-6 pb-12">
                  <h3 className="font-semibold text-[1.1rem] text-ink mb-2">API-driven automation</h3>
                  <p className="text-[0.98rem] text-muted leading-relaxed mb-4">
                    Integrate transcoding seamlessly. Trigger processing jobs via standard REST endpoints and receive real-time updates.
                  </p>
                  <a href={REPO} target="_blank" rel="noreferrer" className="inline-flex items-center text-sm font-semibold text-ink hover:underline">
                    Developer API <span className="ml-1">→</span>
                  </a>
                </div>
              </motion.div>

              {/* Card 2: Performance */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="flex flex-col md:border-r md:border-line border-b md:border-b-0"
              >
                <div className="pt-[7px] px-[7px]">
                  <div className="aspect-[6/5] w-full rounded-[6px] border border-line bg-sunken p-4 flex flex-col justify-between overflow-hidden shadow-inner">
                    <div className="flex items-center justify-between border-b border-line pb-2 mb-2">
                      <span className="text-[0.65rem] font-mono text-muted">Transcoding Worker Pool</span>
                      <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[0.6rem] font-mono text-emerald-600">Active</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-center gap-4">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[0.7rem] font-mono">
                          <span className="text-ink">1080p (HLS)</span>
                          <span className="text-muted">100%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-line overflow-hidden">
                          <div className="h-full w-full bg-ink rounded-full" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[0.7rem] font-mono">
                          <span className="text-ink">720p (HLS)</span>
                          <span className="text-muted">82%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-line overflow-hidden">
                          <div className="h-full w-[82%] bg-ink rounded-full" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[0.7rem] font-mono">
                          <span className="text-ink">480p (HLS)</span>
                          <span className="text-muted">45%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-line overflow-hidden">
                          <div className="h-full w-[45%] bg-ink rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-6 md:px-10 pt-6 pb-12">
                  <h3 className="font-semibold text-[1.1rem] text-ink mb-2">Multi-resolution streams</h3>
                  <p className="text-[0.98rem] text-muted leading-relaxed mb-4">
                    Convert raw uploads into HLS. Enjoy adaptive, butter-smooth video delivery across mobile, web, and desktop.
                  </p>
                  <a href="#features" className="inline-flex items-center text-sm font-semibold text-ink hover:underline">
                    Pipeline features <span className="ml-1">→</span>
                  </a>
                </div>
              </motion.div>

              {/* Card 3: Storage Costs */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="flex flex-col"
              >
                <div className="pt-[7px] px-[7px]">
                  <div className="aspect-[6/5] w-full rounded-[6px] border border-line bg-sunken p-4 flex flex-col justify-between overflow-hidden shadow-inner">
                    <div className="flex items-center justify-between border-b border-line pb-2 mb-2">
                      <span className="text-[0.65rem] font-mono text-muted">Egress Savings Ratio</span>
                      <span className="text-[0.65rem] font-mono font-medium text-emerald-600">-95% Cost</span>
                    </div>
                    <div className="flex-1 flex items-end justify-around gap-4 pt-6 pb-2">
                      <div className="flex flex-col items-center gap-2 w-full">
                        <span className="text-[0.7rem] font-mono text-muted">$1,200</span>
                        <div className="w-10 bg-neutral-200 rounded-t-sm h-36" />
                        <span className="text-[0.65rem] font-semibold text-ink-2">SaaS Video</span>
                      </div>
                      <div className="flex flex-col items-center gap-2 w-full">
                        <span className="text-[0.7rem] font-mono font-bold text-emerald-600">$45</span>
                        <div className="w-10 bg-emerald-500 rounded-t-sm h-9" />
                        <span className="text-[0.65rem] font-semibold text-ink">Self-Hosted</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-6 md:pl-10 md:pr-6 pt-6 pb-12">
                  <h3 className="font-semibold text-[1.1rem] text-ink mb-2">Zero SaaS markup</h3>
                  <p className="text-[0.98rem] text-muted leading-relaxed mb-4">
                    Avoid paying hefty per-minute fees or marked-up bandwidth prices. Store and stream directly from your own storage.
                  </p>
                  <a href="#how" className="inline-flex items-center text-sm font-semibold text-ink hover:underline">
                    Compare pricing <span className="ml-1">→</span>
                  </a>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="border-b border-line bg-paper">
          <div className="mx-auto max-w-[1280px]">
            <div className="grid gap-12 md:grid-cols-[1.1fr_1.9fr] md:gap-20 py-20 px-6">
              {/* Left Column */}
              <div>
                <span className="font-mono text-xs uppercase tracking-[0.08em] text-muted">[ QUESTIONS ]</span>
                <h2 className="mt-4 text-[clamp(2.2rem,5vw,3rem)] font-semibold tracking-[-0.03em] leading-[1.05] text-ink">
                  Frequently Asked Questions
                </h2>
              </div>

              {/* Right Column (FAQ Items) */}
              <div className="border-t border-line md:border-t-0 pt-8 md:pt-0">
                {FAQ_DATA.map((faq) => (
                  <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA band */}
        <section data-reveal className="border-b border-line px-6 py-20 text-center">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-muted">[ READY? ]</span>
          <h2 className="mx-auto mt-4 max-w-[16ch] text-[clamp(2rem,5vw,3.2rem)] font-semibold leading-[1.05] tracking-[-0.02em]">
            Ship your own video platform.
          </h2>
          <p className="mx-auto mt-5 max-w-[46ch] text-muted">
            No SaaS lock-in, no per-minute billing. Run it on your own infrastructure and stream on your terms.
          </p>
          <div className="mt-8 flex justify-center">
            <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={onSignIn} className={cn(btn.primary, "glare-effect")}>
              Get started →
            </motion.button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mx-auto max-w-[1280px] border-x border-line px-6 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Brand />
            <p className="mt-3 max-w-[26ch] text-sm text-muted">An open-source, self-hosted video-on-demand platform.</p>
          </div>
          <FootCol title="Product" links={[["Features", "#features"], ["How it works", "#how"]]} onSignIn={onSignIn} />
          <FootCol title="Resources" links={[["Documentation", REPO], ["Architecture", `${REPO}/blob/main/docs/architecture.md`]]} />
          <FootCol title="Project" links={[["GitHub", REPO], ["Issues", `${REPO}/issues`]]} />
        </div>
      </footer>
      <div className="mx-auto flex max-w-[1280px] flex-wrap justify-between gap-2 border-x border-t border-line px-6 py-5 text-[0.82rem] text-muted">
        <span>© {new Date().getFullYear()} Video Pipeline. MIT Licensed.</span>
        <span>Built by Archilect Studios</span>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <span className="flex items-center gap-2 text-[0.98rem] font-semibold">
      <span className="inline-block h-4 w-4 rounded-full border-[3px] border-ink" /> Video Pipeline
    </span>
  );
}

function FootCol({ title, links, onSignIn }: { title: string; links: string[][]; onSignIn?: () => void }) {
  return (
    <div>
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">{title}</h4>
      <ul className="flex flex-col gap-2.5">
        {links.map(([t, h]) => (
          <li key={t}>
            <a href={h} target={h.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="text-sm text-ink-2 transition-colors hover:text-ink">{t}</a>
          </li>
        ))}
        {onSignIn && (
          <li><button onClick={onSignIn} className="text-sm text-ink-2 transition-colors hover:text-ink">Sign in</button></li>
        )}
      </ul>
    </div>
  );
}

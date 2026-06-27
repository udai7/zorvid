import { useState } from "react";
import { cn } from "../lib/ui";

interface SystemNode {
  id: string;
  title: string;
  sub: string;
  desc: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const NODES: SystemNode[] = [
  {
    id: "browser",
    title: "Browser Client",
    sub: "React SPA · hls.js",
    desc: "Ingests inputs, segments uploads, and executes adaptive HLS streaming playback.",
    x: 40,
    y: 220,
    w: 190,
    h: 110,
  },
  {
    id: "cloudflare",
    title: "Cloudflare CDN",
    sub: "Edge Caching",
    desc: "Absorbs video viewer load, serving cached HLS chunks & resolving SSL at the edge.",
    x: 280,
    y: 100,
    w: 190,
    h: 110,
  },
  {
    id: "nginx",
    title: "nginx Gateway",
    sub: "Reverse Proxy",
    desc: "Proxies /api requests, serves the SPA static files, and controls TLS termination.",
    x: 280,
    y: 340,
    w: 190,
    h: 110,
  },
  {
    id: "api",
    title: "API (Fastify)",
    sub: "Core App Layer",
    desc: "Validates auth/JWT, coordinates database operations, and spawns job queues.",
    x: 520,
    y: 100,
    w: 190,
    h: 110,
  },
  {
    id: "worker",
    title: "Worker Pool",
    sub: "FFmpeg Compute",
    desc: "Scaleable cluster processing async FFmpeg transcoding ladders & HLS segmenting.",
    x: 520,
    y: 340,
    w: 190,
    h: 110,
  },
  {
    id: "redis",
    title: "Redis + BullMQ",
    sub: "Job Queueing",
    desc: "Durable in-memory backing for concurrency handling, backoff, and task retries.",
    x: 770,
    y: 40,
    w: 190,
    h: 105,
  },
  {
    id: "postgres",
    title: "PostgreSQL",
    sub: "Relational DB",
    desc: "Durable records for video processing states, user authorization, and job logs.",
    x: 770,
    y: 222,
    w: 190,
    h: 105,
  },
  {
    id: "minio",
    title: "MinIO Storage",
    sub: "S3 Object Store",
    desc: "Decoupled storage backend housing raw file uploads, output playlists, and posters.",
    x: 770,
    y: 405,
    w: 190,
    h: 105,
  },
];

const PATHS = [
  { id: "browser-cloudflare", from: "browser", to: "cloudflare", d: "M 230 275 C 255 275, 255 155, 280 155" },
  { id: "browser-nginx", from: "browser", to: "nginx", d: "M 230 275 C 255 275, 255 395, 280 395" },
  { id: "cloudflare-nginx", from: "cloudflare", to: "nginx", d: "M 375 210 L 375 340" },
  { id: "nginx-api", from: "nginx", to: "api", d: "M 470 395 C 495 395, 495 155, 520 155" },
  { id: "api-redis", from: "api", to: "redis", d: "M 710 155 C 740 155, 740 92.5, 770 92.5" },
  { id: "api-postgres", from: "api", to: "postgres", d: "M 710 155 C 740 155, 740 274.5, 770 274.5" },
  { id: "api-minio", from: "api", to: "minio", d: "M 710 155 C 740 155, 740 457.5, 770 457.5" },
  { id: "redis-worker", from: "redis", to: "worker", d: "M 770 92.5 C 740 92.5, 740 395, 710 395" },
  { id: "worker-postgres", from: "worker", to: "postgres", d: "M 710 395 C 740 395, 740 274.5, 770 274.5" },
  { id: "worker-minio", from: "worker", to: "minio", d: "M 710 395 C 740 395, 740 457.5, 770 457.5" },
];

const CONNECTIONS: Record<string, string[]> = {
  browser: ["browser-cloudflare", "browser-nginx"],
  cloudflare: ["browser-cloudflare", "cloudflare-nginx"],
  nginx: ["browser-nginx", "cloudflare-nginx", "nginx-api"],
  api: ["nginx-api", "api-redis", "api-postgres", "api-minio"],
  worker: ["redis-worker", "worker-postgres", "worker-minio"],
  redis: ["api-redis", "redis-worker"],
  postgres: ["api-postgres", "worker-postgres"],
  minio: ["api-minio", "worker-minio"],
};

export default function ArchitectureDiagram() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Helper to check if a node is connected to the hovered node
  const isNodeConnected = (id: string) => {
    if (hoveredNode === null) return true;
    if (hoveredNode === id) return true;
    return CONNECTIONS[hoveredNode]?.some((pathId) => {
      const path = PATHS.find((p) => p.id === pathId);
      return path && (path.from === id || path.to === id);
    });
  };

  // Helper to check if a path is active/highlighted
  const isPathActive = (pathId: string) => {
    if (hoveredNode === null) return false;
    return CONNECTIONS[hoveredNode]?.includes(pathId);
  };

  return (
    <div className="w-full">
      {/* Desktop Visual Map — light panel */}
      <div className="hidden lg:block w-full select-none rounded-xl border border-line bg-gradient-to-br from-white via-paper to-subtle p-6 shadow-sm">
        <div className="w-full overflow-x-auto">
          <div className="relative mx-auto h-[550px] w-[1000px]">
            {/* Ambient grid texture */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.25]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(14,165,233,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.08) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
                maskImage: "radial-gradient(ellipse 80% 70% at 50% 50%, #000 40%, transparent 100%)",
                WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 50%, #000 40%, transparent 100%)",
              }}
            />

            {/* SVG Fiber-Optic Connection Layer */}
            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1000 550">
              <defs>
                {/* Cable core gradient (the glass strand) */}
                <linearGradient id="cable-core" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#1e3a5f" />
                  <stop offset="50%" stopColor="#2a4d75" />
                  <stop offset="100%" stopColor="#1e3a5f" />
                </linearGradient>
                {/* The travelling photon */}
                <radialGradient id="beam-core">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="35%" stopColor="#7dd3fc" />
                  <stop offset="100%" stopColor="rgba(56,189,248,0)" />
                </radialGradient>
                {/* Soft glow for active fibers + photons */}
                <filter id="fiber-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2.4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Fiber cables */}
              {PATHS.map((path, i) => {
                const active = isPathActive(path.id);
                const dimmed = hoveredNode !== null && !active;

                return (
                  <g
                    key={path.id}
                    className={cn(
                      "transition-opacity duration-300",
                      dimmed ? "opacity-15" : "opacity-100"
                    )}
                  >
                    {/* Outer glow halo (only when active) */}
                    {active && (
                      <path
                        d={path.d}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth={6}
                        strokeLinecap="round"
                        opacity={0.18}
                        filter="url(#fiber-glow)"
                      />
                    )}
                    {/* The glass strand */}
                    <path
                      d={path.d}
                      fill="none"
                      stroke={active ? "#38bdf8" : "#cbd5e1"}
                      strokeWidth={active ? 1.8 : 1.4}
                      strokeLinecap="round"
                      className="transition-all duration-300"
                    />
                    {/* Beam of light travelling along the fiber */}
                    <circle r={active ? 4.5 : 3} fill="url(#beam-core)" filter="url(#fiber-glow)">
                      <animateMotion
                        dur={`${2.6 + (i % 3) * 0.4}s`}
                        begin={`${(i * 0.45).toFixed(2)}s`}
                        repeatCount="indefinite"
                        path={path.d}
                        rotate="auto"
                      />
                    </circle>
                  </g>
                );
              })}
            </svg>

            {/* Glass Node Cards */}
            {NODES.map((node) => {
              const connected = isNodeConnected(node.id);
              const isHovered = hoveredNode === node.id;
              const dimmed = hoveredNode !== null && !connected;

              return (
                <div
                  key={node.id}
                  style={{
                    position: "absolute",
                    left: node.x,
                    top: node.y,
                    width: node.w,
                    height: node.h,
                  }}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  className={cn(
                    "group relative flex cursor-pointer flex-col justify-between rounded-[6px] border border-line p-3.5 bg-white transition-all duration-300",
                    dimmed && "scale-[0.98] border-line opacity-30",
                    !dimmed && "scale-100 opacity-100",
                    isHovered
                      ? "border-sky-500 shadow-md ring-[3px] ring-sky-500/5"
                      : "border-line shadow-sm hover:border-sky-500/30"
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[0.82rem] font-bold tracking-tight text-ink">{node.title}</span>
                    </div>
                    <span className="mt-0.5 block font-mono text-[0.7rem] text-sky-600">{node.sub}</span>
                  </div>
                  <p className="mt-2 line-clamp-3 text-[0.68rem] leading-relaxed text-muted">
                    {node.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile / Tablet Stack */}
      <div className="flex flex-col gap-4 rounded-xl border border-line bg-gradient-to-br from-white to-subtle p-4 lg:hidden">
        {NODES.map((node) => (
          <div
            key={node.id}
            className="relative rounded-[6px] border border-line bg-white p-5 transition-colors hover:border-sky-500/50"
          >
            <div className="mb-2 flex items-center justify-between border-b border-line pb-2">
              <span className="text-sm font-bold text-ink">{node.title}</span>
              <span className="font-mono text-xs text-sky-600">{node.sub}</span>
            </div>
            <p className="text-xs leading-relaxed text-muted">{node.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

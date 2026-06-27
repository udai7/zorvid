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
      {/* Desktop Visual Map */}
      <div className="hidden lg:block w-full overflow-x-auto select-none py-4">
        <div className="relative w-[1000px] h-[550px] mx-auto">
          {/* SVG Connection Layers */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 550">
            <defs>
              <marker
                id="arrow-default"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#d4d4d8" />
              </marker>
              <marker
                id="arrow-active"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#18181b" />
              </marker>
            </defs>

            {/* Background Paths */}
            {PATHS.map((path) => {
              const active = isPathActive(path.id);
              const dimmed = hoveredNode !== null && !active;

              return (
                <path
                  key={path.id}
                  d={path.d}
                  fill="none"
                  stroke={active ? "#18181b" : "#e4e4e7"}
                  strokeWidth={active ? 2.5 : 1.5}
                  markerEnd={active ? "url(#arrow-active)" : "url(#arrow-default)"}
                  className={cn(
                    "transition-all duration-300",
                    dimmed && "opacity-20",
                    active && "stroke-[2.5px] text-ink drop-shadow-[0_1px_3px_rgba(24,24,27,0.1)]"
                  )}
                />
              );
            })}
          </svg>

          {/* Node Cards */}
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
                  "rounded-md border p-3 flex flex-col justify-between transition-all duration-300 cursor-pointer bg-white",
                  dimmed && "opacity-30 scale-[0.98] border-line",
                  !dimmed && "opacity-100 scale-100",
                  isHovered ? "border-ink shadow-md ring-[3px] ring-ink/5" : "border-line shadow-sm hover:border-ink hover:shadow"
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[0.82rem] font-bold tracking-tight text-ink">{node.title}</span>
                  </div>
                  <span className="text-[0.7rem] font-mono text-muted block mt-0.5">{node.sub}</span>
                </div>
                <p className="text-[0.68rem] text-muted-2 leading-relaxed mt-2 line-clamp-3">
                  {node.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile / Tablet Accordion-Style Stack */}
      <div className="lg:hidden flex flex-col gap-4">
        {NODES.map((node) => (
          <div
            key={node.id}
            className="rounded-lg border border-line bg-white p-5 shadow-sm hover:border-ink transition-colors"
          >
            <div className="flex items-center justify-between border-b border-line pb-2 mb-2">
              <span className="text-sm font-bold text-ink">{node.title}</span>
              <span className="text-xs font-mono text-muted">{node.sub}</span>
            </div>
            <p className="text-xs text-muted-2 leading-relaxed">{node.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

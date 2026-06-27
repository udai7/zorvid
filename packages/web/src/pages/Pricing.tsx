import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PageHero, PageShell, Eyebrow } from "../components/Page";
import { btn, cn } from "../lib/ui";
import { REPO } from "../constants";

const PLANS = [
  {
    name: "Self-hosted",
    price: "$0",
    unit: "forever",
    blurb: "The whole platform, MIT-licensed. Run it on your own hardware or cloud and pay only your infrastructure bill.",
    cta: ["Get started", "/register"] as const,
    primary: true,
    features: [
      "Unlimited videos & transcoding",
      "1080p / 720p / 480p HLS ladder",
      "S3-compatible storage (MinIO, R2, S3)",
      "Private + public delivery",
      "Full source, no per-minute fees",
    ],
  },
  {
    name: "Bring your own cloud",
    price: "Infra",
    unit: "at cost",
    blurb: "Point Vodeum at your existing object storage and compute. You keep the egress savings; there is no markup in between.",
    cta: ["Read the docs", "/docs"] as const,
    primary: false,
    features: [
      "Deploy with one docker compose up",
      "Horizontal worker scaling",
      "Cloudflare / nginx edge caching",
      "Connect AWS S3, GCS or R2",
      "Your data never leaves your account",
    ],
  },
  {
    name: "Community",
    price: "Open",
    unit: "source",
    blurb: "Built in the open. File issues, send pull requests, and shape the roadmap alongside everyone else running Vodeum.",
    cta: ["View on GitHub", REPO] as const,
    primary: false,
    features: [
      "Public issue tracker",
      "Architecture & deployment docs",
      "Configurable FFmpeg ladder",
      "No vendor lock-in",
      "Apache-friendly MIT license",
    ],
  },
];

export function Pricing() {
  return (
    <PageShell>
      <PageHero
        eyebrowLeft="HONEST"
        eyebrowRight="PRICING"
        title="No per-minute billing. Ever."
        intro="Hosted video platforms mark up bandwidth and transcoding 5–10×. Vodeum is open source — you run it yourself and pay only for the storage and compute you actually use."
      />

      <section className="grid grid-cols-1 md:grid-cols-3">
        {PLANS.map((plan, i) => {
          const [label, href] = plan.cta;
          const external = href.startsWith("http");
          return (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className={cn(
                "flex flex-col border-line p-8",
                i > 0 && "border-t md:border-t-0 md:border-l",
                plan.primary && "bg-sunken",
              )}
            >
              <h3 className="text-[0.95rem] font-semibold text-ink">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-[2.6rem] font-[650] leading-none tracking-[-0.03em] text-ink">{plan.price}</span>
                <span className="text-sm text-muted">{plan.unit}</span>
              </div>
              <p className="mt-4 text-[0.92rem] leading-relaxed text-muted">{plan.blurb}</p>

              <ul className="mt-6 flex flex-col gap-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[0.9rem] text-ink-2">
                    <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-8 pt-2">
                {external ? (
                  <a href={href} target="_blank" rel="noreferrer" className={cn(plan.primary ? btn.primary : btn.secondary, "w-full")}>
                    {label}
                  </a>
                ) : (
                  <Link to={href} className={cn(plan.primary ? btn.primary : btn.secondary, "w-full")}>
                    {label}
                  </Link>
                )}
              </div>
            </motion.div>
          );
        })}
      </section>

      <section className="border-t border-line px-6 py-14">
        <Eyebrow left="THE" right="MATH" />
        <p className="mt-5 max-w-[60ch] text-[1.02rem] leading-relaxed text-ink-2">
          A typical SaaS video provider charges around <span className="font-semibold text-ink">$1,200/mo</span> for the
          bandwidth and transcoding a mid-size library consumes. The same workload self-hosted on commodity object
          storage and a single worker runs closer to <span className="font-semibold text-emerald-600">$45/mo</span> —
          roughly a <span className="font-semibold text-ink">95% reduction</span>, with no minutes to meter.
        </p>
      </section>
    </PageShell>
  );
}

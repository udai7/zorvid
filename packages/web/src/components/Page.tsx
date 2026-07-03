import type { ReactNode } from "react";
import { motion } from "framer-motion";

/** Monospace section label, e.g. [ PRODUCT · FEATURES ]. */
export function Eyebrow({ left, right }: { left: string; right: string }) {
  return (
    <span className="font-mono text-xs uppercase tracking-[0.08em] text-muted">
      [ <span className="text-brand">{left}</span> · <span className="text-ink">{right}</span> ]
    </span>
  );
}

/** Shared hero band for marketing content pages. */
export function PageHero({
  eyebrowLeft,
  eyebrowRight,
  title,
  intro,
  children,
}: {
  eyebrowLeft: string;
  eyebrowRight: string;
  title: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="border-b border-line px-6 pb-14 pt-20">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <Eyebrow left={eyebrowLeft} right={eyebrowRight} />
        <h1 className="mt-4 max-w-[20ch] text-[clamp(2.2rem,5.4vw,3.4rem)] font-[650] leading-[1.05] tracking-[-0.02em]">
          {title}
        </h1>
        {intro && <p className="mt-5 max-w-[70ch] text-[1.05rem] text-ink-2">{intro}</p>}
        {children}
      </motion.div>
    </section>
  );
}

/** Standard page shell: the bordered max-width column used across the site. */
export function PageShell({ children }: { children: ReactNode }) {
  return <main className="mx-auto w-full max-w-[1280px] border-x border-line">{children}</main>;
}

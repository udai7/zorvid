import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "../lib/ui";

function CopyRow({ label, value, multiline = false }: { label: string; value: string; multiline?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="font-mono text-[0.7rem] uppercase tracking-wide text-muted">{label}</span>
        <button onClick={copy} className="text-xs font-medium text-ink hover:underline">
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
      {multiline ? (
        <textarea
          readOnly
          value={value}
          rows={3}
          onFocus={(e) => e.currentTarget.select()}
          className="w-full resize-none rounded-md border border-line bg-sunken p-2.5 font-mono text-[0.75rem] text-ink-2"
        />
      ) : (
        <input
          readOnly
          value={value}
          onFocus={(e) => e.currentTarget.select()}
          className="w-full rounded-md border border-line bg-sunken px-2.5 py-2 font-mono text-[0.75rem] text-ink-2"
        />
      )}
    </div>
  );
}

export function ShareModal({ id, isPublic, onClose }: { id: string; isPublic: boolean; onClose: () => void }) {
  const origin = window.location.origin;
  const shareUrl = `${origin}/embed/${id}`;
  const embedCode = `<iframe src="${shareUrl}" width="640" height="360" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>`;

  return (
    <motion.div
      className="fixed inset-0 z-30 grid place-items-center bg-black/55 p-4 backdrop-blur-sm"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="relative w-full max-w-[480px] rounded-[10px] border border-line bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <button className="absolute right-3 top-2 text-2xl leading-none text-muted transition-colors hover:text-ink" onClick={onClose}>
          ×
        </button>
        <h2 className="text-[1.1rem] font-semibold">Share video</h2>

        <div
          className={cn(
            "mt-2 rounded-md border px-3 py-2 text-[0.82rem]",
            isPublic ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800",
          )}
        >
          {isPublic
            ? "This video is public — anyone with the link can watch."
            : "This video is private. Make it public for the share link and embed to play for others."}
        </div>

        <div className="mt-4 flex flex-col gap-4">
          <CopyRow label="Share link" value={shareUrl} />
          <CopyRow label="Embed code" value={embedCode} multiline />
        </div>
      </motion.div>
    </motion.div>
  );
}

// Shared Tailwind class strings so buttons stay consistent across the app.
const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium " +
  "transition-colors disabled:opacity-45 disabled:cursor-default cursor-pointer whitespace-nowrap";

export const btn = {
  primary: `${base} px-4 py-2 text-sm border border-ink bg-ink text-white hover:bg-neutral-800`,
  primarySm: `${base} px-3.5 py-1 text-xs border border-ink bg-ink text-white hover:bg-neutral-800`,
  secondary: `${base} px-4 py-2 text-sm border border-line-strong bg-white text-ink hover:bg-sunken`,
  secondarySm: `${base} px-3.5 py-1 text-xs border border-line-strong bg-white text-ink hover:bg-sunken`,
  danger: `${base} px-4 py-2 text-sm border border-line-strong bg-white text-err hover:bg-err-soft hover:border-red-200`,
  ghost: "text-muted hover:text-ink transition-colors cursor-pointer",
  cta: "px-6 py-3 text-[0.95rem]",
};

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

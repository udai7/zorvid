import { useState } from "react";

export const inputClass =
  "w-full rounded-lg border border-line-strong bg-white px-3 py-2 text-sm " +
  "placeholder:text-muted focus:border-ink focus:outline-none focus:ring-0";

interface PasswordFieldProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  minLength?: number;
}

/** Password input with a show/hide toggle. */
export function PasswordField({ value, onChange, placeholder = "password", autoComplete, minLength }: PasswordFieldProps) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative w-full">
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        autoComplete={autoComplete}
        minLength={minLength}
        className={`${inputClass} pr-10`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted transition-colors hover:text-ink focus:outline-none"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
        )}
      </button>
    </div>
  );
}

/** Marketing highlights shown beside the auth card (left column). */
const highlights = [
  {
    title: "Adaptive HLS streaming",
    body: "Every upload is transcoded into multiple renditions and delivered as adaptive HLS for smooth playback on any connection.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
    ),
  },
  {
    title: "Own your pipeline",
    body: "Self-hosted, S3-compatible storage and FFmpeg workers you fully control — no per-minute vendor lock-in.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
    ),
  },
  {
    title: "Secure by default",
    body: "Email 2FA, signed private-stream URLs, rate-limited auth, and per-user upload limits — built in from day one.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    ),
  },
];

const stack = ["Fastify", "FFmpeg", "HLS.js", "MinIO", "BullMQ", "Postgres"];

/**
 * Shared shell for the auth screens: a two-column layout with a marketing
 * panel on the left (hidden on small screens) and the auth card on the right.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-subtle">
      <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-center gap-12 px-6 py-8 lg:grid-cols-2 lg:gap-16">
        {/* Left: value proposition */}
        <div className="hidden lg:block">
          <h1 className="max-w-md text-xl font-semibold leading-snug tracking-tight text-ink">
            Zorvid makes it easy to upload, transcode, and stream video at scale
          </h1>

          <div className="mt-7 flex flex-col gap-5">
            {highlights.map((h) => (
              <div key={h.title} className="flex gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.6}
                  stroke="currentColor"
                  className="mt-0.5 h-4 w-4 flex-none text-ink"
                >
                  {h.icon}
                </svg>
                <div>
                  <h2 className="text-[13px] font-semibold text-ink">{h.title}</h2>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted">{h.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 border-t border-dashed border-line-strong" />
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted">Built on open-source</span>
              <span className="h-px flex-1 border-t border-dashed border-line-strong" />
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              {stack.map((name) => (
                <span key={name} className="font-mono text-xs font-medium text-ink/70">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right: auth card (Login / Register) */}
        <div className="flex justify-center lg:justify-end">{children}</div>
      </div>

      {/* Footer */}
      <footer className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 text-xs text-muted">
        <span>© {new Date().getFullYear()} Zorvid</span>
        <a href="/terms" className="transition-colors hover:text-ink">
          Terms of Service
        </a>
      </footer>
    </div>
  );
}

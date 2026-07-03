import { useState } from "react";
import { api } from "../api";
import { btn, cn } from "../lib/ui";
import { inputClass } from "./Field";
import type { AuthResponse, OtpPurpose } from "../types";

export function OtpForm({
  email,
  purpose,
  initialDevCode,
  onVerified,
  onBack,
}: {
  email: string;
  purpose: OtpPurpose;
  initialDevCode?: string;
  onVerified: (res: AuthResponse) => void;
  onBack: () => void;
}) {
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState(initialDevCode);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api.verifyOtp(email, code.trim(), purpose);
      onVerified(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "verification failed");
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setError(null);
    setInfo(null);
    try {
      const r = await api.resendOtp(email, purpose);
      setDevCode(r.devCode);
      setInfo("A new code is on its way.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "could not resend code");
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3.5">
      <span className="font-mono text-xs uppercase tracking-[0.08em] text-muted">[ <span className="text-ink">VERIFY EMAIL</span> ]</span>
      <h1 className="text-[1.35rem] font-semibold tracking-[-0.02em]">Enter your code</h1>
      <p className="-mt-1 text-sm text-muted">
        We sent a 6-digit verification code to <span className="font-medium text-ink">{email}</span>.
      </p>

      {devCode && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[0.82rem] text-amber-800">
          Dev mode (email delivery off) — your code is <span className="font-mono font-semibold">{devCode}</span>
        </p>
      )}

      <input
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={6}
        placeholder="------"
        className={cn(inputClass, "text-center font-mono text-xl tracking-[0.5em]")}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        required
        autoFocus
      />

      <button type="submit" disabled={busy || code.length < 6} className={btn.primary}>
        {busy ? "Verifying…" : "Verify & continue"}
      </button>

      {error && <p className="text-sm text-err">{error}</p>}
      {info && <p className="text-sm text-muted">{info}</p>}

      <div className="flex items-center justify-between text-sm text-muted">
        <button type="button" onClick={onBack} className="transition-colors hover:text-ink">
          ← back
        </button>
        <button type="button" onClick={resend} className="font-medium text-ink hover:underline">
          Resend code
        </button>
      </div>
    </form>
  );
}

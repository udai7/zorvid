import { useState } from "react";
import { motion } from "framer-motion";
import { api, setToken } from "../api";
import { btn, cn } from "../lib/ui";

const input =
  "w-full rounded-lg border border-line-strong bg-white px-3 py-2.5 text-[0.95rem] " +
  "placeholder:text-muted focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand-soft";

export function Login({ onAuthed, onBack }: { onAuthed: () => void; onBack?: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(mode: "login" | "register") {
    setError(null);
    setBusy(true);
    try {
      const { token } = await (mode === "login"
        ? api.login(email, password)
        : api.register(email, password));
      setToken(token);
      onAuthed();
    } catch (e) {
      setError(e instanceof Error ? e.message : `${mode} failed`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-subtle px-6">
      <motion.form
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
        className="flex w-full max-w-[400px] flex-col gap-3.5 rounded-[10px] border border-line bg-white p-6 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          submit("login");
        }}
      >
        {onBack && (
          <button type="button" onClick={onBack} className="self-start text-sm text-muted transition-colors hover:text-ink">
            ← back
          </button>
        )}
        <span className="font-mono text-xs uppercase tracking-[0.08em] text-muted">[ SIGN IN ]</span>
        <h1 className="flex items-center gap-2 text-[1.35rem] font-semibold tracking-[-0.02em]">
          <span className="inline-block h-4 w-4 rounded-full border-[3px] border-ink" /> Video Pipeline
        </h1>
        <p className="-mt-1 text-sm text-muted">Sign in to upload and stream videos.</p>

        <input
          type="email"
          placeholder="email"
          autoComplete="username"
          className={input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="password (min 8 chars)"
          autoComplete="current-password"
          minLength={8}
          className={input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div className="flex gap-2">
          <button type="submit" disabled={busy} className={cn(btn.primary, "flex-1")}>
            Log in
          </button>
          <button type="button" disabled={busy} onClick={() => submit("register")} className={cn(btn.secondary, "flex-1")}>
            Register
          </button>
        </div>
        {error && <p className="text-sm text-err">{error}</p>}
      </motion.form>
    </div>
  );
}

import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "../api";
import { useAuth } from "../auth";
import { btn, cn } from "../lib/ui";
import { AuthShell, PasswordField, inputClass } from "./Field";
import { Brand } from "./Navbar";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { token } = await api.login(email, password);
      login(token);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <motion.form
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
        className="relative flex w-full max-w-[400px] flex-col gap-3.5 overflow-hidden rounded-[10px] border border-line bg-white p-6 shadow-sm"
        onSubmit={submit}
      >
        <Link to="/" className="self-start text-sm text-muted transition-colors hover:text-ink">
          ← back
        </Link>
        <span className="font-mono text-xs uppercase tracking-[0.08em] text-muted">[ <span className="text-ink">SIGN IN</span> ]</span>
        <Brand className="text-[1.35rem]" />
        <p className="-mt-1 text-sm text-muted">Welcome back. Sign in to upload and stream videos.</p>

        <input
          type="email"
          placeholder="email"
          autoComplete="username"
          className={inputClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <PasswordField value={password} onChange={setPassword} autoComplete="current-password" minLength={8} />

        <button type="submit" disabled={busy} className={cn(btn.primary, "mt-1")}>
          {busy ? "Signing in…" : "Log in"}
        </button>
        {error && <p className="text-sm text-err">{error}</p>}

        <p className="mt-1 text-center text-sm text-muted">
          New to Vodeum?{" "}
          <Link to="/register" className="font-medium text-ink hover:underline">
            Create an account
          </Link>
        </p>
      </motion.form>
    </AuthShell>
  );
}

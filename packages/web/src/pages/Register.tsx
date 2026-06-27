import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "../api";
import { useAuth } from "../auth";
import { btn, cn } from "../lib/ui";
import { AuthShell, PasswordField, inputClass } from "../components/Field";
import { Brand } from "../components/Navbar";

export function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!accepted) {
      setError("Please accept the Terms and Privacy Policy to continue.");
      return;
    }

    setBusy(true);
    try {
      const { token } = await api.register(email, password);
      login(token);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "registration failed");
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
        className="relative flex w-full max-w-[420px] flex-col gap-3.5 overflow-hidden rounded-[10px] border border-line bg-white p-6 shadow-sm"
        onSubmit={submit}
      >
        <Link to="/" className="self-start text-sm text-muted transition-colors hover:text-ink">
          ← back
        </Link>
        <span className="font-mono text-xs uppercase tracking-[0.08em] text-muted">[ <span className="text-ink">CREATE ACCOUNT</span> ]</span>
        <Brand className="text-[1.35rem]" />
        <p className="-mt-1 text-sm text-muted">Set up your Vodeum account to start uploading and streaming.</p>

        <input
          type="email"
          placeholder="email"
          autoComplete="email"
          className={inputClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <PasswordField value={password} onChange={setPassword} placeholder="password (min 8 chars)" autoComplete="new-password" minLength={8} />
        <PasswordField value={confirm} onChange={setConfirm} placeholder="confirm password" autoComplete="new-password" minLength={8} />

        <label className="flex items-start gap-2.5 text-sm text-muted">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 cursor-pointer accent-ink"
          />
          <span>
            I agree to the{" "}
            <Link to="/terms" className="font-medium text-ink hover:underline">Terms</Link> and{" "}
            <Link to="/privacy" className="font-medium text-ink hover:underline">Privacy Policy</Link>.
          </span>
        </label>

        <button type="submit" disabled={busy} className={cn(btn.primary, "mt-1")}>
          {busy ? "Creating account…" : "Create account"}
        </button>
        {error && <p className="text-sm text-err">{error}</p>}

        <p className="mt-1 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-ink hover:underline">
            Sign in
          </Link>
        </p>
      </motion.form>
    </AuthShell>
  );
}

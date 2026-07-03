import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "../api";
import { useAuth } from "../auth";
import { btn, cn } from "../lib/ui";
import { AuthShell, PasswordField, inputClass } from "../components/Field";
import { OtpForm } from "../components/OtpForm";
import { GoogleButton } from "../components/GoogleButton";
import { Brand } from "../components/Navbar";
import { isOtpChallenge, type AuthResponse } from "../types";

export function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [pending, setPending] = useState<{ email: string; devCode?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const complete = useCallback(
    (res: AuthResponse) => {
      login(res.token);
      navigate("/dashboard", { replace: true });
    },
    [login, navigate],
  );

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
      const res = await api.register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password,
      });
      if (isOtpChallenge(res)) setPending({ email: res.email, devCode: res.devCode });
      else complete(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "registration failed");
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle(credential: string) {
    setError(null);
    try {
      complete(await api.googleAuth(credential));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    }
  }

  return (
    <AuthShell>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
        className="relative flex w-full max-w-[420px] flex-col gap-3 overflow-hidden rounded-[10px] border border-line bg-white p-5 shadow-sm"
      >
        {pending ? (
          <OtpForm
            email={pending.email}
            purpose="register"
            initialDevCode={pending.devCode}
            onVerified={complete}
            onBack={() => setPending(null)}
          />
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3">
            <Link to="/" className="self-start text-xs text-muted transition-colors hover:text-ink">
              ← back
            </Link>
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">[ <span className="text-ink">CREATE ACCOUNT</span> ]</span>
            <Brand className="text-xl" />
            <p className="-mt-1 text-xs text-muted">Set up your Zorvid account to start uploading and streaming.</p>

            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="first name"
                autoComplete="given-name"
                className={inputClass}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="last name"
                autoComplete="family-name"
                className={inputClass}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            <input
              type="tel"
              placeholder="phone number"
              autoComplete="tel"
              className={inputClass}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
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

            <label className="flex items-start gap-2.5 text-xs text-muted">
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
            {error && <p className="text-xs text-err">{error}</p>}

            <GoogleButton onCredential={onGoogle} onError={setError} />

            <p className="mt-1 text-center text-xs text-muted">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-ink hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        )}
      </motion.div>
    </AuthShell>
  );
}

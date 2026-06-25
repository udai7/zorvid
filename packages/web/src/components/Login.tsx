import { useState } from "react";
import { api, setToken } from "../api";

export function Login({ onAuthed }: { onAuthed: () => void }) {
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
    <div className="auth-screen">
      <form
        className="card auth"
        onSubmit={(e) => {
          e.preventDefault();
          submit("login");
        }}
      >
        <h1>🎬 Video Pipeline</h1>
        <p className="muted">Sign in to upload and stream videos.</p>
        <input
          type="email"
          placeholder="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="password (min 8 chars)"
          autoComplete="current-password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div className="row">
          <button type="submit" disabled={busy}>
            Log in
          </button>
          <button
            type="button"
            className="secondary"
            disabled={busy}
            onClick={() => submit("register")}
          >
            Register
          </button>
        </div>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
}

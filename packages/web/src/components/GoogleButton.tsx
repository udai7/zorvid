import { useEffect, useRef } from "react";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

// Minimal typing for the Google Identity Services global.
interface GoogleIdentity {
  accounts: {
    id: {
      initialize: (cfg: { client_id: string; callback: (r: { credential: string }) => void }) => void;
      renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
    };
  };
}
declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

let gisPromise: Promise<void> | null = null;
function loadGis(): Promise<void> {
  if (gisPromise) return gisPromise;
  gisPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("failed to load Google sign-in"));
    document.head.appendChild(s);
  });
  return gisPromise;
}

/** Renders a "Continue with Google" button — only when VITE_GOOGLE_CLIENT_ID is set. */
export function GoogleButton({
  onCredential,
  onError,
}: {
  onCredential: (credential: string) => void;
  onError?: (message: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!CLIENT_ID || !ref.current) return;
    let cancelled = false;

    loadGis()
      .then(() => {
        if (cancelled || !ref.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID!,
          callback: (resp) => onCredential(resp.credential),
        });
        window.google.accounts.id.renderButton(ref.current, {
          theme: "outline",
          size: "large",
          text: "continue_with",
          width: 340,
        });
      })
      .catch((e) => onError?.(e instanceof Error ? e.message : "Google sign-in unavailable"));

    return () => {
      cancelled = true;
    };
  }, [onCredential, onError]);

  if (!CLIENT_ID) return null;

  return (
    <div>
      <div className="my-1 flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-xs text-muted">or</span>
        <span className="h-px flex-1 bg-line" />
      </div>
      <div ref={ref} className="flex justify-center" />
    </div>
  );
}

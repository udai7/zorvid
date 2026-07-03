import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { btn, cn } from "../lib/ui";
import { BRAND, NAV_LINKS, REPO } from "../constants";
import { useAuth } from "../auth";

export function Brand({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2 text-[0.98rem] font-semibold text-ink", className)}>
      <img src="/zorvid.png" alt="Zorvid logo" className="h-5 w-5 rounded-[5px] object-contain" /> {BRAND}
    </Link>
  );
}

export function Navbar() {
  const { isAuthed } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-[60px] max-w-[1280px] items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-8">
          <Brand />
          <nav className="hidden gap-6 md:flex">
            {NAV_LINKS.map(([t, h]) => (
              <Link key={t} to={h} className="text-sm text-muted transition-colors hover:text-ink">
                {t}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <a href={REPO} target="_blank" rel="noreferrer" className="hidden text-muted transition-colors hover:text-ink sm:block" aria-label="GitHub repository">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
          </a>

          {isAuthed ? (
            <Link to="/dashboard" className={btn.primary}>
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="hidden text-sm text-muted transition-colors hover:text-ink sm:block">
                Sign in
              </Link>
              <motion.span whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}>
                <Link to="/register" className={btn.primary}>
                  Get started
                </Link>
              </motion.span>
            </>
          )}

          <button
            className="text-muted transition-colors hover:text-ink md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d={open ? "M6 18 18 6M6 6l12 12" : "M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"} />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-line px-6 py-3 md:hidden">
          {NAV_LINKS.map(([t, h]) => (
            <Link key={t} to={h} onClick={() => setOpen(false)} className="py-1.5 text-sm text-muted transition-colors hover:text-ink">
              {t}
            </Link>
          ))}
          {!isAuthed && (
            <Link to="/login" onClick={() => setOpen(false)} className="py-1.5 text-sm text-muted transition-colors hover:text-ink">
              Sign in
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}

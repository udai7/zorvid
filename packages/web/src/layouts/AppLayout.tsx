import { useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { useAuth } from "../auth";
import { useVideos } from "../hooks/useVideos";
import { Brand } from "../components/Navbar";
import { cn } from "../lib/ui";
import type { Video } from "../types";

interface AppContext {
  videos: Video[];
  error: string | null;
  refresh: () => void;
}

/** Shared video state for the authenticated app, provided by AppLayout. */
export function useApp(): AppContext {
  return useOutletContext<AppContext>();
}

const NAV = [
  ["Library", "/dashboard"],
  ["Upload", "/upload"],
] as const;

export function AppLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { videos, error, refresh } = useVideos(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <header className="sticky top-0 z-30 border-b border-line bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-[60px] max-w-[1280px] items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-8">
            <Brand />
            <nav className="hidden gap-1 md:flex">
              {NAV.map(([label, to]) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      "rounded-md px-3 py-1.5 text-sm transition-colors",
                      isActive ? "bg-sunken font-medium text-ink" : "text-muted hover:text-ink",
                    )
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
            </svg>
            Log out
          </button>
        </div>
        {/* Mobile section nav */}
        <nav className="flex gap-1 border-t border-line px-4 py-2 md:hidden">
          {NAV.map(([label, to]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors",
                  isActive ? "bg-sunken font-medium text-ink" : "text-muted hover:text-ink",
                )
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-6 pb-16">
        <Outlet context={{ videos, error, refresh } satisfies AppContext} />
      </main>
    </div>
  );
}

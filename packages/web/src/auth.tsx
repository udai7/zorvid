import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getToken, setToken } from "./api";

interface AuthValue {
  token: string | null;
  isAuthed: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTok] = useState<string | null>(getToken());

  function login(t: string) {
    setToken(t);
    setTok(t);
  }

  function logout() {
    setToken(null);
    setTok(null);
  }

  // api.ts clears the token on any 401; mirror that into context state so
  // guarded routes redirect to /login without a manual refresh.
  useEffect(() => {
    const onExpired = () => setTok(null);
    window.addEventListener("vp:auth-expired", onExpired);
    return () => window.removeEventListener("vp:auth-expired", onExpired);
  }, []);

  return (
    <AuthContext.Provider value={{ token, isAuthed: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

/** Route guard: renders nested routes only when authenticated. */
export function RequireAuth() {
  const { isAuthed } = useAuth();
  const location = useLocation();
  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <Outlet />;
}

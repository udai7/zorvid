import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

export function MarketingLayout() {
  const { pathname } = useLocation();

  // Reset scroll on route change so deep-linked content pages start at the top.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <Navbar />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}

import { Routes, Route } from "react-router-dom";
import { RequireAuth } from "./auth";
import { MarketingLayout } from "./layouts/MarketingLayout";
import { AppLayout } from "./layouts/AppLayout";
import { Landing } from "./components/Landing";
import { Login } from "./components/Login";
import { Register } from "./pages/Register";
import { Features } from "./pages/Features";
import { HowItWorks } from "./pages/HowItWorks";
import { Docs } from "./pages/Docs";
import { Privacy, Terms } from "./pages/Legal";
import { NotFound } from "./pages/NotFound";
import { Dashboard } from "./pages/Dashboard";
import { Upload } from "./pages/Upload";
import { Watch } from "./pages/Watch";
import { Embed } from "./pages/Embed";

export function App() {
  return (
    <Routes>
      {/* Public marketing site */}
      <Route element={<MarketingLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/features" element={<Features />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
      </Route>

      {/* Auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Public, chrome-less player for shared/embedded videos */}
      <Route path="/embed/:id" element={<Embed />} />

      {/* Authenticated app */}
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/watch/:id" element={<Watch />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

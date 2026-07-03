import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { Eyebrow } from "../components/Page";
import { btn } from "../lib/ui";

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <Navbar />
      <main className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col items-center justify-center border-x border-line px-6 py-24 text-center">
        <Eyebrow left="ERROR" right="404" />
        <h1 className="mt-5 text-[clamp(3rem,12vw,7rem)] font-[650] leading-none tracking-[-0.03em]">404</h1>
        <p className="mt-4 max-w-[40ch] text-[1.05rem] text-muted">
          That page wandered off the pipeline. The link may be broken or the page may have moved.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/" className={btn.primary}>Back home</Link>
          <Link to="/dashboard" className={btn.secondary}>Go to dashboard</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

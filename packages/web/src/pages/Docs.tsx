import { Link } from "react-router-dom";
import { PageHero, PageShell, Eyebrow } from "../components/Page";
import { btn } from "../lib/ui";
import { REPO } from "../constants";

const QUICKSTART = [
  ["Clone the repo", "git clone " + REPO],
  ["Configure env", "cp .env.example .env  # set DB, Redis, S3 + JWT secrets"],
  ["Start the stack", "docker compose up --build"],
  ["Open the dashboard", "visit http://localhost — register, then upload a video"],
];

const LINKS = [
  ["Architecture", "How the API, workers, queue and storage fit together.", `${REPO}/blob/main/docs/architecture.md`],
  ["Deployment", "Running the stack with Docker Compose and nginx in production.", `${REPO}/blob/main/docs`],
  ["Configuration", "Environment variables, the FFmpeg ladder and storage backends.", `${REPO}/blob/main/README.md`],
  ["Source code", "Browse the API, worker and web packages on GitHub.", REPO],
];

export function Docs() {
  return (
    <PageShell>
      <PageHero
        eyebrowLeft="DEVELOPER"
        eyebrowRight="DOCS"
        title="Get Vodeum running in minutes."
        intro="Everything is configured through environment variables and one Docker Compose file. The full reference lives in the repository — here is the short path."
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={REPO} target="_blank" rel="noreferrer" className={btn.primary}>Open the repository →</a>
          <Link to="/how-it-works" className={btn.secondary}>How it works</Link>
        </div>
      </PageHero>

      <section className="border-b border-line px-6 py-14">
        <Eyebrow left="QUICK" right="START" />
        <ol className="mt-6 flex flex-col gap-3">
          {QUICKSTART.map(([title, cmd], i) => (
            <li key={title} className="rounded-[10px] border border-line bg-white p-4">
              <div className="flex items-center gap-2">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-ink font-mono text-[0.65rem] text-white">{i + 1}</span>
                <span className="text-[0.95rem] font-semibold text-ink">{title}</span>
              </div>
              <pre className="mt-2 overflow-x-auto rounded-md bg-sunken px-3 py-2 font-mono text-[0.8rem] text-ink-2">{cmd}</pre>
            </li>
          ))}
        </ol>
      </section>

      <section className="px-6 py-14">
        <Eyebrow left="REFERENCE" right="GUIDES" />
        <div className="mt-6 grid gap-px overflow-hidden rounded-[10px] border border-line bg-line sm:grid-cols-2">
          {LINKS.map(([title, body, href]) => (
            <a key={title} href={href} target="_blank" rel="noreferrer" className="group bg-white p-6 transition-colors hover:bg-sunken">
              <h3 className="flex items-center gap-1.5 text-[0.98rem] font-semibold text-ink">
                {title}
                <span className="text-muted transition-transform group-hover:translate-x-0.5">→</span>
              </h3>
              <p className="mt-2 text-[0.92rem] leading-relaxed text-muted">{body}</p>
            </a>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

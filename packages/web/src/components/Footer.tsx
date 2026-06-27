import { Link } from "react-router-dom";
import { Brand } from "./Navbar";
import { REPO } from "../constants";

type FooterLink = [label: string, href: string];

const COLS: Array<{ title: string; links: FooterLink[] }> = [
  {
    title: "Product",
    links: [
      ["Features", "/features"],
      ["How it works", "/how-it-works"],
      ["Upload", "/upload"],
    ],
  },
  {
    title: "Resources",
    links: [
      ["Documentation", "/docs"],
      ["Architecture", `${REPO}/blob/main/docs/architecture.md`],
      ["GitHub", REPO],
    ],
  },
  {
    title: "Legal",
    links: [
      ["Privacy", "/privacy"],
      ["Terms", "/terms"],
      ["Issues", `${REPO}/issues`],
    ],
  },
];

function FootLink({ label, href }: { label: string; href: string }) {
  const external = href.startsWith("http");
  const className = "text-sm text-ink-2 transition-colors hover:text-ink";
  return external ? (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {label}
    </a>
  ) : (
    <Link to={href} className={className}>
      {label}
    </Link>
  );
}

export function Footer() {
  return (
    <>
      <footer className="mx-auto w-full max-w-[1280px] border-x border-line px-6 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Brand />
            <p className="mt-3 max-w-[26ch] text-sm text-muted">
              An open-source, self-hosted video-on-demand platform.
            </p>
          </div>
          {COLS.map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">{col.title}</h4>
              <ul className="flex flex-col gap-2.5">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <FootLink label={label} href={href} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </footer>
      <div className="mx-auto flex w-full max-w-[1280px] flex-wrap justify-between gap-2 border-x border-t border-line px-6 py-5 text-[0.82rem] text-muted">
        <span>© {new Date().getFullYear()} Vodeum. MIT Licensed.</span>
        <span>Built by Archilect Studios</span>
      </div>
    </>
  );
}

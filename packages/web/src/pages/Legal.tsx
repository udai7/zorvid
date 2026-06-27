import { PageHero, PageShell } from "../components/Page";

interface Section {
  heading: string;
  body: string;
}

function LegalPage({
  eyebrowLeft,
  title,
  intro,
  updated,
  sections,
}: {
  eyebrowLeft: string;
  title: string;
  intro: string;
  updated: string;
  sections: Section[];
}) {
  return (
    <PageShell>
      <PageHero eyebrowLeft={eyebrowLeft} eyebrowRight="POLICY" title={title} intro={intro}>
        <p className="mt-4 font-mono text-xs uppercase tracking-[0.08em] text-muted">Last updated · {updated}</p>
      </PageHero>

      <section className="px-6 py-14">
        <div className="mx-auto max-w-[70ch] flex flex-col gap-8">
          {sections.map((s, i) => (
            <div key={s.heading}>
              <h2 className="text-[1.15rem] font-semibold text-ink">
                <span className="mr-2 font-mono text-sm text-muted">{String(i + 1).padStart(2, "0")}</span>
                {s.heading}
              </h2>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{s.body}</p>
            </div>
          ))}
          <p className="border-t border-line pt-6 text-[0.85rem] text-muted">
            Vodeum is open-source software provided under the MIT license. When you self-host it, you are the data
            controller for everything it stores. This document describes the reference deployment and is provided as a
            starting point — adapt it to your own jurisdiction and obligations.
          </p>
        </div>
      </section>
    </PageShell>
  );
}

export function Privacy() {
  return (
    <LegalPage
      eyebrowLeft="PRIVACY"
      title="Your data stays yours."
      intro="Vodeum is self-hosted, so your videos, accounts and logs live entirely on infrastructure you control. We never see them."
      updated="June 2026"
      sections={[
        {
          heading: "What is stored",
          body: "A Vodeum instance stores the account details you provide (such as your email and credentials), the videos you upload, the renditions generated from them, and processing logs needed to run the pipeline. Passwords are hashed with Argon2 and never stored in plain text.",
        },
        {
          heading: "Where it is stored",
          body: "Account and video records are kept in your PostgreSQL database; source files and HLS output live in your S3-compatible object storage. Both are operated by whoever runs the instance — by default, that is you.",
        },
        {
          heading: "Who can access it",
          body: "Videos are private by default and delivered through short-lived, token-authorized streams. A video is only reachable publicly once you explicitly mark it public. Operators of the instance have administrative access to the underlying database and storage.",
        },
        {
          heading: "Third parties",
          body: "The reference deployment talks only to the services you configure — your database, Redis queue and object storage. If you connect optional providers (for example Gmail SMTP for verification emails or Google for sign-in), their respective privacy policies apply to that data.",
        },
        {
          heading: "Your choices",
          body: "You can delete any video at any time, which removes its records and stored output. Because you control the deployment, you can also export or purge the entire dataset directly from your database and storage.",
        },
      ]}
    />
  );
}

export function Terms() {
  return (
    <LegalPage
      eyebrowLeft="TERMS"
      title="Terms of service."
      intro="These terms cover use of the Vodeum reference deployment. The software itself is licensed separately under the MIT license."
      updated="June 2026"
      sections={[
        {
          heading: "Acceptable use",
          body: "Use Vodeum to process and stream content you own or are authorized to distribute. Do not use an instance to host unlawful material or to infringe the rights of others. Operators may set additional rules for their own deployments.",
        },
        {
          heading: "Accounts",
          body: "You are responsible for safeguarding your credentials and for activity under your account. Notify the operator of any unauthorized use. Operators may suspend accounts that violate these terms.",
        },
        {
          heading: "Content ownership",
          body: "You retain all rights to the videos you upload. Granting an instance the ability to transcode, store and stream your content does not transfer ownership of it.",
        },
        {
          heading: "Availability",
          body: "The software is provided 'as is', without warranty of any kind. Uptime, performance and durability depend on the infrastructure each operator chooses to run it on.",
        },
        {
          heading: "Liability",
          body: "To the fullest extent permitted by law, the authors and operators are not liable for any indirect or consequential damages arising from use of the software. See the MIT license for the full disclaimer.",
        },
      ]}
    />
  );
}

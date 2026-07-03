import { Link, useNavigate } from "react-router-dom";
import { Dropzone } from "../components/Dropzone";
import { useApp } from "../layouts/AppLayout";
import { Eyebrow } from "../components/Page";

const STEPS = [
  ["Pick a file", "Drop in any common video (MP4, MOV, MKV, WebM). It streams straight to object storage."],
  ["We transcode", "Workers build a 1080p / 720p / 480p HLS ladder and a poster thumbnail in the background."],
  ["Stream it", "Watch adaptively in the player, keep it private, or flip it public when you're ready."],
];

export function Upload() {
  const { refresh } = useApp();
  const navigate = useNavigate();

  return (
    <>
      <div className="mb-8 grid gap-6 border-b border-line py-12 md:grid-cols-2 md:items-end">
        <div>
          <Eyebrow left="NEW" right="UPLOAD" />
          <h1 className="mt-3 text-[clamp(1.8rem,4vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-ink">
            Upload a video
          </h1>
        </div>
        <p className="text-[0.98rem] text-muted md:max-w-[42ch] md:text-right">
          Your file is processed asynchronously — you can leave this page once the upload completes and track progress in your library.
        </p>
      </div>

      <Dropzone
        onUploaded={() => {
          refresh();
          navigate("/dashboard");
        }}
      />

      <div className="mt-10">
        <Eyebrow left="HOW" right="IT WORKS" />
        <ol className="mt-5 grid gap-px overflow-hidden rounded-[10px] border border-line bg-line sm:grid-cols-3">
          {STEPS.map(([title, body], i) => (
            <li key={title} className="bg-white p-5">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-ink font-mono text-[0.7rem] text-white">{i + 1}</span>
              <h3 className="mt-3 text-[0.95rem] font-semibold text-ink">{title}</h3>
              <p className="mt-1.5 text-[0.9rem] leading-relaxed text-muted">{body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-sm text-muted">
          Prefer to manage existing videos?{" "}
          <Link to="/dashboard" className="font-medium text-ink hover:underline">
            Go to your library →
          </Link>
        </p>
      </div>
    </>
  );
}

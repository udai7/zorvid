import { useRef, useState } from "react";
import { api } from "../api";
import { cn } from "../lib/ui";

export function Dropzone({ onUploaded }: { onUploaded: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragover, setDragover] = useState(false);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    setUploadPct(0);
    try {
      await api.uploadVideo(file, setUploadPct);
      onUploaded();
    } catch (e) {
      setError(e instanceof Error ? e.message : "upload failed");
    } finally {
      setUploadPct(null);
    }
  }

  return (
    <div
      className={cn(
        "cursor-pointer rounded-[10px] border-[1.5px] border-dashed bg-subtle px-4 py-10 text-center text-muted transition-colors hover:border-brand",
        dragover ? "border-brand bg-brand-soft text-ink" : "border-line-strong",
      )}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragover(true);
      }}
      onDragLeave={() => setDragover(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragover(false);
        const file = e.dataTransfer.files[0];
        if (file) upload(file);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        hidden
        onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
      />
      {uploadPct === null ? (
        <p>📤 Drag &amp; drop a video here, or click to choose a file.</p>
      ) : (
        <div className="mx-auto max-w-[360px]">
          <p className="mb-2">Uploading… {uploadPct}%</p>
          <div className="h-2 overflow-hidden rounded-full bg-sunken">
            <span className="block h-full rounded-full bg-brand transition-[width] duration-300" style={{ width: `${uploadPct}%` }} />
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-err">{error}</p>}
    </div>
  );
}

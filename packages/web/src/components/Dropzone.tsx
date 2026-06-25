import { useRef, useState } from "react";
import { api } from "../api";

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
      className={`dropzone${dragover ? " dragover" : ""}`}
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
        <div className="upload-progress">
          <p>Uploading… {uploadPct}%</p>
          <div className="progress">
            <span style={{ width: `${uploadPct}%` }} />
          </div>
        </div>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

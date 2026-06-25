// Mirrors the API's response shapes (see packages/shared). Kept local so the
// web bundle has no node-oriented workspace dependency.

export type VideoStatus =
  | "pending"
  | "analyzing"
  | "transcoding"
  | "thumbnails"
  | "packaging"
  | "completed"
  | "failed";

export type Visibility = "private" | "public";

export interface VideoMetadata {
  width?: number;
  height?: number;
  duration?: number;
  videoCodec?: string;
  audioCodec?: string;
  bitrate?: number;
}

/** A row from GET /api/videos (list) — also the base of the detail view. */
export interface Video {
  id: string;
  title: string;
  original_filename: string;
  status: VideoStatus;
  visibility: Visibility;
  metadata: VideoMetadata | null;
  master_playlist_key: string | null;
  created_at: string;
  // present on GET /api/videos/:id (joined job)
  progress?: number;
  stage?: string | null;
  error_message?: string | null;
}

export interface AuthResponse {
  token: string;
  user: { id: string; email: string };
}

export interface StreamInfo {
  visibility: Visibility;
  url: string;
  token?: string;
  expiresIn?: number;
}

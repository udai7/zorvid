// Shared types/enums used by both the API and the worker.
// Mirrors the data model in architecture.md §6.

/** Lifecycle of a video as it moves through the pipeline. */
export type VideoStatus =
  | "pending"
  | "analyzing"
  | "transcoding"
  | "thumbnails"
  | "packaging"
  | "completed"
  | "failed";

/** Who can watch a video. */
export type Visibility = "private" | "public";

/** The FFmpeg processing stage a job is currently in. */
export type JobStage =
  | "analyze"
  | "transcode"
  | "thumbnails"
  | "package"
  | "finalize";

/** Probed source-media facts, stored on videos.metadata (jsonb). */
export interface VideoMetadata {
  width?: number;
  height?: number;
  duration?: number; // seconds
  videoCodec?: string;
  audioCodec?: string;
  bitrate?: number; // bits per second
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  createdAt: string;
}

export interface Video {
  id: string;
  userId: string;
  title: string;
  originalFilename: string;
  status: VideoStatus;
  visibility: Visibility;
  metadata: VideoMetadata | null;
  masterPlaylistKey: string | null;
  createdAt: string;
}

export interface Job {
  id: string;
  videoId: string;
  progress: number; // 0-100
  stage: JobStage | null;
  logs: string; // append-only FFmpeg output
  errorMessage: string | null;
  attempts: number;
  updatedAt: string;
}

/** Payload enqueued onto BullMQ for the worker to consume. */
export interface TranscodeJobData {
  videoId: string;
}

/** Name of the BullMQ queue shared by API (producer) and worker (consumer). */
export const TRANSCODE_QUEUE = "transcode";

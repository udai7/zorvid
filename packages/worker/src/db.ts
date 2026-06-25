import { Pool } from "pg";
import type { JobStage, VideoStatus, VideoMetadata } from "@vp/shared";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function getVideo(id: string): Promise<{ original_filename: string } | undefined> {
  const { rows } = await pool.query<{ original_filename: string }>(
    "SELECT original_filename FROM videos WHERE id = $1",
    [id]
  );
  return rows[0];
}

export async function setStatus(videoId: string, status: VideoStatus): Promise<void> {
  await pool.query("UPDATE videos SET status = $2 WHERE id = $1", [videoId, status]);
}

export async function setMetadata(videoId: string, metadata: VideoMetadata): Promise<void> {
  await pool.query("UPDATE videos SET metadata = $2::jsonb WHERE id = $1", [
    videoId,
    JSON.stringify(metadata),
  ]);
}

export async function setMasterKey(videoId: string, key: string): Promise<void> {
  await pool.query("UPDATE videos SET master_playlist_key = $2 WHERE id = $1", [videoId, key]);
}

/** Update the job's progress and/or current stage. */
export async function updateJob(
  videoId: string,
  fields: { progress?: number; stage?: JobStage }
): Promise<void> {
  await pool.query(
    `UPDATE jobs
       SET progress = COALESCE($2, progress),
           stage = COALESCE($3, stage),
           updated_at = now()
     WHERE video_id = $1`,
    [videoId, fields.progress ?? null, fields.stage ?? null]
  );
}

/** Append to the job's running log. */
export async function appendLog(videoId: string, text: string): Promise<void> {
  await pool.query(
    "UPDATE jobs SET logs = logs || $2, updated_at = now() WHERE video_id = $1",
    [videoId, text]
  );
}

/** Record a failure: persist the error message and append it to the logs. */
export async function setError(videoId: string, message: string): Promise<void> {
  await pool.query(
    `UPDATE jobs
       SET error_message = $2,
           logs = logs || $3,
           attempts = attempts + 1,
           updated_at = now()
     WHERE video_id = $1`,
    [videoId, message, `\n[error] ${message}\n`]
  );
}

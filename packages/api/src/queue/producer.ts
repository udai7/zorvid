import { Queue } from "bullmq";
import { TRANSCODE_QUEUE, type TranscodeJobData } from "@vp/shared";

const url = new URL(process.env.REDIS_URL ?? "redis://localhost:6379");
const connection = { host: url.hostname, port: Number(url.port) || 6379 };

export const transcodeQueue = new Queue<TranscodeJobData>(TRANSCODE_QUEUE, { connection });

/** Enqueue a transcode job. Retries with exponential backoff are handled by BullMQ. */
export async function enqueueTranscode(videoId: string): Promise<void> {
  await transcodeQueue.add(
    "transcode",
    { videoId },
    {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );
}

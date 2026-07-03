import { Worker } from "bullmq";
import { TRANSCODE_QUEUE, type TranscodeJobData } from "@vp/shared";
import { processVideo } from "./pipeline.js";
import { startMaintenance } from "./maintenance.js";

const url = new URL(process.env.REDIS_URL ?? "redis://localhost:6379");
const connection = {
  host: url.hostname,
  port: Number(url.port) || 6379,
  maxRetriesPerRequest: null, // required by BullMQ workers
};
const concurrency = Number(process.env.WORKER_CONCURRENCY ?? 2);

const worker = new Worker<TranscodeJobData>(
  TRANSCODE_QUEUE,
  async (job) => {
    await processVideo(job.data.videoId);
  },
  { connection, concurrency }
);

worker.on("completed", (job) => console.log(`completed ${job.data.videoId}`));
worker.on("failed", (job, err) => console.error(`failed ${job?.data.videoId}: ${err.message}`));

startMaintenance(); // periodic retention sweep (auto-delete old videos)

console.log(`worker up — queue=${TRANSCODE_QUEUE} concurrency=${concurrency}`);

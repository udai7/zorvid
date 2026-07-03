import { expiredVideoIds, deleteVideoRow } from "./db.js";
import { BUCKETS, deletePrefix } from "./storage.js";

const RETENTION_DAYS = Number(process.env.VIDEO_RETENTION_DAYS ?? 2);
const INTERVAL_MS = Number(process.env.MAINTENANCE_INTERVAL_MS ?? 3_600_000); // 1h

/** Delete videos past the retention window: storage objects first, then rows. */
async function reapExpiredVideos(): Promise<void> {
  const ids = await expiredVideoIds(RETENTION_DAYS);
  for (const id of ids) {
    await Promise.all([
      deletePrefix(BUCKETS.inputs, `${id}/`),
      deletePrefix(BUCKETS.outputs, `${id}/`),
      deletePrefix(BUCKETS.thumbs, `${id}/`),
    ]);
    await deleteVideoRow(id);
  }
  if (ids.length) console.log(`maintenance: deleted ${ids.length} expired video(s)`);
}

/** Start the periodic maintenance loop; runs once immediately, then on interval. */
export function startMaintenance(): void {
  const run = () => reapExpiredVideos().catch((err) => console.error("maintenance failed:", err));
  run();
  const timer = setInterval(run, INTERVAL_MS);
  timer.unref(); // don't keep the process alive just for maintenance
  console.log(`maintenance up — retention=${RETENTION_DAYS}d interval=${INTERVAL_MS}ms`);
}

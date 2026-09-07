import { Worker, Job } from "bullmq";
import { getRedisConnection } from "../queues";
import { syncUserSource, syncAllActiveSourcesForUser } from "@/services/transactions/pipeline";
import { appendTransactionsToSheet } from "@/services/sheets/syncer";

export function initWorkers() {
  const connection = getRedisConnection();

  // 1. Mail Sync Worker
  const mailSyncWorker = new Worker(
    "mail-sync",
    async (job: Job) => {
      const { userId, sourceSlug, daysBack } = job.data;
      console.log(`[Worker:mail-sync] Processing job ${job.id} for user ${userId}`);

      if (sourceSlug) {
        return await syncUserSource(userId, sourceSlug, daysBack || 7);
      } else {
        return await syncAllActiveSourcesForUser(userId, daysBack || 7);
      }
    },
    { connection, concurrency: 5 }
  );

  // 2. Sheets Write Worker
  const sheetsWriteWorker = new Worker(
    "sheets-write",
    async (job: Job) => {
      const { userId, transactionIds } = job.data;
      console.log(`[Worker:sheets-write] Writing ${transactionIds?.length} transactions to sheets for user ${userId}`);
      return await appendTransactionsToSheet(userId, transactionIds);
    },
    { connection, concurrency: 3 }
  );

  mailSyncWorker.on("completed", (job) => {
    console.log(`[Worker:mail-sync] Job ${job.id} completed successfully.`);
  });

  mailSyncWorker.on("failed", (job, err) => {
    console.error(`[Worker:mail-sync] Job ${job?.id} failed:`, err);
  });

  sheetsWriteWorker.on("completed", (job) => {
    console.log(`[Worker:sheets-write] Job ${job.id} completed successfully.`);
  });

  sheetsWriteWorker.on("failed", (job, err) => {
    console.error(`[Worker:sheets-write] Job ${job?.id} failed:`, err);
  });

  return { mailSyncWorker, sheetsWriteWorker };
}

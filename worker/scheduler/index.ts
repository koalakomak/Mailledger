import { prisma } from "@/lib/db/prisma";
import { mailSyncQueue } from "../queues";

export async function schedulePeriodicSync() {
  console.log("[Scheduler] Checking active users with enabled sources...");

  const activeUsers = await prisma.user.findMany({
    where: {
      userSources: {
        some: {
          isActive: true,
        },
      },
    },
    select: {
      id: true,
      email: true,
    },
  });

  console.log(`[Scheduler] Found ${activeUsers.length} active users to sync.`);

  for (const user of activeUsers) {
    try {
      await mailSyncQueue.add(
        "sync-user",
        { userId: user.id, daysBack: 1 },
        {
          jobId: `sync-${user.id}-${Date.now()}`,
          removeOnComplete: true,
        }
      );
      console.log(`[Scheduler] Enqueued sync job for user ${user.email} (${user.id})`);
    } catch (err: any) {
      console.error(`[Scheduler] Failed to enqueue sync for user ${user.id}:`, err.message);
    }
  }
}

// If run directly, run scheduler loop every 10 minutes
export function startSchedulerLoop(intervalMinutes = 10) {
  console.log(`[Scheduler] Starting loop with interval of ${intervalMinutes} minutes.`);
  schedulePeriodicSync();

  setInterval(() => {
    schedulePeriodicSync().catch(console.error);
  }, intervalMinutes * 60 * 1000);
}

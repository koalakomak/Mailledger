import dotenv from "dotenv";
dotenv.config();

import { initWorkers } from "./processors";
import { startSchedulerLoop } from "./scheduler";

console.log("==========================================");
console.log("🚀 Starting MailLedger Background Worker");
console.log("==========================================");

initWorkers();
startSchedulerLoop(10); // 10 minutes interval

console.log("✅ Worker and Scheduler are active and listening for jobs.");

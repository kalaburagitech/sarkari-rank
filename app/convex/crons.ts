import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Pull fresh current affairs from Google News RSS every day.
// 01:30 UTC ≈ 07:00 IST — morning refresh for aspirants.
crons.daily(
  "daily current affairs",
  { hourUTC: 1, minuteUTC: 30 },
  internal.news.fetchCurrentAffairs
);

export default crons;

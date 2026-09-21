// Local-first test attempts.
//
// A test runs entirely on the device: the question set (with its answer key)
// is already cached, so answers are recorded, graded and shown offline. The
// finished attempt is written to AsyncStorage first and pushed to Convex as a
// single mutation when there is a connection — one write per attempt instead
// of one per option tap.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../convex/_generated/api";
import { http } from "./offline";
import { LocalAnswer } from "./grade";

export { grade } from "./grade";

const QUEUE_KEY = "attempts:queue";
const LOCAL_PREFIX = "attempt:";

export type LocalAttempt = {
  id: string;
  userId: string;
  testId: string;
  testTitle: string;
  answers: LocalAnswer[];
  score: number;
  totalMarks: number;
  accuracy: number;
  timeTakenSeconds: number;
  startedAt: number;
  completedAt: number;
  synced: boolean;
};

export async function saveAttempt(attempt: LocalAttempt) {
  await AsyncStorage.setItem(LOCAL_PREFIX + attempt.id, JSON.stringify(attempt));
  const queue = await readQueue();
  if (!queue.includes(attempt.id)) {
    queue.push(attempt.id);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }
}

export async function getAttempt(id: string): Promise<LocalAttempt | null> {
  const raw = await AsyncStorage.getItem(LOCAL_PREFIX + id);
  return raw ? (JSON.parse(raw) as LocalAttempt) : null;
}

async function readQueue(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? (JSON.parse(raw) as string[]) : [];
}

/**
 * Push every unsynced attempt. Safe to call on app start and after a test —
 * anything that fails simply stays queued for the next try.
 */
export async function flushAttempts() {
  const queue = await readQueue();
  if (queue.length === 0) return { sent: 0, pending: 0 };

  const stillPending: string[] = [];
  let sent = 0;
  for (const id of queue) {
    const attempt = await getAttempt(id);
    if (!attempt) continue;
    try {
      await http.mutation(api.attempts.recordAttempt, {
        userId: attempt.userId as never,
        testId: attempt.testId as never,
        startedAt: attempt.startedAt,
        timeTakenSeconds: attempt.timeTakenSeconds,
        answers: attempt.answers.map((a) => ({
          questionId: a.questionId as never,
          selectedOptionId: a.selectedOptionId,
          timeSpentSeconds: a.timeSpentSeconds,
        })),
      });
      await AsyncStorage.setItem(
        LOCAL_PREFIX + id,
        JSON.stringify({ ...attempt, synced: true })
      );
      sent++;
    } catch {
      stillPending.push(id);
    }
  }
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(stillPending));
  return { sent, pending: stillPending.length };
}

export async function pendingCount() {
  return (await readQueue()).length;
}

/** Attempts taken on this device, newest first — the offline history list. */
export async function localHistory(): Promise<LocalAttempt[]> {
  const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(LOCAL_PREFIX));
  const rows = await AsyncStorage.multiGet(keys);
  return rows
    .map(([, v]) => (v ? (JSON.parse(v) as LocalAttempt) : null))
    .filter((a): a is LocalAttempt => !!a)
    .sort((a, b) => b.completedAt - a.completedAt);
}

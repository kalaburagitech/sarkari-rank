// On-device content cache.
//
// Every content read goes through `useCached`. The app holds the last payload
// in AsyncStorage and asks the server for one tiny document — the sync
// counters — at most once a minute. A screen only re-downloads its data when
// the counter for its content area actually moved, so a day with no new
// content costs zero database reads and the app works with no network at all.
//
// Reads use ConvexHttpClient (one-shot HTTP) rather than the reactive
// websocket client on purpose: a live subscription re-sends the whole result
// set to every connected device on every write, which is what made a bulk
// question import cost gigabytes.
import { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ConvexHttpClient } from "convex/browser";
import { FunctionReference } from "convex/server";
import Constants from "expo-constants";
import { api } from "../convex/_generated/api";

const convexUrl =
  process.env.EXPO_PUBLIC_CONVEX_URL ??
  (Constants.expoConfig?.extra?.convexUrl as string) ??
  "https://silent-jackal-490.convex.cloud";

export const http = new ConvexHttpClient(convexUrl);

export type SyncKey =
  | "categories"
  | "exams"
  | "tests"
  | "studyNotes"
  | "currentAffairs"
  | "notifications"
  | "practice"
  | "doubts"
  | "dailyQuiz";

import { Entry, Versions, isFresh } from "./cachePolicy";
export type { Entry, Versions };

const KEY = (name: string) => `cache:${name}`;
const VERSIONS_KEY = "cache:__versions";
const VERSION_TTL_MS = 60_000;

// In-memory mirror so several screens mounting at once hit AsyncStorage once.
const mem = new Map<string, Entry>();
let versions: Versions = {};
let versionsAt = 0;
let inflight: Promise<Versions> | null = null;
let online = true;

export function isOnline() {
  return online;
}

async function readEntry(name: string): Promise<Entry | null> {
  const cached = mem.get(name);
  if (cached) return cached;
  try {
    const raw = await AsyncStorage.getItem(KEY(name));
    if (!raw) return null;
    const entry = JSON.parse(raw) as Entry;
    mem.set(name, entry);
    return entry;
  } catch {
    return null;
  }
}

async function writeEntry(name: string, entry: Entry) {
  mem.set(name, entry);
  try {
    await AsyncStorage.setItem(KEY(name), JSON.stringify(entry));
  } catch {
    // A full disk must not break the session — the in-memory copy still serves.
  }
}

/** Current sync counters. One tiny query per minute, cached across screens. */
export async function getVersions(force = false): Promise<Versions> {
  const now = Date.now();
  if (!force && versionsAt && now - versionsAt < VERSION_TTL_MS) return versions;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const fresh = (await http.query(api.sync.versions, {})) as Versions;
      versions = fresh;
      versionsAt = Date.now();
      online = true;
      await AsyncStorage.setItem(VERSIONS_KEY, JSON.stringify(fresh));
    } catch {
      // Offline, or the backend is unavailable (quota, outage). Fall back to
      // whatever the device already knows so every screen still renders.
      online = false;
      if (!versionsAt) {
        const raw = await AsyncStorage.getItem(VERSIONS_KEY);
        if (raw) versions = JSON.parse(raw) as Versions;
      }
    } finally {
      inflight = null;
    }
    return versions;
  })();
  return inflight;
}

/**
 * Fetch-through cache for one query. Returns the cached value immediately and
 * refreshes only when a dependency counter moved (or nothing is cached yet).
 */
export async function cachedQuery<T>(
  name: string,
  ref: FunctionReference<"query">,
  args: Record<string, unknown>,
  deps: SyncKey[]
): Promise<T | undefined> {
  const entry = await readEntry(name);
  const current = await getVersions();

  // isFresh decides whether this costs a database read at all.
  if (entry && isFresh(entry, deps, current, Date.now())) return entry.data as T;
  if (!online) return entry ? (entry.data as T) : undefined;

  try {
    const data = (await http.query(ref, args)) as T;
    const snapshot: Versions = {};
    for (const d of deps) snapshot[d] = current[d] ?? 0;
    await writeEntry(name, { deps: snapshot, data, at: Date.now() });
    return data;
  } catch {
    online = false;
    return entry ? (entry.data as T) : undefined;
  }
}

/**
 * Screen-level hook. `name` must be unique per query+args combination — it is
 * the cache key on disk.
 */
export function useCached<T>(
  name: string,
  ref: FunctionReference<"query">,
  args: Record<string, unknown> | "skip",
  deps: SyncKey[]
): T | undefined {
  const [data, setData] = useState<T | undefined>(
    () => (mem.get(name)?.data as T) ?? undefined
  );
  const alive = useRef(true);
  const argsKey = args === "skip" ? "skip" : JSON.stringify(args);

  useEffect(() => {
    alive.current = true;
    if (args === "skip") return;
    let cancelled = false;
    (async () => {
      // Paint from cache first, then revalidate if a counter moved.
      const entry = await readEntry(name);
      if (entry && !cancelled) setData(entry.data as T);
      const fresh = await cachedQuery<T>(name, ref, JSON.parse(argsKey), deps);
      if (!cancelled && fresh !== undefined) setData(fresh);
    })();
    return () => {
      cancelled = true;
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, argsKey]);

  return data;
}

/** Drop everything cached — used by "clear offline data" in settings. */
export async function clearCache() {
  mem.clear();
  versionsAt = 0;
  const keys = await AsyncStorage.getAllKeys();
  await AsyncStorage.multiRemove(keys.filter((k) => k.startsWith("cache:")));
}

export async function cacheSize() {
  const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith("cache:"));
  const rows = await AsyncStorage.multiGet(keys);
  return rows.reduce((n, [, v]) => n + (v?.length ?? 0), 0);
}

/** Force the next `getVersions()` to hit the network (app foreground, pull-to-refresh). */
export function invalidateVersions() {
  versionsAt = 0;
}

// ─── Question sets ───────────────────────────────────────────
// Keyed by the test's own `qv` counter, which rides along in the cached tests
// payload. Same qv → the device already has the right questions and asks for
// nothing; a re-published test bumps qv and only that test re-downloads.
type QEntry = { qv: number; data: unknown };

export async function getQuestions<T>(testId: string, qv: number): Promise<T | undefined> {
  const name = `questions:${testId}`;
  const cached = mem.get(name) as unknown as QEntry | undefined;
  let entry = cached;
  if (!entry) {
    try {
      const raw = await AsyncStorage.getItem(KEY(name));
      if (raw) entry = JSON.parse(raw) as QEntry;
    } catch {
      entry = undefined;
    }
  }
  if (entry && entry.qv === qv) return entry.data as T;

  try {
    // Answers come down with the questions: the test is graded on the device
    // so an attempt can be taken and scored with no connectivity at all.
    const data = (await http.query(api.exams.listQuestions, {
      testId: testId as never,
      includeAnswers: true,
    })) as T;
    const fresh: QEntry = { qv, data };
    mem.set(name, fresh as never);
    await AsyncStorage.setItem(KEY(name), JSON.stringify(fresh));
    return data;
  } catch {
    online = false;
    return entry ? (entry.data as T) : undefined;
  }
}

// ─── First-run warm-up ───────────────────────────────────────
// Pulls the whole student-facing catalogue once, then every test's questions,
// so the app is usable with no connection. Everything here is a no-op on later
// launches while the sync counters stand still.
export async function prefetchAll(onProgress?: (done: number, total: number) => void) {
  await getVersions(true);
  if (!online) return;

  await cachedQuery("categories", api.exams.listCategories, {}, ["categories"]);
  await cachedQuery("exams", api.exams.listExams, {}, ["exams"]);
  await cachedQuery("studyNotes", api.content.listStudyNotes, {}, ["studyNotes"]);
  await cachedQuery("affairs:latest", api.content.listCurrentAffairs, { limit: 60 }, ["currentAffairs"]);
  await cachedQuery("practiceTree", api.practiceBank.getPracticeTree, {}, ["practice"]);
  const tests = await cachedQuery<{ _id: string; qv?: number }[]>(
    "tests",
    api.exams.listTests,
    {},
    ["tests"]
  );

  const list = tests ?? [];
  for (let i = 0; i < list.length; i++) {
    if (!online) break;
    await getQuestions(list[i]._id, list[i].qv ?? 0);
    onProgress?.(i + 1, list.length);
  }
}

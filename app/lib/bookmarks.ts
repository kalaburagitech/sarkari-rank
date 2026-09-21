// Bookmarks, device-first.
//
// The list lives in AsyncStorage so it renders (and can be changed) with no
// network, and it held the app's last two live subscriptions. Toggles are
// applied locally at once and mirrored to Convex; a toggle made offline is
// queued and pushed on the next launch or foreground.
import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../convex/_generated/api";
import { http, isOnline } from "./offline";

const KEY = "bookmarks:list";
const PENDING_KEY = "bookmarks:pending";

export type Bookmark = { type: "test" | "question"; testId?: string; questionId?: string };

const idOf = (b: Bookmark) => `${b.type}:${b.testId ?? b.questionId ?? ""}`;

let cache: Bookmark[] | null = null;
const listeners = new Set<(list: Bookmark[]) => void>();

function publish(list: Bookmark[]) {
  cache = list;
  listeners.forEach((l) => l(list));
}

async function save(list: Bookmark[]) {
  publish(list);
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

async function readPending(): Promise<Bookmark[]> {
  const raw = await AsyncStorage.getItem(PENDING_KEY);
  return raw ? (JSON.parse(raw) as Bookmark[]) : [];
}

/** Local list; seeded from the server the first time the device is online. */
export async function loadBookmarks(userId?: string): Promise<Bookmark[]> {
  if (cache) return cache;
  const raw = await AsyncStorage.getItem(KEY);
  if (raw) {
    const list = JSON.parse(raw) as Bookmark[];
    publish(list);
    return list;
  }
  if (!userId || !isOnline()) return [];
  try {
    const rows = (await http.query(api.attempts.getBookmarks, {
      userId: userId as never,
    })) as Bookmark[];
    const list = rows.map((b) => ({ type: b.type, testId: b.testId, questionId: b.questionId }));
    await save(list);
    return list;
  } catch {
    return [];
  }
}

export async function toggleBookmark(userId: string, item: Bookmark) {
  const list = (await loadBookmarks(userId)) ?? [];
  const exists = list.some((b) => idOf(b) === idOf(item));
  await save(exists ? list.filter((b) => idOf(b) !== idOf(item)) : [...list, item]);

  try {
    await http.mutation(api.attempts.toggleBookmark, {
      userId: userId as never,
      type: item.type,
      testId: item.testId as never,
      questionId: item.questionId as never,
    });
  } catch {
    // Offline: remember the toggle and replay it later. Two toggles of the
    // same item cancel out, which is exactly the server's own behaviour.
    const pending = await readPending();
    const i = pending.findIndex((p) => idOf(p) === idOf(item));
    if (i >= 0) pending.splice(i, 1);
    else pending.push(item);
    await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  }
}

/** Replay toggles made while offline. Called on app start/foreground. */
export async function flushBookmarks(userId?: string) {
  if (!userId) {
    const stored = await AsyncStorage.getItem("user");
    userId = stored ? (JSON.parse(stored)._id as string) : undefined;
  }
  if (!userId) return;
  const pending = await readPending();
  if (pending.length === 0) return;
  const stuck: Bookmark[] = [];
  for (const item of pending) {
    try {
      await http.mutation(api.attempts.toggleBookmark, {
        userId: userId as never,
        type: item.type,
        testId: item.testId as never,
        questionId: item.questionId as never,
      });
    } catch {
      stuck.push(item);
    }
  }
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(stuck));
}

export function useBookmarks(userId?: string) {
  const [list, setList] = useState<Bookmark[] | undefined>(cache ?? undefined);

  useEffect(() => {
    let alive = true;
    loadBookmarks(userId).then((l) => alive && setList(l));
    const listener = (l: Bookmark[]) => alive && setList(l);
    listeners.add(listener);
    return () => {
      alive = false;
      listeners.delete(listener);
    };
  }, [userId]);

  const toggle = useCallback(
    (item: Bookmark) => (userId ? toggleBookmark(userId, item) : Promise.resolve()),
    [userId]
  );

  return { bookmarks: list ?? [], toggle };
}

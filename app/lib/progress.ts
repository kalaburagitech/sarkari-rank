import { useCallback, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";

// Per-chapter practice progress, kept on the device so a student can leave a
// chapter and resume exactly where they were (and see progress in the list).

export type ChapterProgress = {
  chapterId: string;
  chapterName: string;
  subjectName?: string;
  total: number;
  index: number; // question the student was on
  answers: Record<string, string>; // questionId → chosen option
  correct: number;
  updatedAt: number;
};

const KEY = "practice:progress";
let cache: Record<string, ChapterProgress> | null = null;

async function readAll(): Promise<Record<string, ChapterProgress>> {
  if (cache) return cache;
  try {
    cache = JSON.parse((await AsyncStorage.getItem(KEY)) ?? "{}");
  } catch {
    cache = {};
  }
  return cache!;
}

export async function getProgress(chapterId: string) {
  return (await readAll())[chapterId];
}

export async function saveProgress(p: ChapterProgress) {
  const all = await readAll();
  all[p.chapterId] = p;
  await AsyncStorage.setItem(KEY, JSON.stringify(all)).catch(() => {});
}

export async function clearProgress(chapterId: string) {
  const all = await readAll();
  delete all[chapterId];
  await AsyncStorage.setItem(KEY, JSON.stringify(all)).catch(() => {});
}

/** All chapter progress, re-read whenever the screen regains focus. */
export function useAllProgress() {
  const [all, setAll] = useState<Record<string, ChapterProgress>>({});
  useFocusEffect(
    useCallback(() => {
      readAll().then((a) => setAll({ ...a }));
    }, [])
  );
  return all;
}

/** Most recently practised chapter that isn't finished yet. */
export function latestUnfinished(all: Record<string, ChapterProgress>) {
  return Object.values(all)
    .filter((p) => Object.keys(p.answers).length < p.total)
    .sort((a, b) => b.updatedAt - a.updatedAt)[0];
}

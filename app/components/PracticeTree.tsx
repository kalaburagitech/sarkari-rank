import { Touchable } from "./Touchable";
// Subject → Chapter practice browser. Shared by the dedicated Practice screen
// and the Practice filter inside the Tests tab, so picking "Practice" there
// shows the sets in place instead of pushing another page.
import { useState } from "react";
import { View, Text } from "react-native";
import { Link } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { api } from "../convex/_generated/api";
import { useCached } from "../lib/offline";
import { PremiumCard, Badge, EmptyScreen, Skeleton } from "./ui";
import { useTheme } from "../lib/theme";
import { useAllProgress } from "../lib/progress";

type Chapter = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  order?: number; // admin-set serial number
  questionCount: number;
};

export type Subject = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  order?: number;
  chapters: Chapter[];
  questionCount: number;
};

// A single character that is likely an emoji (used as the subject glyph).
const isEmoji = (s?: string) => !!s && /\p{Extended_Pictographic}/u.test(s);

export function PracticeTree() {
  const { colors } = useTheme();
  const tree = useCached<Subject[]>("practiceTree", api.practiceBank.getPracticeTree, {}, [
    "practice",
  ]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const progress = useAllProgress();

  if (tree === undefined) {
    return (
      <View className="gap-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-20 mb-2" />
        ))}
      </View>
    );
  }

  if (tree.length === 0) {
    return (
      <EmptyScreen icon="school-outline" message="No practice sets available yet. Please check back soon." />
    );
  }

  return (
    <>
      {tree.map((subject, si) => {
        const open = expanded === subject._id;
        // Serial numbers set in the admin (older cached trees fall back to position).
        const sNo = subject.order ?? si + 1;
        return (
          <View key={subject._id} className="mb-3">
            <Touchable activeOpacity={0.85} onPress={() => setExpanded(open ? null : subject._id)}>
              <PremiumCard className="p-4">
                <View className="flex-row items-center">
                  <View style={{ backgroundColor: colors.primary }} className="w-11 h-11 rounded-xl items-center justify-center mr-3">
                    <Text className="text-white font-extrabold text-base">{sNo}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-slate-900 dark:text-slate-50 text-[15px]">
                      {isEmoji(subject.icon) ? `${subject.icon} ` : ""}{subject.name}
                    </Text>
                    <Text className="text-slate-400 dark:text-slate-400 text-xs mt-0.5">
                      {subject.chapters.length} chapter{subject.chapters.length === 1 ? "" : "s"} · {subject.questionCount} question{subject.questionCount === 1 ? "" : "s"}
                    </Text>
                  </View>
                  <Ionicons name={open ? "chevron-up" : "chevron-down"} size={20} color="#94A3B8" />
                </View>
              </PremiumCard>
            </Touchable>

            {open && (
              <View className="mt-1.5 ml-2">
                {subject.chapters.map((chapter, ci) => (
                  <Link key={chapter._id} href={`/practice-chapter/${chapter._id}` as never} asChild>
                    <Touchable activeOpacity={0.85}>
                      <PremiumCard className="p-3.5 mb-1.5">
                        <View className="flex-row items-center">
                          <View style={{ backgroundColor: colors.primary + "1A" }} className="min-w-9 h-8 px-1.5 rounded-lg items-center justify-center mr-3">
                            <Text style={{ color: colors.primary }} className="font-bold text-xs">
                              {sNo}.{chapter.order ?? ci + 1}
                            </Text>
                          </View>
                          <View className="flex-1 mr-2">
                            <Text className="font-semibold text-slate-900 dark:text-slate-50 text-sm">{chapter.name}</Text>
                            {(() => {
                              const p = progress[chapter._id];
                              const done = p ? Object.keys(p.answers).length : 0;
                              if (!done) {
                                return chapter.description ? (
                                  <Text className="text-slate-400 dark:text-slate-400 text-xs mt-0.5" numberOfLines={1}>{chapter.description}</Text>
                                ) : null;
                              }
                              const total = p!.total || chapter.questionCount || done;
                              const pct = Math.min(100, Math.round((done / total) * 100));
                              const acc = Math.round((p!.correct / done) * 100);
                              return (
                                <View className="mt-1.5">
                                  <View className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                    <View style={{ width: `${pct}%`, backgroundColor: pct === 100 ? colors.success : colors.primary }} className="h-full rounded-full" />
                                  </View>
                                  <Text className="text-[11px] text-slate-400 mt-1">
                                    {pct === 100 ? "Completed" : `${done}/${total} done`} · <Text style={{ color: acc >= 60 ? colors.success : colors.warning }} className="font-semibold">{acc}% accuracy</Text>
                                  </Text>
                                </View>
                              );
                            })()}
                          </View>
                          <Badge label={`${chapter.questionCount} Q`} color={colors.primary} />
                          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                        </View>
                      </PremiumCard>
                    </Touchable>
                  </Link>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </>
  );
}

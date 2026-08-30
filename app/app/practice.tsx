import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useRouter, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenHeader, PremiumCard, Badge, LoadingScreen, EmptyScreen, DisclaimerBanner } from "../components/ui";
import { useTheme } from "../lib/theme";

type Chapter = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  questionCount: number;
};
type Subject = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  chapters: Chapter[];
  questionCount: number;
};

// A single character that is likely an emoji (used as the subject glyph).
const isEmoji = (s?: string) => !!s && /\p{Extended_Pictographic}/u.test(s);

export default function PracticeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const tree = useQuery(api.practiceBank.getPracticeTree, {}) as Subject[] | undefined;
  const [expanded, setExpanded] = useState<string | null>(null);

  if (tree === undefined) return <LoadingScreen message="Loading practice sets..." />;

  return (
    <View className="flex-1 bg-slate-50 dark:bg-ink-bg">
      <ScreenHeader
        title="Practice by Subject"
        subtitle="Choose a subject & chapter to practice"
        onBack={() => router.back()}
      />

      <ScrollView className="px-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32, paddingTop: 12 }}>
        <View className="mb-3">
          <DisclaimerBanner onPress={() => router.push("/disclaimer")} />
        </View>

        {tree.length === 0 && (
          <EmptyScreen icon="school-outline" message="No practice sets available yet. Please check back soon." />
        )}

        {tree.map((subject) => {
          const open = expanded === subject._id;
          return (
            <View key={subject._id} className="mb-3">
              {/* Subject header (tap to expand chapters) */}
              <TouchableOpacity activeOpacity={0.85} onPress={() => setExpanded(open ? null : subject._id)}>
                <PremiumCard className="p-4">
                  <View className="flex-row items-center">
                    <View style={{ backgroundColor: colors.primary + "1F" }} className="w-11 h-11 rounded-xl items-center justify-center mr-3">
                      {isEmoji(subject.icon) ? (
                        <Text className="text-xl">{subject.icon}</Text>
                      ) : (
                        <Ionicons name="library" size={20} color={colors.primary} />
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="font-bold text-slate-900 dark:text-slate-50 text-[15px]">{subject.name}</Text>
                      <Text className="text-slate-400 dark:text-slate-400 text-xs mt-0.5">
                        {subject.chapters.length} chapter{subject.chapters.length === 1 ? "" : "s"} · {subject.questionCount} question{subject.questionCount === 1 ? "" : "s"}
                      </Text>
                    </View>
                    <Ionicons name={open ? "chevron-up" : "chevron-down"} size={20} color="#94A3B8" />
                  </View>
                </PremiumCard>
              </TouchableOpacity>

              {/* Chapters */}
              {open && (
                <View className="mt-1.5 ml-2">
                  {subject.chapters.map((chapter) => (
                    <Link key={chapter._id} href={`/practice-chapter/${chapter._id}` as never} asChild>
                      <TouchableOpacity activeOpacity={0.85}>
                        <PremiumCard className="p-3.5 mb-1.5">
                          <View className="flex-row items-center">
                            <View style={{ backgroundColor: colors.success + "1F" }} className="w-8 h-8 rounded-lg items-center justify-center mr-3">
                              <Ionicons name="reader-outline" size={16} color={colors.success} />
                            </View>
                            <View className="flex-1 mr-2">
                              <Text className="font-semibold text-slate-900 dark:text-slate-50 text-sm">{chapter.name}</Text>
                              {chapter.description ? (
                                <Text className="text-slate-400 dark:text-slate-400 text-xs mt-0.5" numberOfLines={1}>{chapter.description}</Text>
                              ) : null}
                            </View>
                            <Badge label={`${chapter.questionCount} Q`} color={colors.primary} />
                            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                          </View>
                        </PremiumCard>
                      </TouchableOpacity>
                    </Link>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

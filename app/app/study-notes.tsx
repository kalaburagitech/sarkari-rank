import { useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useRouter, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenHeader, PremiumCard, Badge, LoadingScreen, EmptyScreen, FilterChip, DisclaimerBanner } from "../components/ui";
import { useTheme } from "../lib/theme";

type Note = {
  _id: string;
  slug: string;
  title: string;
  content: string;
  summary?: string;
  subject?: string;
  topic?: string;
  isPremium: boolean;
  examId: string;
};

export default function StudyNotesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const notes = useQuery(api.content.listStudyNotes, {}) as Note[] | undefined;
  const exams = useQuery(api.exams.listExams, {});
  const [examId, setExamId] = useState<string>("");

  const filtered = useMemo(
    () => (notes ?? []).filter((n) => !examId || n.examId === examId),
    [notes, examId]
  );

  // Group: Subject → Chapter(topic) → notes
  const grouped = useMemo(() => {
    const bySubject = new Map<string, Map<string, Note[]>>();
    for (const n of filtered) {
      const subject = n.subject?.trim() || "General";
      const chapter = n.topic?.trim() || "";
      if (!bySubject.has(subject)) bySubject.set(subject, new Map());
      const chapters = bySubject.get(subject)!;
      if (!chapters.has(chapter)) chapters.set(chapter, []);
      chapters.get(chapter)!.push(n);
    }
    return [...bySubject.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  if (notes === undefined) return <LoadingScreen message="Loading study notes..." />;

  return (
    <View className="flex-1 bg-slate-50 dark:bg-ink-bg">
      <ScreenHeader title="Notes" subtitle={`${filtered.length} notes · by subject & chapter`} onBack={() => router.back()} />

      {/* Exam filter */}
      {exams && exams.length > 0 && (
        <View className="pt-3">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
            <FilterChip label="All Exams" active={!examId} onPress={() => setExamId("")} />
            {exams.map((e) => (
              <FilterChip key={e._id} label={e.name} active={examId === e._id} onPress={() => setExamId(e._id)} />
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView className="px-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32, paddingTop: 8 }}>
        <View className="mb-3">
          <DisclaimerBanner onPress={() => router.push("/disclaimer")} />
        </View>
        {grouped.length === 0 && <EmptyScreen icon="book-outline" message="No notes available for this exam yet." />}

        {grouped.map(([subject, chapters]) => (
          <View key={subject} className="mb-5">
            {/* Subject header */}
            <View className="flex-row items-center mb-2 mt-1">
              <View style={{ backgroundColor: colors.primary + "1F" }} className="w-8 h-8 rounded-lg items-center justify-center mr-2">
                <Ionicons name="library" size={16} color={colors.primary} />
              </View>
              <Text className="text-base font-bold text-slate-900 dark:text-slate-50">{subject}</Text>
            </View>

            {[...chapters.entries()].map(([chapter, chapterNotes]) => (
              <View key={chapter || "_"} className="mb-2">
                {chapter ? (
                  <Text className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1.5 ml-1">
                    {chapter}
                  </Text>
                ) : null}
                {chapterNotes.map((note) => (
                  <Link key={note._id} href={`/study-note/${note.slug}`} asChild>
                    <TouchableOpacity activeOpacity={0.85}>
                      <PremiumCard className="p-4 mb-2">
                        <View className="flex-row items-start justify-between">
                          <View className="flex-1 mr-2">
                            <Text className="font-bold text-slate-900 dark:text-slate-50 text-[15px]">{note.title}</Text>
                            <Text className="text-slate-400 dark:text-slate-400 text-sm mt-1 leading-5" numberOfLines={2}>
                              {note.summary || note.content}
                            </Text>
                          </View>
                          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                        </View>
                        <View className="flex-row mt-2 gap-2">
                          {note.isPremium ? <Badge label="Premium" color={colors.accent} /> : <Badge label="Free" color={colors.success} />}
                        </View>
                      </PremiumCard>
                    </TouchableOpacity>
                  </Link>
                ))}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

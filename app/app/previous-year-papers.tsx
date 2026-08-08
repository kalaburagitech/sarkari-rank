import { useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useRouter, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenHeader, PremiumCard, Badge, LoadingScreen, EmptyScreen, FilterChip, DisclaimerBanner } from "../components/ui";
import { useTheme } from "../lib/theme";

type Paper = {
  _id: string;
  examId: string;
  title: string;
  year?: number;
  totalQuestions: number;
  durationMinutes: number;
  isFree: boolean;
};

export default function PreviousYearPapersScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  // Server-side filter: only Previous Year Papers (type === "pyp").
  const papers = useQuery(api.exams.listTests, { type: "pyp" }) as Paper[] | undefined;
  const exams = useQuery(api.exams.listExams, {});

  const [examId, setExamId] = useState<string>("");

  const examName = useMemo(() => {
    const map = new Map<string, string>();
    (exams ?? []).forEach((e: any) => map.set(e._id, e.name));
    return map;
  }, [exams]);

  // Exams that actually have PYQ papers, for the filter chips.
  const examChips = useMemo(() => {
    const ids = new Set<string>();
    (papers ?? []).forEach((p) => ids.add(p.examId));
    return [...ids].map((id) => ({ id, name: examName.get(id) ?? "Exam" }));
  }, [papers, examName]);

  const filtered = useMemo(
    () => (papers ?? []).filter((p) => !examId || p.examId === examId),
    [papers, examId]
  );

  // Group by year (descending); undated papers sink to the bottom.
  const groups = useMemo(() => {
    const map = new Map<number, Paper[]>();
    for (const p of filtered) {
      const y = p.year ?? 0;
      const list = map.get(y);
      if (list) list.push(p);
      else map.set(y, [p]);
    }
    return [...map.keys()]
      .sort((a, b) => b - a)
      .map((y) => [y, map.get(y) ?? []] as const);
  }, [filtered]);

  if (papers === undefined) return <LoadingScreen message="Loading previous year papers..." />;

  return (
    <View className="flex-1 bg-slate-50 dark:bg-ink-bg">
      <ScreenHeader
        title="Previous Year Papers"
        subtitle="Real exam questions · year-wise"
        onBack={() => router.back()}
      />

      {examChips.length > 1 && (
        <View className="pt-3">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
            <FilterChip label="All Exams" active={!examId} onPress={() => setExamId("")} />
            {examChips.map((c) => (
              <FilterChip key={c.id} label={c.name} active={examId === c.id} onPress={() => setExamId(c.id)} />
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView
        className="px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 }}
      >
        <View className="mb-3">
          <DisclaimerBanner onPress={() => router.push("/disclaimer")} />
        </View>

        {filtered.length === 0 && (
          <EmptyScreen icon="archive-outline" message="No previous year papers yet. Check back soon." />
        )}

        {groups.map(([year, items]) => (
          <View key={year} className="mb-4">
            <Text className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2 ml-1">
              {year ? year : "Undated"}
            </Text>
            {items.map((paper) => (
              <Link key={paper._id} href={`/test/${paper._id}`} asChild>
                <TouchableOpacity activeOpacity={0.85}>
                  <PremiumCard className="p-4 mb-2.5 flex-row items-center">
                    <View style={{ backgroundColor: colors.accent + "1F" }} className="w-11 h-11 rounded-xl items-center justify-center mr-3">
                      <Ionicons name="archive" size={20} color={colors.accent} />
                    </View>
                    <View className="flex-1">
                      {examChips.length > 1 && examName.get(paper.examId) ? (
                        <Text className="text-slate-400 dark:text-slate-500 text-[11px] font-medium mb-0.5" numberOfLines={1}>
                          {examName.get(paper.examId)}
                        </Text>
                      ) : null}
                      <Text className="font-semibold text-slate-900 dark:text-slate-50" numberOfLines={2}>{paper.title}</Text>
                      <Text className="text-slate-400 dark:text-slate-400 text-xs mt-1">
                        {paper.totalQuestions} Qs · {paper.durationMinutes} min
                      </Text>
                    </View>
                    {paper.isFree && <Badge label="FREE" color={colors.success} />}
                    <Ionicons name="play-circle" size={30} color={colors.primary} style={{ marginLeft: 8 }} />
                  </PremiumCard>
                </TouchableOpacity>
              </Link>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

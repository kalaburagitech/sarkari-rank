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
  language?: string;
  paperGroup?: string;
  totalQuestions: number;
  durationMinutes: number;
  isFree: boolean;
};

// A paper that exists in one or more languages (grouped by paperGroup, or by
// exam+year+title when no group key is set).
type PaperGroup = {
  key: string;
  title: string;
  year: number;
  examId: string;
  versions: Paper[];
};

export default function PreviousYearPapersScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const papers = useQuery(api.exams.listTests, { type: "pyp" }) as Paper[] | undefined;
  const exams = useQuery(api.exams.listExams, {});

  const [examId, setExamId] = useState<string>("");

  const examName = useMemo(() => {
    const map = new Map<string, string>();
    (exams ?? []).forEach((e: any) => map.set(e._id, e.name));
    return map;
  }, [exams]);

  const examChips = useMemo(() => {
    const ids = new Set<string>();
    (papers ?? []).forEach((p) => ids.add(p.examId));
    return [...ids].map((id) => ({ id, name: examName.get(id) ?? "Exam" }));
  }, [papers, examName]);

  const filtered = useMemo(
    () => (papers ?? []).filter((p) => !examId || p.examId === examId),
    [papers, examId]
  );

  // Collapse language versions into paper groups, then group those by year.
  const byYear = useMemo(() => {
    const groups = new Map<string, PaperGroup>();
    for (const p of filtered) {
      const key = p.paperGroup || `${p.examId}:${p.year ?? 0}:${p.title}`;
      const g = groups.get(key);
      if (g) g.versions.push(p);
      else groups.set(key, { key, title: p.title, year: p.year ?? 0, examId: p.examId, versions: [p] });
    }
    // Sort each group's versions by language name for stable chip order.
    const list = [...groups.values()].map((g) => ({
      ...g,
      versions: g.versions.sort((a, b) => (a.language ?? "").localeCompare(b.language ?? "")),
    }));
    const map = new Map<number, PaperGroup[]>();
    for (const g of list) {
      const arr = map.get(g.year);
      if (arr) arr.push(g);
      else map.set(g.year, [g]);
    }
    return [...map.keys()].sort((a, b) => b - a).map((y) => [y, map.get(y) ?? []] as const);
  }, [filtered]);

  if (papers === undefined) return <LoadingScreen message="Loading previous year papers..." />;

  return (
    <View className="flex-1 bg-slate-50 dark:bg-ink-bg">
      <ScreenHeader title="Previous Year Papers" subtitle="Real exam questions · year-wise" onBack={() => router.back()} />

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

      <ScrollView className="px-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 }}>
        <View className="mb-3">
          <DisclaimerBanner onPress={() => router.push("/disclaimer")} />
        </View>

        {filtered.length === 0 && (
          <EmptyScreen icon="archive-outline" message="No previous year papers yet. Check back soon." />
        )}

        {byYear.map(([year, groups]) => (
          <View key={year} className="mb-4">
            <Text className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2 ml-1">
              {year ? year : "Undated"}
            </Text>
            {groups.map((g) => (
              <PaperGroupCard key={g.key} group={g} examName={examName} showExam={examChips.length > 1} />
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function PaperGroupCard({ group, examName, showExam }: { group: PaperGroup; examName: Map<string, string>; showExam: boolean }) {
  const { colors } = useTheme();
  const router = useRouter();
  const multi = group.versions.length > 1;
  // Default selection = first version (usually English).
  const [selectedId, setSelectedId] = useState(group.versions[0]._id);
  const selected = group.versions.find((v) => v._id === selectedId) ?? group.versions[0];

  return (
    <PremiumCard className="p-4 mb-2.5">
      <View className="flex-row items-center">
        <View style={{ backgroundColor: colors.accent + "1F" }} className="w-11 h-11 rounded-xl items-center justify-center mr-3">
          <Ionicons name="archive" size={20} color={colors.accent} />
        </View>
        <View className="flex-1">
          {showExam && examName.get(group.examId) ? (
            <Text className="text-slate-400 dark:text-slate-500 text-[11px] font-medium mb-0.5" numberOfLines={1}>
              {examName.get(group.examId)}
            </Text>
          ) : null}
          <Text className="font-semibold text-slate-900 dark:text-slate-50" numberOfLines={2}>{group.title}</Text>
          <Text className="text-slate-400 dark:text-slate-400 text-xs mt-1">
            {selected.totalQuestions} Qs · {selected.durationMinutes} min
          </Text>
        </View>
        {selected.isFree && <Badge label="FREE" color={colors.success} />}
      </View>

      {/* Language selector when the paper exists in more than one language */}
      {multi && (
        <View className="flex-row flex-wrap gap-2 mt-3">
          {group.versions.map((v) => {
            const active = v._id === selectedId;
            return (
              <TouchableOpacity
                key={v._id}
                onPress={() => setSelectedId(v._id)}
                activeOpacity={0.8}
                style={active ? { backgroundColor: colors.primary } : undefined}
                className={`px-3 py-1.5 rounded-full border ${active ? "" : "border-slate-200 dark:border-slate-700"}`}
              >
                <Text className={`text-xs font-semibold ${active ? "text-white" : "text-slate-600 dark:text-slate-300"}`}>
                  {v.language ?? "English"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <Link href={`/test/${selected._id}`} asChild>
        <TouchableOpacity activeOpacity={0.85} style={{ backgroundColor: colors.primary }} className="rounded-xl py-3 mt-3 flex-row items-center justify-center">
          <Ionicons name="play" size={16} color="#fff" />
          <Text className="text-white font-bold text-sm ml-2">
            Start{multi ? ` · ${selected.language ?? "English"}` : ""}
          </Text>
        </TouchableOpacity>
      </Link>
    </PremiumCard>
  );
}

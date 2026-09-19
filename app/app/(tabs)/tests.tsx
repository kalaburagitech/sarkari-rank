import { View, Text, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useCached } from "../../lib/offline";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useState, useMemo, useEffect } from "react";
import { SectionHeader, PremiumCard, Badge, LoadingScreen, FilterChip, DisclaimerBanner } from "../../components/ui";
import { TEST_TYPE_CONFIG } from "../../constants/theme";
import { useTheme } from "../../lib/theme";

// Filters this tab doesn't expose: "pyp" has its own screen
// (/previous-year-papers), "chapter"/"subject" were dropped, and "practice"
// now opens the Practice Bank (/practice) instead of filtering this list.
const HIDDEN_FILTERS = ["pyp", "chapter", "subject", "practice"];
const isQuizType = (type: string) => type !== "pyp";

export default function TestsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { type: paramType } = useLocalSearchParams();
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const tests = useCached<any[]>("tests", api.exams.listTests, {}, ["tests"]);
  const exams = useCached<any[]>("exams", api.exams.listExams, {}, ["exams"]);

  // Keep the active filter in sync with the incoming URL param (deep links,
  // "View All" links). Ignore "pyp" — those belong to the dedicated screen.
  useEffect(() => {
    const t = typeof paramType === "string" ? paramType : undefined;
    setFilter(t && !HIDDEN_FILTERS.includes(t) && TEST_TYPE_CONFIG[t] ? t : "all");
  }, [paramType]);

  const filtered = useMemo(() => {
    if (!tests) return [];
    return tests.filter((t) => {
      if (!isQuizType(t.type)) return false;
      const matchType = filter === "all" || t.type === filter;
      const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
      return matchType && matchSearch;
    });
  }, [tests, filter, search]);

  // Tests are listed exam-wise: one section per exam, e.g. "UPSC Prelims" with
  // its Test 1, Test 2, ... underneath.
  const groups = useMemo(() => {
    const byExam = new Map<string, typeof filtered>();
    for (const t of filtered) {
      const list = byExam.get(t.examId);
      if (list) list.push(t);
      else byExam.set(t.examId, [t]);
    }
    return [...byExam.entries()]
      .map(([examId, items]) => ({
        examId,
        name: exams?.find((e) => e._id === examId)?.name ?? "Other Tests",
        items,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [filtered, exams]);

  if (tests === undefined) return <LoadingScreen message="Loading tests from server..." />;

  return (
    <View className="flex-1 bg-slate-50 dark:bg-ink-bg">
      <ScrollView stickyHeaderIndices={[0]} showsVerticalScrollIndicator={false}>
        {/* Search bar */}
        <View className="bg-slate-50 dark:bg-ink-bg px-4 pt-3 pb-2">
          <View className="flex-row items-center bg-white dark:bg-ink-card rounded-2xl px-4 py-3 border border-slate-100 dark:border-slate-800 mb-3" style={{ shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8 }}>
            <Ionicons name="search" size={18} color="#94A3B8" />
            <TextInput placeholder="Search tests..." value={search} onChangeText={setSearch}
              className="flex-1 ml-3 text-slate-900 dark:text-slate-50 text-sm" placeholderTextColor="#94A3B8" />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
            {[{ id: "all", label: "All" }, ...Object.entries(TEST_TYPE_CONFIG).filter(([id]) => !HIDDEN_FILTERS.includes(id)).map(([id, c]) => ({ id, label: c.label }))].map((f) => (
              <FilterChip key={f.id} label={f.label} active={filter === f.id} onPress={() => setFilter(f.id)} />
            ))}
            <FilterChip label="Practice" active={false} onPress={() => router.push("/practice" as any)} />
          </ScrollView>
        </View>

        <View className="px-4 pb-8">
          <View className="mb-2">
            <DisclaimerBanner onPress={() => router.push("/disclaimer")} />
          </View>
          <SectionHeader title={`${filtered.length} Tests Available`} subtitle="Grouped exam-wise" />

          {groups.map((group) => (
            <View key={group.examId} className="mb-4">
              <Text className="font-bold text-slate-900 dark:text-slate-50 text-base mb-2 mt-1">
                {group.name} <Text className="text-slate-400 dark:text-slate-500 text-xs font-semibold">· {group.items.length} test{group.items.length === 1 ? "" : "s"}</Text>
              </Text>
              {group.items.map((test) => {
                const cfg = TEST_TYPE_CONFIG[test.type] ?? TEST_TYPE_CONFIG.mock;
                return (
                  <Link key={test._id} href={`/test/${test._id}`} asChild>
                    <TouchableOpacity activeOpacity={0.85} className="mb-3">
                      <PremiumCard className="p-4">
                        <View className="flex-row justify-between items-start">
                          <View className="flex-1 mr-3">
                            <View className="flex-row items-center gap-2 mb-2 flex-wrap">
                              <Badge label={cfg.label} color={cfg.color} />
                              <Badge label={(test as any).language ?? "English"} color={colors.primary} />
                              {test.isFree ? <Badge label="FREE" color={colors.success} /> : <Badge label="PREMIUM" color={colors.accent} />}
                            </View>
                            <Text className="font-bold text-slate-900 dark:text-slate-50 text-base leading-5">{test.title}</Text>
                            <View className="flex-row gap-3 mt-2 flex-wrap">
                              <Text className="text-slate-400 dark:text-slate-400 text-xs">📝 {test.totalQuestions} Qs</Text>
                              <Text className="text-slate-400 dark:text-slate-400 text-xs">⏱ {test.durationMinutes} min</Text>
                              <Text className="text-slate-400 dark:text-slate-400 text-xs">⭐ {test.totalMarks} marks</Text>
                              <Text className="text-slate-400 dark:text-slate-400 text-xs">👥 {test.attemptCount}+ attempts</Text>
                            </View>
                          </View>
                          <View style={{ backgroundColor: cfg.color }} className="w-12 h-12 rounded-2xl items-center justify-center">
                            <Ionicons name="play" size={22} color="#fff" />
                          </View>
                        </View>
                      </PremiumCard>
                    </TouchableOpacity>
                  </Link>
                );
              })}
            </View>
          ))}

          {filtered.length === 0 && (
            <View className="items-center py-12">
              <Text className="text-slate-400 dark:text-slate-400">No tests found. Ask admin to load production data.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

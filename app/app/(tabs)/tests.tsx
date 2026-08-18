import { View, Text, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useMemo, useEffect } from "react";
import { SectionHeader, PremiumCard, Badge, LoadingScreen, FilterChip, DisclaimerBanner } from "../../components/ui";
import { TEST_TYPE_CONFIG } from "../../constants/theme";
import { useTheme } from "../../lib/theme";

// Previous Year Papers live on their own screen (/previous-year-papers).
// This tab is strictly Tests & Quizzes, so "pyp" is never shown here.
const isQuizType = (type: string) => type !== "pyp";

export default function TestsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { type: paramType } = useLocalSearchParams();
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const tests = useQuery(api.exams.listTests, {});

  // Keep the active filter in sync with the incoming URL param (deep links,
  // "View All" links). Ignore "pyp" — those belong to the dedicated screen.
  useEffect(() => {
    const t = typeof paramType === "string" ? paramType : undefined;
    setFilter(t && t !== "pyp" && TEST_TYPE_CONFIG[t] ? t : "all");
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
            {[{ id: "all", label: "All" }, ...Object.entries(TEST_TYPE_CONFIG).filter(([id]) => id !== "pyp").map(([id, c]) => ({ id, label: c.label }))].map((f) => (
              <FilterChip key={f.id} label={f.label} active={filter === f.id} onPress={() => setFilter(f.id)} />
            ))}
          </ScrollView>
        </View>

        <View className="px-4 pb-8">
          <View className="mb-2">
            <DisclaimerBanner onPress={() => router.push("/disclaimer")} />
          </View>
          <SectionHeader title={`${filtered.length} Tests Available`} subtitle="Mock · Live · Chapter · Daily Quiz · Practice" />

          {filtered.map((test) => {
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

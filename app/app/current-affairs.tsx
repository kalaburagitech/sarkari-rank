import { useMemo, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { useQuery, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { useRouter, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenHeader, PremiumCard, Badge, LoadingScreen, EmptyScreen, FilterChip, DisclaimerBanner } from "../components/ui";
import { useTheme } from "../lib/theme";

const CATEGORY_COLORS: Record<string, string> = {
  National: "#6366F1",
  Politics: "#6366F1",
  Economy: "#10B981",
  Banking: "#3B82F6",
  Science: "#8B5CF6",
  Environment: "#059669",
  Education: "#F59E0B",
  Sports: "#EF4444",
  International: "#0EA5E9",
};

function dayBucket(ts: number): "Today" | "Yesterday" | "Earlier" {
  const now = new Date();
  const d = new Date(ts);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86400000;
  if (ts >= startOfToday) return "Today";
  if (ts >= startOfYesterday) return "Yesterday";
  return "Earlier";
}

type Affair = {
  _id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  date: number;
};

export default function CurrentAffairsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const affairs = useQuery(api.content.listCurrentAffairs, { limit: 60 }) as Affair[] | undefined;
  const refresh = useAction(api.news.refreshCurrentAffairs);

  const [cat, setCat] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);

  const categories = useMemo(() => {
    const s = new Set<string>();
    (affairs ?? []).forEach((a) => s.add(a.category));
    return [...s].sort();
  }, [affairs]);

  const filtered = useMemo(
    () => (affairs ?? []).filter((a) => !cat || a.category === cat),
    [affairs, cat]
  );

  // Group by day bucket, preserving date-desc order.
  const groups = useMemo(() => {
    const order = ["Today", "Yesterday", "Earlier"] as const;
    const map = new Map<string, Affair[]>();
    for (const a of filtered) {
      const b = dayBucket(a.date);
      if (!map.has(b)) map.set(b, []);
      map.get(b)!.push(a);
    }
    return order.filter((o) => map.has(o)).map((o) => [o, map.get(o)!] as const);
  }, [filtered]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh({});
    } catch {
      // ignore network hiccups; query stays as-is
    }
    setRefreshing(false);
  }, [refresh]);

  if (affairs === undefined) return <LoadingScreen message="Loading current affairs..." />;

  return (
    <View className="flex-1 bg-slate-50 dark:bg-ink-bg">
      <ScreenHeader
        title="Current Affairs"
        subtitle="Fresh daily · pull to refresh"
        onBack={() => router.back()}
        right={
          <TouchableOpacity onPress={onRefresh} hitSlop={8} className="w-10 h-10 rounded-xl bg-white/10 items-center justify-center">
            <Ionicons name="refresh" size={20} color="#fff" />
          </TouchableOpacity>
        }
      />

      {/* Category filter */}
      {categories.length > 0 && (
        <View className="pt-3">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
            <FilterChip label="All" active={!cat} onPress={() => setCat("")} />
            {categories.map((c) => (
              <FilterChip key={c} label={c} active={cat === c} onPress={() => setCat(c)} />
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView
        className="px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
      >
        <View className="mb-3">
          <DisclaimerBanner onPress={() => router.push("/disclaimer")} />
          <Text className="text-slate-400 dark:text-slate-500 text-[11px] mt-1.5 px-1 leading-4">
            Aggregated from public news sources · tap an item, then “Read at source” for the original.
          </Text>
        </View>

        {filtered.length === 0 && (
          <EmptyScreen icon="newspaper-outline" message="No current affairs yet. Pull down to fetch the latest." />
        )}

        {groups.map(([bucket, items]) => (
          <View key={bucket} className="mb-4">
            <Text className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2 ml-1">{bucket}</Text>
            {items.map((item) => (
              <Link key={item._id} href={`/current-affair/${item.slug}`} asChild>
                <TouchableOpacity activeOpacity={0.85}>
                  <PremiumCard className="p-4 mb-2.5">
                    <View className="flex-row items-center mb-2">
                      <Badge label={item.category} color={CATEGORY_COLORS[item.category] ?? colors.primary} />
                      <Text className="text-slate-400 dark:text-slate-500 text-xs ml-auto">
                        {new Date(item.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </Text>
                    </View>
                    <Text className="font-bold text-slate-900 dark:text-slate-50 text-base leading-6">{item.title}</Text>
                    {item.summary ? (
                      <Text className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 leading-5" numberOfLines={2}>{item.summary}</Text>
                    ) : null}
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

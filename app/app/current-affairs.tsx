import { useMemo, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { useQuery, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCached, invalidateVersions } from "../lib/offline";
import { useRouter, Link } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
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

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthLabel(ts: number) {
  const d = new Date(ts);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

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
  const refresh = useAction(api.news.refreshCurrentAffairs);

  const [cat, setCat] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);
  // Archive browsing: year === null is the default "Latest" feed; month is a
  // 0-11 index, null meaning the whole year.
  const [year, setYear] = useState<number | null>(null);
  const [month, setMonth] = useState<number | null>(null);

  // Local-time month/year bounds, so an item published late on the 31st stays
  // in its own month regardless of the device timezone.
  const range = useMemo(() => {
    if (year === null) return null;
    const start = new Date(year, month ?? 0, 1).getTime();
    const end = month === null ? new Date(year + 1, 0, 1).getTime() : new Date(year, month + 1, 1).getTime();
    return { start, end };
  }, [year, month]);

  const affairs = useCached<Affair[]>(
    range ? `affairs:${year}:${month ?? "all"}` : "affairs:latest",
    api.content.listCurrentAffairs,
    range ? { ...range, limit: 500 } : { limit: 60 },
    ["currentAffairs"]
  );
  const oldestDate = useCached<number | null>("affairs:oldest", api.content.getOldestCurrentAffairDate, {}, ["currentAffairs"]);

  const years = useMemo(() => {
    const thisYear = new Date().getFullYear();
    const first = oldestDate ? new Date(oldestDate).getFullYear() : thisYear;
    return Array.from({ length: thisYear - first + 1 }, (_, i) => thisYear - i);
  }, [oldestDate]);

  const categories = useMemo(() => {
    const s = new Set<string>();
    (affairs ?? []).forEach((a) => s.add(a.category));
    return [...s].sort();
  }, [affairs]);

  const filtered = useMemo(
    () => (affairs ?? []).filter((a) => !cat || a.category === cat),
    [affairs, cat]
  );

  // Latest feed groups by day bucket; the archive groups month-wise. Both keep
  // the date-desc order they arrive in.
  const groups = useMemo(() => {
    const map = new Map<string, Affair[]>();
    for (const a of filtered) {
      const key = range ? monthLabel(a.date) : dayBucket(a.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    if (range) return [...map.entries()].map(([k, v]) => [k, v] as const);
    const order = ["Today", "Yesterday", "Earlier"] as const;
    return order.filter((o) => map.has(o)).map((o) => [o, map.get(o)!] as const);
  }, [filtered, range]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // The cron already pulls the news daily. Let a manual refresh actually
      // hit the source at most hourly: every fetch writes rows and bumps the
      // sync counter, which makes every other device re-download the feed.
      const last = Number((await AsyncStorage.getItem("affairs:lastFetch")) ?? 0);
      if (Date.now() - last > 60 * 60 * 1000) {
        await refresh({});
        await AsyncStorage.setItem("affairs:lastFetch", String(Date.now()));
      }
      invalidateVersions();
    } catch {
      // ignore network hiccups; the cached feed stays on screen
    }
    setRefreshing(false);
  }, [refresh]);

  if (affairs === undefined) return <LoadingScreen message="Loading current affairs..." />;

  return (
    <View className="flex-1 bg-slate-50 dark:bg-ink-bg">
      <ScreenHeader
        title="Current Affairs"
        subtitle={range ? `Archive · ${month === null ? year : `${MONTHS[month]} ${year}`}` : "Fresh daily · pull to refresh"}
        onBack={() => router.back()}
        right={
          <TouchableOpacity onPress={onRefresh} hitSlop={8} className="w-10 h-10 rounded-xl bg-white/10 items-center justify-center">
            <Ionicons name="refresh" size={20} color="#fff" />
          </TouchableOpacity>
        }
      />

      {/* Year + month archive */}
      <View className="pt-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          <FilterChip label="Latest" active={year === null} onPress={() => { setYear(null); setMonth(null); }} />
          {years.map((y) => (
            <FilterChip key={y} label={String(y)} active={year === y} onPress={() => { setYear(y); setMonth(null); }} />
          ))}
        </ScrollView>
        {year !== null && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
            <FilterChip label="All months" active={month === null} onPress={() => setMonth(null)} />
            {MONTHS.map((m, i) => (
              <FilterChip key={m} label={m} active={month === i} onPress={() => setMonth(i)} />
            ))}
          </ScrollView>
        )}
      </View>

      {/* Category filter */}
      {categories.length > 0 && (
        <View>
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
          <EmptyScreen
            icon="newspaper-outline"
            message={range
              ? `No current affairs published in ${month === null ? year : `${MONTHS[month]} ${year}`}.`
              : "No current affairs yet. Pull down to fetch the latest."}
          />
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

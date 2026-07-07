import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenHeader, PremiumCard, LoadingScreen, FilterChip } from "../components/ui";
import { TEST_TYPE_CONFIG, theme } from "../constants/theme";

export default function LeaderboardScreen() {
  const router = useRouter();
  const tests = useQuery(api.exams.listTests, {});
  const [selectedTestId, setSelectedTestId] = useState<Id<"tests"> | null>(null);

  const mockTests = tests?.filter((t) => t.type === "mock" || t.type === "live").slice(0, 12) ?? [];
  const activeTestId = selectedTestId ?? mockTests[0]?._id;
  const activeTest = tests?.find((t) => t._id === activeTestId);
  const leaderboard = useQuery(api.attempts.getLeaderboard, activeTestId ? { testId: activeTestId, limit: 25 } : "skip");

  if (!tests) return <LoadingScreen />;

  return (
    <View className="flex-1 bg-slate-50">
      <ScreenHeader title="All India Leaderboard" subtitle={activeTest?.title ?? "Select a test"} onBack={() => router.back()} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 py-3 max-h-14">
        {mockTests.map((t) => (
          <FilterChip
            key={t._id}
            label={t.title.length > 20 ? t.title.slice(0, 18) + "…" : t.title}
            active={activeTestId === t._id}
            onPress={() => setSelectedTestId(t._id)}
          />
        ))}
      </ScrollView>

      <ScrollView className="px-4 pb-8" showsVerticalScrollIndicator={false}>
        {leaderboard?.map((entry, idx) => (
          <PremiumCard key={`${entry.rank}-${entry.userName}`} className={`p-4 mb-2 flex-row items-center ${idx < 3 ? "border-amber-200" : ""}`}>
            <View className={`w-11 h-11 rounded-2xl items-center justify-center mr-3 ${idx === 0 ? "bg-amber-400" : idx === 1 ? "bg-slate-300" : idx === 2 ? "bg-amber-700" : "bg-slate-100"}`}>
              {idx < 3 ? (
                <Ionicons name="medal" size={20} color="#fff" />
              ) : (
                <Text className="font-bold text-slate-600 text-sm">#{entry.rank}</Text>
              )}
            </View>
            <View className="flex-1">
              <Text className="font-bold text-slate-900">{entry.userName}</Text>
              <Text className="text-slate-400 text-xs mt-0.5">
                {Math.floor(entry.timeTakenSeconds / 60)}m {entry.timeTakenSeconds % 60}s · Rank #{entry.rank}
              </Text>
            </View>
            <View className="items-end">
              <Text className="font-black text-indigo-600 text-xl">{entry.score}</Text>
              <Text className="text-slate-400 text-xs">marks</Text>
            </View>
          </PremiumCard>
        ))}
        {(!leaderboard || leaderboard.length === 0) && (
          <View className="items-center py-16">
            <Ionicons name="podium-outline" size={48} color="#CBD5E1" />
            <Text className="text-slate-400 mt-4 text-center">No entries yet. Be the first to attempt this test!</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

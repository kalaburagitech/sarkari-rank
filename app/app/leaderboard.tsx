import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenHeader, PremiumCard, LoadingScreen } from "../components/ui";
import { useAuth } from "../lib/auth";
import { theme } from "../constants/theme";

const MEDAL = ["#F59E0B", "#94A3B8", "#B45309"]; // gold, silver, bronze

export default function LeaderboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const tests = useQuery(api.exams.listTests, {});
  const [selectedTestId, setSelectedTestId] = useState<Id<"tests"> | null>(null);

  const mockTests = tests?.filter((t) => t.type === "mock" || t.type === "live").slice(0, 15) ?? [];
  const activeTestId = selectedTestId ?? mockTests[0]?._id;
  const activeTest = tests?.find((t) => t._id === activeTestId);
  const leaderboard = useQuery(
    api.attempts.getLeaderboard,
    activeTestId ? { testId: activeTestId, limit: 50 } : "skip"
  );

  if (!tests) return <LoadingScreen />;

  const top3 = leaderboard?.slice(0, 3) ?? [];
  const rest = leaderboard?.slice(3) ?? [];
  const fmtTime = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;
  const isMe = (name: string) => !!user && name === user.name;

  return (
    <View className="flex-1 bg-slate-50">
      <ScreenHeader
        title="All India Leaderboard"
        subtitle={activeTest?.title ?? "Select a test"}
        onBack={() => router.back()}
        right={<Ionicons name="trophy" size={22} color="#FCD34D" />}
      />

      {/* Test selector */}
      <View className="bg-white border-b border-slate-100">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10 }}>
          {mockTests.map((t) => {
            const active = activeTestId === t._id;
            return (
              <TouchableOpacity
                key={t._id}
                onPress={() => setSelectedTestId(t._id)}
                className={`px-4 py-2 rounded-full mr-2 ${active ? "bg-indigo-600" : "bg-slate-100"}`}
              >
                <Text className={`text-xs font-semibold ${active ? "text-white" : "text-slate-600"}`} numberOfLines={1}>
                  {t.title.length > 22 ? t.title.slice(0, 20) + "…" : t.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {(!leaderboard || leaderboard.length === 0) ? (
          <View className="items-center py-20">
            <View className="w-20 h-20 rounded-full bg-indigo-50 items-center justify-center mb-4">
              <Ionicons name="podium-outline" size={40} color={theme.primary} />
            </View>
            <Text className="text-slate-500 text-center font-medium">No entries yet</Text>
            <Text className="text-slate-400 text-center text-sm mt-1">Be the first to attempt this test and top the chart!</Text>
          </View>
        ) : (
          <>
            {/* Podium — top 3 */}
            {top3.length > 0 && (
              <View className="flex-row items-end justify-center mb-6 mt-2">
                {[1, 0, 2].map((slot) => {
                  const entry = top3[slot];
                  if (!entry) return <View key={slot} className="flex-1" />;
                  const h = slot === 0 ? 96 : 72;
                  return (
                    <View key={slot} className="flex-1 items-center px-1">
                      <View
                        className="rounded-full items-center justify-center mb-2"
                        style={{ width: slot === 0 ? 60 : 50, height: slot === 0 ? 60 : 50, backgroundColor: MEDAL[slot] + "22", borderWidth: 2, borderColor: MEDAL[slot] }}
                      >
                        <Text className="font-black text-lg" style={{ color: MEDAL[slot] }}>{entry.userName.charAt(0).toUpperCase()}</Text>
                      </View>
                      <Text className="font-bold text-slate-900 text-xs text-center" numberOfLines={1}>{isMe(entry.userName) ? "You" : entry.userName}</Text>
                      <Text className="text-slate-400 text-[11px] mb-1">{entry.score} marks</Text>
                      <View className="w-full rounded-t-xl items-center justify-start pt-2" style={{ height: h, backgroundColor: MEDAL[slot] + "18" }}>
                        <View className="w-7 h-7 rounded-full items-center justify-center" style={{ backgroundColor: MEDAL[slot] }}>
                          <Ionicons name="medal" size={16} color="#fff" />
                        </View>
                        <Text className="mt-1 font-black" style={{ color: MEDAL[slot] }}>#{entry.rank}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Rest of the list */}
            {rest.map((entry) => (
              <PremiumCard
                key={`${entry.rank}-${entry.userName}`}
                className={`p-3.5 mb-2 flex-row items-center ${isMe(entry.userName) ? "border-indigo-400 bg-indigo-50" : ""}`}
              >
                <View className="w-9 h-9 rounded-xl bg-slate-100 items-center justify-center mr-3">
                  <Text className="font-bold text-slate-600 text-sm">#{entry.rank}</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-slate-900" numberOfLines={1}>
                    {isMe(entry.userName) ? `${entry.userName} (You)` : entry.userName}
                  </Text>
                  <Text className="text-slate-400 text-xs mt-0.5">⏱ {fmtTime(entry.timeTakenSeconds)}</Text>
                </View>
                <View className="items-end">
                  <Text className="font-black text-indigo-600 text-lg">{entry.score}</Text>
                  <Text className="text-slate-400 text-[11px]">marks</Text>
                </View>
              </PremiumCard>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

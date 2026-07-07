import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../../lib/auth";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SectionHeader, PremiumCard, StatBox, LoadingScreen, EmptyScreen } from "../../components/ui";
import { theme } from "../../constants/theme";

export default function AnalyticsScreen() {
  const { user } = useAuth();
  const analytics = useQuery(api.attempts.getPerformanceAnalytics, user ? { userId: user._id } : "skip");
  const attempts = useQuery(api.attempts.getUserAttempts, user ? { userId: user._id } : "skip");

  if (!user) return <LoadingScreen message="Loading analytics..." />;

  const completed = attempts?.filter((a) => a.status === "completed") ?? [];

  return (
    <ScrollView className="flex-1 bg-slate-50" showsVerticalScrollIndicator={false}>
      <View style={{ backgroundColor: theme.primaryDark }} className="px-5 pt-5 pb-8">
        <Text className="text-indigo-300 text-sm font-medium">Performance Dashboard</Text>
        <Text className="text-white text-2xl font-bold mt-1">Your Analytics</Text>
        <Text className="text-indigo-200 text-sm mt-1">Track progress · Find weak areas · Improve rank</Text>
      </View>

      <PremiumCard className="mx-4 -mt-5 p-1 flex-row flex-wrap">
        {[
          { icon: "document-text", value: analytics?.totalTests ?? 0, label: "Tests Taken", color: theme.primary },
          { icon: "star", value: analytics?.avgScore?.toFixed(1) ?? "0", label: "Avg Score", color: "#F59E0B" },
          { icon: "checkmark-circle", value: `${analytics?.avgAccuracy?.toFixed(0) ?? 0}%`, label: "Accuracy", color: "#10B981" },
          { icon: "trophy", value: analytics?.bestRank ? `#${analytics.bestRank}` : "—", label: "Best Rank", color: "#EC4899" },
        ].map((s, i) => (
          <View key={s.label} className="w-1/2">
            <StatBox icon={s.icon} value={s.value} label={s.label} color={s.color} />
          </View>
        ))}
      </PremiumCard>

      <View className="px-4 mt-6">
        <Link href="/leaderboard" asChild>
          <TouchableOpacity activeOpacity={0.9}>
            <View style={{ backgroundColor: theme.primary }} className="rounded-2xl p-4 flex-row items-center mb-6">
              <View className="w-12 h-12 rounded-xl bg-white/20 items-center justify-center mr-3">
                <Ionicons name="podium" size={24} color="#fff" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold">All India Leaderboard</Text>
                <Text className="text-indigo-200 text-xs mt-0.5">Compare your rank with top aspirants</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
        </Link>

        {analytics?.subjectBreakdown && analytics.subjectBreakdown.length > 0 && (
          <View className="mb-6">
            <SectionHeader title="Subject-wise Analysis" subtitle="Strength & weakness breakdown" />
            {analytics.subjectBreakdown.map((sub) => (
              <PremiumCard key={sub.subject} className="p-4 mb-2">
                <View className="flex-row justify-between mb-2">
                  <Text className="font-semibold text-slate-900">{sub.subject}</Text>
                  <Text className="text-sm font-bold" style={{ color: sub.accuracy >= 70 ? "#10B981" : sub.accuracy >= 50 ? "#F59E0B" : "#EF4444" }}>
                    {sub.accuracy.toFixed(0)}%
                  </Text>
                </View>
                <View className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <View className="h-full rounded-full" style={{ width: `${sub.accuracy}%`, backgroundColor: sub.accuracy >= 70 ? "#10B981" : sub.accuracy >= 50 ? "#F59E0B" : "#EF4444" }} />
                </View>
                <Text className="text-slate-400 text-xs mt-1.5">{sub.total} questions attempted</Text>
              </PremiumCard>
            ))}
          </View>
        )}

        <SectionHeader title="Recent Attempts" subtitle={`${completed.length} completed tests`} />
        {completed.slice(0, 10).map((attempt) => (
          <PremiumCard key={attempt._id} className="p-4 mb-2 flex-row items-center">
            <View className="flex-1">
              <Text className="font-semibold text-slate-900" numberOfLines={1}>{attempt.testTitle}</Text>
              <Text className="text-slate-500 text-xs mt-1">
                Score {attempt.score}/{attempt.totalMarks} · {attempt.accuracy.toFixed(0)}% accuracy
              </Text>
            </View>
            {attempt.rank && (
              <View className="bg-indigo-50 px-3 py-1.5 rounded-full">
                <Text className="text-indigo-700 text-xs font-bold">Rank #{attempt.rank}</Text>
              </View>
            )}
          </PremiumCard>
        ))}

        {completed.length === 0 && (
          <EmptyScreen icon="bar-chart-outline" message="Take a mock test to unlock your performance analytics" />
        )}
      </View>
    </ScrollView>
  );
}

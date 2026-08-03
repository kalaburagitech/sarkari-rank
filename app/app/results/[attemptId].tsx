import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter, Link } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { PremiumCard, Badge, PrimaryButton } from "../../components/ui";
import { useTheme } from "../../lib/theme";

export default function ResultsScreen() {
  const { attemptId } = useLocalSearchParams<{ attemptId: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const [showSolutions, setShowSolutions] = useState(false);
  const attempt = useQuery(api.attempts.getAttempt, { attemptId: attemptId as Id<"testAttempts"> });

  if (!attempt) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-ink-bg">
        <Text className="text-slate-400 dark:text-slate-400">Calculating your results...</Text>
      </View>
    );
  }

  if (attempt.status !== "completed") {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-ink-bg p-6">
        <Text className="text-slate-600 dark:text-slate-400 font-semibold text-center">Test still in progress</Text>
        <TouchableOpacity onPress={() => router.push(`/test/${attempt.testId}`)} className="mt-4 bg-indigo-600 px-6 py-3 rounded-xl">
          <Text className="text-white font-bold">Resume Test</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const correct = attempt.answers.filter((a) => a.isCorrect).length;
  const wrong = attempt.answers.filter((a) => a.selectedOptionId && !a.isCorrect).length;
  const unattempted = attempt.answers.filter((a) => !a.selectedOptionId).length;
  const accuracyColor = attempt.accuracy >= 70 ? colors.success : attempt.accuracy >= 50 ? colors.accent : colors.danger;

  return (
    <ScrollView className="flex-1 bg-slate-50 dark:bg-ink-bg" showsVerticalScrollIndicator={false}>
      <View style={{ backgroundColor: colors.hero }} className="p-6 items-center pt-8">
        <View className="w-20 h-20 rounded-full bg-amber-400/20 items-center justify-center mb-3">
          <Ionicons name="trophy" size={40} color="#FCD34D" />
        </View>
        <Text className="text-white text-2xl font-bold">Test Completed!</Text>
        <Text className="text-indigo-200 mt-1 text-center px-4">{attempt.test?.title}</Text>
      </View>

      <PremiumCard className="mx-4 -mt-5 p-6">
        <View className="items-center mb-5">
          <Text style={{ color: colors.primary }} className="text-6xl font-bold">{attempt.score}</Text>
          <Text className="text-slate-500 dark:text-slate-400 text-sm">out of {attempt.totalMarks} marks</Text>
        </View>

        <View className="flex-row justify-around mb-5">
          {[
            { label: "Accuracy", value: `${attempt.accuracy.toFixed(0)}%`, color: accuracyColor },
            { label: "All India Rank", value: attempt.rank ? `#${attempt.rank}` : "—", color: colors.accent },
            { label: "Percentile", value: attempt.percentile ? `${attempt.percentile.toFixed(0)}%` : "—", color: "#8B5CF6" },
          ].map((s) => (
            <View key={s.label} className="items-center">
              <Text className="text-xl font-bold" style={{ color: s.color }}>{s.value}</Text>
              <Text className="text-slate-400 dark:text-slate-400 text-xs mt-0.5">{s.label}</Text>
            </View>
          ))}
        </View>

        <View className="flex-row justify-around bg-slate-50 dark:bg-ink-bg rounded-2xl p-4">
          {[{ v: correct, l: "Correct", c: colors.success }, { v: wrong, l: "Wrong", c: colors.danger }, { v: unattempted, l: "Skipped", c: "#94A3B8" }].map((s) => (
            <View key={s.l} className="items-center">
              <Text className="font-bold text-2xl" style={{ color: s.c }}>{s.v}</Text>
              <Text className="text-slate-400 dark:text-slate-400 text-xs">{s.l}</Text>
            </View>
          ))}
        </View>
      </PremiumCard>

      <View className="p-4 gap-3">
        <PrimaryButton title={showSolutions ? "Hide Solutions" : "📖 View Solutions & Explanations"} onPress={() => setShowSolutions(!showSolutions)} />
        {attempt.test && (
          <Link href={`/leaderboard`} asChild>
            <TouchableOpacity className="bg-white dark:bg-ink-card border border-slate-200 dark:border-slate-700 rounded-2xl py-4 items-center">
              <Text className="text-indigo-600 font-bold">🏆 View Leaderboard</Text>
            </TouchableOpacity>
          </Link>
        )}
        <PrimaryButton title="📊 View Full Analytics" onPress={() => router.push("/(tabs)/analytics")} />
        <PrimaryButton title="Re-attempt Test" variant="outline" onPress={() => router.push(`/test/${attempt.testId}`)} />
        <PrimaryButton title="Back to Home" variant="outline" onPress={() => router.push("/(tabs)")} />
      </View>

      {showSolutions && attempt.questions && attempt.questions.length > 0 && (
        <View className="px-4 pb-8">
          <Text className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-3">Solutions (from database)</Text>
          {attempt.questions.map((q, idx) => {
            const ans = attempt.answers.find((a) => a.questionId === q._id);
            const isCorrect = ans?.isCorrect;
            const withSolutions = q as typeof q & { correctOptionId?: string; explanation?: string };
            const correctId = withSolutions.correctOptionId;
            return (
              <PremiumCard key={q._id} className="p-4 mb-3">
                <View className="flex-row items-center gap-2 mb-2">
                  <Badge label={`Q${idx + 1}`} color={colors.primary} />
                  <Badge label={isCorrect ? "Correct" : ans?.selectedOptionId ? "Wrong" : "Skipped"} color={isCorrect ? colors.success : ans?.selectedOptionId ? colors.danger : "#94A3B8"} />
                </View>
                <Text className="font-medium text-slate-900 dark:text-slate-50 mb-3">{q.questionText}</Text>
                {q.options.map((opt) => (
                  <View key={opt.id} className={`px-3 py-2 rounded-xl mb-1 ${opt.id === correctId ? "bg-emerald-50 border border-emerald-200" : opt.id === ans?.selectedOptionId && !isCorrect ? "bg-red-50 border border-red-200" : "bg-slate-50 dark:bg-ink-bg"}`}>
                    <Text className={`text-sm ${opt.id === correctId ? "text-emerald-800 font-semibold" : "text-slate-600 dark:text-slate-400"}`}>
                      {opt.id.toUpperCase()}. {opt.text} {opt.id === correctId ? " ✓" : ""}
                    </Text>
                  </View>
                ))}
                {withSolutions.explanation ? (
                  <View className="bg-indigo-50 rounded-xl p-3 mt-2">
                    <Text className="text-indigo-800 text-sm">💡 {withSolutions.explanation}</Text>
                  </View>
                ) : null}
              </PremiumCard>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

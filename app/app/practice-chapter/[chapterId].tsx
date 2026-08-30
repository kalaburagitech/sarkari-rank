import { useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenHeader, PremiumCard, Badge, PrimaryButton, LoadingScreen, EmptyScreen, AnswerOptionCard } from "../../components/ui";
import { useTheme } from "../../lib/theme";

type Opt = { id: string; text: string };
type Question = {
  _id: string;
  questionText: string;
  options: Opt[];
  correctOptionId: string;
  explanation?: string;
  difficulty: "easy" | "medium" | "hard";
  language: string;
  year?: number;
  message?: string;
};
type Practice = {
  chapter: { _id: string; name: string; slug: string };
  subject: { _id: string; name: string } | null;
  questions: Question[];
};

const diffColor: Record<string, string> = { easy: "#10B981", medium: "#F59E0B", hard: "#EF4444" };

export default function PracticeChapterScreen() {
  const { chapterId } = useLocalSearchParams<{ chapterId: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const data = useQuery(api.practiceBank.getChapterPractice, {
    chapterId: chapterId as Id<"chapters">,
  }) as Practice | null | undefined;

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [finished, setFinished] = useState(false);

  const questions = data?.questions ?? [];
  const total = questions.length;

  const score = useMemo(
    () =>
      questions.reduce(
        (n, q) => (answers[q._id] === q.correctOptionId ? n + 1 : n),
        0
      ),
    [questions, answers]
  );
  const answeredCount = Object.keys(answers).length;

  if (data === undefined) return <LoadingScreen message="Loading questions..." />;

  if (data === null || total === 0) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-ink-bg">
        <ScreenHeader title="Practice" onBack={() => router.back()} />
        <EmptyScreen icon="reader-outline" message="No questions available in this chapter yet." />
      </View>
    );
  }

  const subtitle = data.subject ? data.subject.name : "Practice";

  // ── Summary ──
  if (finished) {
    const pct = total ? Math.round((score / total) * 100) : 0;
    const reset = () => { setAnswers({}); setIndex(0); setFinished(false); };
    return (
      <View className="flex-1 bg-slate-50 dark:bg-ink-bg">
        <ScreenHeader title="Practice Complete" subtitle={data.chapter.name} onBack={() => router.back()} />
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <PremiumCard className="p-6 items-center mb-4">
            <View style={{ backgroundColor: colors.primary + "1F" }} className="w-20 h-20 rounded-full items-center justify-center mb-3">
              <Text style={{ color: colors.primary }} className="text-3xl font-extrabold">{pct}%</Text>
            </View>
            <Text className="text-slate-900 dark:text-slate-50 text-lg font-bold">
              {score} / {total} correct
            </Text>
            <Text className="text-slate-400 dark:text-slate-400 text-sm mt-1">
              {data.subject ? `${data.subject.name} · ` : ""}{data.chapter.name}
            </Text>
          </PremiumCard>

          <PrimaryButton title="Practice Again" icon="refresh" onPress={reset} />
          <View className="h-3" />
          <PrimaryButton title="Back to Subjects" variant="outline" onPress={() => router.back()} />
        </ScrollView>
      </View>
    );
  }

  const q = questions[index];
  const selected = answers[q._id];
  const answered = selected !== undefined;
  const isLast = index === total - 1;

  const select = (optId: string) => {
    if (answered) return; // lock after first choice (immediate-feedback practice)
    setAnswers((prev) => ({ ...prev, [q._id]: optId }));
  };
  const optState = (optId: string): "idle" | "selected" | "correct" | "wrong" => {
    if (!answered) return "idle";
    if (optId === q.correctOptionId) return "correct";
    if (optId === selected) return "wrong";
    return "idle";
  };

  const goNext = () => {
    if (isLast) setFinished(true);
    else setIndex((i) => Math.min(i + 1, total - 1));
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-ink-bg">
      <ScreenHeader
        title={data.chapter.name}
        subtitle={subtitle}
        onBack={() => router.back()}
        right={<Text className="text-white/90 text-sm font-semibold">{score}/{answeredCount || 0}</Text>}
      />

      {/* Progress bar */}
      <View className="h-1.5 bg-slate-200 dark:bg-slate-800">
        <View style={{ width: `${((index + 1) / total) * 100}%`, backgroundColor: colors.primary }} className="h-full" />
      </View>

      <ScrollView className="px-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 14, paddingBottom: 28 }}>
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wide">
            Question {index + 1} of {total}
          </Text>
          <Badge label={q.difficulty} color={diffColor[q.difficulty] ?? colors.primary} />
        </View>

        <PremiumCard className="p-4 mb-4">
          {q.message && q.year != null && (
            <View className="flex-row items-center mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Ionicons name="school-outline" size={14} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted }} className="text-xs font-semibold ml-1.5" numberOfLines={2}>
                Exam: {q.message} ({q.year})
              </Text>
            </View>
          )}
          <Text className="text-slate-900 dark:text-slate-50 text-[16px] leading-6 font-medium">{q.questionText}</Text>
        </PremiumCard>

        {q.options.map((opt) => (
          <AnswerOptionCard
            key={opt.id}
            optionId={opt.id}
            text={opt.text}
            state={optState(opt.id)}
            disabled={answered}
            onPress={() => select(opt.id)}
          />
        ))}

        {/* Explanation after answering */}
        {answered && (
          <PremiumCard className="p-4 mt-1">
            <View className="flex-row items-center mb-1.5">
              <Ionicons
                name={selected === q.correctOptionId ? "checkmark-circle" : "close-circle"}
                size={18}
                color={selected === q.correctOptionId ? colors.success : colors.danger}
              />
              <Text
                style={{ color: selected === q.correctOptionId ? colors.success : colors.danger }}
                className="font-bold text-sm ml-1.5"
              >
                {selected === q.correctOptionId ? "Correct!" : "Incorrect"}
              </Text>
            </View>
            {q.explanation ? (
              <Text className="text-slate-600 dark:text-slate-300 text-sm leading-6">{q.explanation}</Text>
            ) : (
              <Text className="text-slate-400 dark:text-slate-500 text-sm">
                Correct answer: {q.options.find((o) => o.id === q.correctOptionId)?.text}
              </Text>
            )}
          </PremiumCard>
        )}
      </ScrollView>

      {/* Footer nav */}
      <View
        style={{ paddingBottom: insets.bottom + 12, backgroundColor: colors.surface, borderTopColor: colors.border }}
        className="px-4 pt-3 border-t flex-row items-center gap-3"
      >
        <TouchableOpacity
          onPress={() => setIndex((i) => Math.max(i - 1, 0))}
          disabled={index === 0}
          className={`w-12 h-12 rounded-xl items-center justify-center border ${index === 0 ? "opacity-30" : ""}`}
          style={{ borderColor: colors.border }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View className="flex-1">
          <PrimaryButton
            title={isLast ? (answered ? "Finish" : "Skip & Finish") : answered ? "Next Question" : "Skip"}
            icon={isLast ? "flag" : "arrow-forward"}
            onPress={goNext}
          />
        </View>
      </View>
    </View>
  );
}

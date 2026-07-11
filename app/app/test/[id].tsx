import { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useLocalSearchParams, useRouter, Redirect } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "../../lib/auth";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PremiumCard, Badge, PrimaryButton, LoadingScreen, EmptyScreen } from "../../components/ui";
import { TEST_TYPE_CONFIG, theme } from "../../constants/theme";

export default function TestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const testId = id as Id<"tests">;

  const test = useQuery(api.exams.getTest, { id: testId });
  const questions = useQuery(api.exams.listQuestions, { testId });
  const inProgress = useQuery(
    api.attempts.getInProgressAttempt,
    user ? { userId: user._id, testId } : "skip"
  );
  const bookmarks = useQuery(api.attempts.getBookmarks, user ? { userId: user._id } : "skip");

  const startAttempt = useMutation(api.attempts.startAttempt);
  const submitAnswer = useMutation(api.attempts.submitAnswer);
  const submitTest = useMutation(api.attempts.submitTest);
  const toggleBookmark = useMutation(api.attempts.toggleBookmark);

  const [attemptId, setAttemptId] = useState<Id<"testAttempts"> | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [started, setStarted] = useState(false);
  const [starting, setStarting] = useState(false);
  const [lang, setLang] = useState<"en" | "kn">("en");
  const [revealed, setRevealed] = useState<
    Record<string, { correctOptionId: string; explanation?: string; explanationKn?: string }>
  >({});
  const resumedRef = useRef(false);

  const isBookmarked = bookmarks?.some((b) => b.type === "test" && b.testId === id);
  const questionCount = questions?.length ?? test?.liveQuestionCount ?? 0;

  // Resume in-progress attempt from Convex DB
  useEffect(() => {
    if (!inProgress || !test || !questions?.length || resumedRef.current) return;
    resumedRef.current = true;
    setAttemptId(inProgress._id);
    setStarted(true);

    const saved: Record<string, string> = {};
    for (const a of inProgress.answers) {
      if (a.selectedOptionId) saved[a.questionId] = a.selectedOptionId;
    }
    setSelectedAnswers(saved);

    const elapsed = Math.floor((Date.now() - inProgress.startedAt) / 1000);
    const remaining = Math.max(0, test.durationMinutes * 60 - elapsed);
    setTimeLeft(remaining);

    if (remaining <= 0) {
      submitTest({ attemptId: inProgress._id }).then(() => {
        router.replace(`/results/${inProgress._id}`);
      });
    }
  }, [inProgress, test, questions, submitTest, router]);

  useEffect(() => {
    if (test && !inProgress && !started) {
      setTimeLeft(test.durationMinutes * 60);
    }
  }, [test, inProgress, started]);

  const handleSubmit = useCallback(async () => {
    if (!attemptId) return;
    Alert.alert("Submit Test", "Are you sure you want to submit?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Submit",
        onPress: async () => {
          await submitTest({ attemptId });
          router.replace(`/results/${attemptId}`);
        },
      },
    ]);
  }, [attemptId, submitTest, router]);

  useEffect(() => {
    if (!started || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [started, timeLeft, handleSubmit]);

  const handleStart = async () => {
    if (!user || !test) return;
    if (questionCount === 0) {
      Alert.alert("No Questions", "This test has no questions yet. Please check back later or contact admin.");
      return;
    }
    setStarting(true);
    try {
      const aId = await startAttempt({ userId: user._id, testId });
      setAttemptId(aId);
      setStarted(true);
      setTimeLeft(test.durationMinutes * 60);
    } catch (err) {
      const msg = (err as Error).message ?? "Could not start test";
      if (msg.includes("Premium")) {
        Alert.alert("Premium Required", msg, [
          { text: "Cancel", style: "cancel" },
          { text: "Get Premium", onPress: () => router.push("/premium") },
        ]);
      } else {
        Alert.alert("Cannot Start", msg);
      }
    }
    setStarting(false);
  };

  const handleToggleBookmark = async () => {
    if (!user) return;
    await toggleBookmark({ userId: user._id, type: "test", testId });
  };

  const handleSelectOption = async (optionId: string) => {
    const q = questions?.[currentIndex];
    if (!q || !attemptId) return;
    if (revealed[q._id]) return; // answer locked after first selection
    setSelectedAnswers((prev) => ({ ...prev, [q._id]: optionId }));
    try {
      const res = await submitAnswer({ attemptId, questionId: q._id, selectedOptionId: optionId, timeSpentSeconds: 5 });
      if (res) {
        setRevealed((prev) => ({
          ...prev,
          [q._id]: { correctOptionId: res.correctOptionId, explanation: res.explanation, explanationKn: res.explanationKn },
        }));
      }
    } catch {
      // keep selection even if the network write fails
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  if (!user) return <Redirect href="/(auth)/login" />;
  if (test === undefined || questions === undefined) return <LoadingScreen message="Loading test from database..." />;

  if (!test) {
    return <EmptyScreen icon="alert-circle-outline" message="Test not found in database" />;
  }

  const typeCfg = TEST_TYPE_CONFIG[test.type] ?? TEST_TYPE_CONFIG.mock;
  const locked = test.isPremium && !user.isPremium && !test.isFree;

  if (!started) {
    return (
      <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <PremiumCard className="p-6">
          <View className="flex-row items-start justify-between mb-2">
            <Badge label={typeCfg.label} color={typeCfg.color} />
            <TouchableOpacity onPress={handleToggleBookmark}>
              <Ionicons name={isBookmarked ? "bookmark" : "bookmark-outline"} size={24} color={isBookmarked ? theme.primary : "#94A3B8"} />
            </TouchableOpacity>
          </View>
          <Text className="text-2xl font-bold text-slate-900 mt-2">{test.title}</Text>
          <Text className="text-slate-500 mt-2 leading-5">{test.description}</Text>

          <View className="flex-row flex-wrap gap-2 mt-5">
            {[
              { icon: "help-circle", label: "Questions", value: questionCount },
              { icon: "time", label: "Duration", value: `${test.durationMinutes} min` },
              { icon: "star", label: "Marks", value: test.totalMarks },
              { icon: "remove-circle", label: "Negative", value: `-${test.negativeMarking}` },
            ].map((item) => (
              <View key={item.label} className="bg-slate-50 rounded-xl p-3 flex-1 min-w-[44%] items-center">
                <Ionicons name={item.icon as any} size={18} color={theme.primary} />
                <Text className="font-bold text-slate-900 mt-1">{item.value}</Text>
                <Text className="text-slate-400 text-xs">{item.label}</Text>
              </View>
            ))}
          </View>

          {questionCount === 0 ? (
            <View className="bg-amber-50 rounded-xl p-4 mt-4 border border-amber-200">
              <Text className="text-amber-800 text-sm font-semibold">No questions in database yet</Text>
              <Text className="text-amber-700 text-xs mt-1">Admin can add questions from the dashboard. This test will be available once questions are added.</Text>
            </View>
          ) : (
            <View className="bg-amber-50 rounded-xl p-4 mt-4 border border-amber-100">
              <Text className="text-amber-800 text-sm font-bold">Instructions</Text>
              <Text className="text-amber-700 text-xs mt-2 leading-5">
                • {questionCount} questions loaded live from server{"\n"}
                • Negative marking: -{test.negativeMarking} per wrong answer{"\n"}
                • Timer auto-submits when time ends{"\n"}
                • Answers saved to your account in real-time
              </Text>
            </View>
          )}

          {inProgress && questionCount > 0 && (
            <View className="bg-indigo-50 rounded-xl p-4 mt-3 border border-indigo-100">
              <Text className="text-indigo-800 text-sm font-semibold">Resume your in-progress attempt</Text>
              <Text className="text-indigo-600 text-xs mt-1">Your previous answers are saved in the database.</Text>
            </View>
          )}

          {locked ? (
            <View className="mt-6">
              <View className="bg-indigo-50 rounded-xl p-4 mb-3 flex-row items-center">
                <Ionicons name="lock-closed" size={20} color={theme.primary} />
                <Text className="text-indigo-800 text-sm ml-2 flex-1">Premium test — unlock with SarkariRank Pass</Text>
              </View>
              <PrimaryButton title="Get Premium Pass · ₹499/yr" onPress={() => router.push("/premium")} variant="gold" />
            </View>
          ) : questionCount > 0 ? (
            <View className="mt-6">
              <PrimaryButton
                title={inProgress ? "Resume Test" : "Start Test Now"}
                onPress={handleStart}
                loading={starting}
              />
            </View>
          ) : null}
        </PremiumCard>
      </ScrollView>
    );
  }

  if (!questions.length) {
    return <EmptyScreen icon="help-circle-outline" message="No questions found in database for this test" />;
  }

  const currentQ = questions[currentIndex];
  const qText = lang === "kn" && (currentQ as any).questionTextKn ? (currentQ as any).questionTextKn : currentQ.questionText;
  const optKnById: Record<string, string> = {};
  for (const o of ((currentQ as any).optionsKn ?? []) as { id: string; text: string }[]) optKnById[o.id] = o.text;
  const rev = revealed[currentQ._id];
  const selectedId = selectedAnswers[currentQ._id];
  const explText = rev ? (lang === "kn" && rev.explanationKn ? rev.explanationKn : rev.explanation) : undefined;

  return (
    <View className="flex-1 bg-slate-50">
      <View style={{ backgroundColor: theme.primaryDark }} className="px-4 py-3 flex-row justify-between items-center">
        <Text className="text-white font-semibold">Q {currentIndex + 1}/{questions.length}</Text>
        <View className="flex-row items-center gap-2">
          {/* Language toggle */}
          <View className="flex-row bg-white/10 rounded-full p-0.5">
            <TouchableOpacity onPress={() => setLang("en")} className={`px-2.5 py-1 rounded-full ${lang === "en" ? "bg-white" : ""}`}>
              <Text className={`text-xs font-bold ${lang === "en" ? "text-indigo-700" : "text-white"}`}>EN</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setLang("kn")} className={`px-2.5 py-1 rounded-full ${lang === "kn" ? "bg-white" : ""}`}>
              <Text className={`text-xs font-bold ${lang === "kn" ? "text-indigo-700" : "text-white"}`}>ಕನ್ನಡ</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row items-center bg-white/10 px-3 py-1 rounded-full">
            <Ionicons name="time-outline" size={14} color={timeLeft < 300 ? "#FCA5A5" : "#fff"} />
            <Text className={`ml-1 font-bold text-sm ${timeLeft < 300 ? "text-red-300" : "text-white"}`}>{formatTime(timeLeft)}</Text>
          </View>
          <TouchableOpacity onPress={handleSubmit} className="bg-amber-500 px-3 py-1.5 rounded-full">
            <Text className="text-white font-bold text-xs">Submit</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        <PremiumCard className="p-5 mb-4">
          <Text className="text-slate-900 text-base leading-7">{qText}</Text>
          {currentQ.subject && (
            <View className="flex-row mt-3 gap-2">
              <Badge label={currentQ.subject} color={theme.primary} />
              {currentQ.difficulty && <Badge label={currentQ.difficulty} color="#64748B" />}
            </View>
          )}
        </PremiumCard>

        {currentQ.options.map((opt) => {
          const isSelected = selectedId === opt.id;
          const isCorrectOpt = rev && opt.id === rev.correctOptionId;
          const isWrongPick = rev && isSelected && opt.id !== rev.correctOptionId;

          // Card + circle + text styling depending on reveal state
          let cardCls = "bg-white border-slate-100";
          let circleCls = "bg-slate-100";
          let circleTextCls = "text-slate-600";
          let textCls = "text-slate-800";
          if (isCorrectOpt) {
            cardCls = "bg-emerald-50 border-emerald-500";
            circleCls = "bg-emerald-600";
            circleTextCls = "text-white";
            textCls = "text-emerald-900 font-semibold";
          } else if (isWrongPick) {
            cardCls = "bg-red-50 border-red-500";
            circleCls = "bg-red-600";
            circleTextCls = "text-white";
            textCls = "text-red-900 font-semibold";
          } else if (!rev && isSelected) {
            cardCls = "bg-indigo-50 border-indigo-500";
            circleCls = "bg-indigo-600";
            circleTextCls = "text-white";
            textCls = "text-indigo-900 font-medium";
          } else if (rev) {
            textCls = "text-slate-400";
          }

          return (
            <TouchableOpacity
              key={opt.id}
              activeOpacity={rev ? 1 : 0.7}
              disabled={!!rev}
              onPress={() => handleSelectOption(opt.id)}
              className={`rounded-2xl p-4 mb-2 border-2 ${cardCls}`}
            >
              <View className="flex-row items-center">
                <View className={`w-9 h-9 rounded-xl items-center justify-center mr-3 ${circleCls}`}>
                  <Text className={`font-bold text-sm ${circleTextCls}`}>{opt.id.toUpperCase()}</Text>
                </View>
                <Text className={`flex-1 leading-5 ${textCls}`}>{lang === "kn" && optKnById[opt.id] ? optKnById[opt.id] : opt.text}</Text>
                {isCorrectOpt && <Ionicons name="checkmark-circle" size={22} color="#059669" />}
                {isWrongPick && <Ionicons name="close-circle" size={22} color="#DC2626" />}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Instant feedback banner + explanation */}
        {rev && (
          <View className={`rounded-2xl p-4 mt-2 mb-2 ${selectedId === rev.correctOptionId ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
            <View className="flex-row items-center mb-1">
              <Ionicons
                name={selectedId === rev.correctOptionId ? "checkmark-circle" : "close-circle"}
                size={18}
                color={selectedId === rev.correctOptionId ? "#059669" : "#DC2626"}
              />
              <Text className={`ml-1.5 font-bold text-sm ${selectedId === rev.correctOptionId ? "text-emerald-700" : "text-red-700"}`}>
                {selectedId === rev.correctOptionId ? (lang === "kn" ? "ಸರಿ ಉತ್ತರ!" : "Correct!") : (lang === "kn" ? "ತಪ್ಪು ಉತ್ತರ" : "Incorrect")}
              </Text>
            </View>
            {explText ? <Text className="text-slate-600 text-sm leading-6">💡 {explText}</Text> : null}
          </View>
        )}
      </ScrollView>

      <View className="flex-row justify-between px-4 pt-4 bg-white border-t border-slate-100" style={{ paddingBottom: insets.bottom + 16 }}>
        <TouchableOpacity onPress={() => setCurrentIndex(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0}
          className={`px-5 py-3 rounded-xl ${currentIndex === 0 ? "bg-slate-100" : "bg-slate-200"}`}>
          <Text className="font-semibold text-slate-700">Prev</Text>
        </TouchableOpacity>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1 mx-2">
          {questions.map((q, idx) => (
            <TouchableOpacity key={q._id} onPress={() => setCurrentIndex(idx)}
              className={`w-8 h-8 rounded-lg items-center justify-center mr-1 ${idx === currentIndex ? "bg-indigo-600" : selectedAnswers[q._id] ? "bg-emerald-500" : "bg-slate-200"}`}>
              <Text className={`text-xs font-bold ${idx === currentIndex || selectedAnswers[q._id] ? "text-white" : "text-slate-600"}`}>{idx + 1}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity onPress={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
          disabled={currentIndex === questions.length - 1}
          className={`px-5 py-3 rounded-xl ${currentIndex === questions.length - 1 ? "bg-slate-100" : "bg-indigo-600"}`}>
          <Text className={`font-semibold ${currentIndex === questions.length - 1 ? "text-slate-400" : "text-white"}`}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

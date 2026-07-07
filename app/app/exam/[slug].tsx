import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SectionHeader, PremiumCard, Badge, LoadingScreen } from "../../components/ui";
import { TEST_TYPE_CONFIG, theme } from "../../constants/theme";

export default function ExamDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const exam = useQuery(api.exams.getExam, { slug });
  const tests = useQuery(api.exams.listTests, exam ? { examId: exam._id } : "skip");
  const testSeries = useQuery(api.exams.listTestSeries, exam ? { examId: exam._id } : "skip");
  const studyNotes = useQuery(api.content.listStudyNotes, exam ? { examId: exam._id } : "skip");

  if (exam === undefined) return <LoadingScreen message="Loading exam..." />;
  if (!exam) return <LoadingScreen message="Exam not found" />;

  return (
    <ScrollView className="flex-1 bg-slate-50" showsVerticalScrollIndicator={false}>
      <View style={{ backgroundColor: theme.primaryDark }} className="p-6 pb-8">
        <Text className="text-white text-2xl font-black">{exam.name}</Text>
        <Text className="text-indigo-200 mt-2 leading-5">{exam.description}</Text>
        <View className="flex-row mt-4 gap-2">
          <Badge label={`${exam.totalTests} Tests`} color="#fff" />
          <Badge label="English + Hindi" color="#A5B4FC" />
        </View>
      </View>

      {testSeries && testSeries.length > 0 && (
        <View className="px-4 mt-6">
          <SectionHeader title="Test Series" subtitle="Complete preparation packages" />
          {testSeries.map((series) => (
            <PremiumCard key={series._id} className="p-4 mb-3">
              <Text className="font-bold text-slate-900 text-base">{series.title}</Text>
              <Text className="text-slate-500 text-sm mt-1">{series.description}</Text>
              <View className="flex-row gap-2 mt-3">
                <Badge label={`${series.totalTests} tests`} color={theme.primary} />
                {series.price && <Badge label={`₹${series.price}`} color="#10B981" />}
                {series.isPremium && <Badge label="Premium" color="#F59E0B" />}
              </View>
            </PremiumCard>
          ))}
        </View>
      )}

      <View className="px-4 mt-2">
        <SectionHeader title={`All Tests (${tests?.length ?? 0})`} subtitle="Mock · Live · PYP · Chapter" />
        {tests?.map((test) => {
          const cfg = TEST_TYPE_CONFIG[test.type] ?? TEST_TYPE_CONFIG.mock;
          return (
            <Link key={test._id} href={`/test/${test._id}`} asChild>
              <TouchableOpacity activeOpacity={0.85}>
                <PremiumCard className="p-4 mb-2 flex-row items-center">
                  <View className="flex-1">
                    <Badge label={cfg.label} color={cfg.color} />
                    <Text className="font-semibold text-slate-900 mt-1">{test.title}</Text>
                    <Text className="text-slate-400 text-xs mt-1">
                      {test.totalQuestions} Qs · {test.durationMinutes} min · {test.attemptCount}+ attempts
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    {test.isFree && <Badge label="FREE" color="#10B981" />}
                    <Ionicons name="play-circle" size={32} color={theme.primary} />
                  </View>
                </PremiumCard>
              </TouchableOpacity>
            </Link>
          );
        })}
      </View>

      {studyNotes && studyNotes.length > 0 && (
        <View className="px-4 mt-4 mb-8">
          <SectionHeader title="Study Notes" />
          {studyNotes.map((note) => (
            <Link key={note._id} href={`/study-note/${note.slug}`} asChild>
              <TouchableOpacity activeOpacity={0.85}>
                <PremiumCard className="p-4 mb-2">
                  <Text className="font-semibold text-slate-900">{note.title}</Text>
                  <Text className="text-slate-500 text-sm mt-1" numberOfLines={2}>{note.content}</Text>
                </PremiumCard>
              </TouchableOpacity>
            </Link>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

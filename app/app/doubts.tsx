import { useState } from "react";
import { View, Text, ScrollView, TextInput, Alert } from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "../lib/auth";
import { useRouter } from "expo-router";
import { ScreenHeader, PremiumCard, Badge, PrimaryButton, EmptyScreen } from "../components/ui";
import { theme } from "../constants/theme";

export default function DoubtsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const doubts = useQuery(api.content.listDoubts, user ? { userId: user._id } : "skip");
  const submitDoubt = useMutation(api.content.submitDoubt);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user || !question.trim()) return;
    setLoading(true);
    await submitDoubt({ userId: user._id, questionText: question.trim() });
    setQuestion("");
    setLoading(false);
    Alert.alert("Submitted ✅", "Our experts will answer your doubt within 24 hours.");
  };

  return (
    <View className="flex-1 bg-slate-50">
      <ScreenHeader title="Doubt Support" subtitle="Ask anything · Get expert answers" onBack={() => router.back()} />
      <ScrollView className="p-4" showsVerticalScrollIndicator={false}>
        <PremiumCard className="p-4 mb-6">
          <Text className="font-bold text-slate-900 mb-2">Ask Your Doubt</Text>
          <TextInput
            value={question}
            onChangeText={setQuestion}
            placeholder="Type your question here... (e.g. How to solve percentage problems?)"
            multiline
            className="bg-slate-50 border border-slate-200 rounded-xl p-4 h-28 text-slate-900 text-sm"
            placeholderTextColor="#94A3B8"
          />
          <View className="mt-3">
            <PrimaryButton title="Submit Doubt" onPress={handleSubmit} loading={loading} />
          </View>
        </PremiumCard>

        <Text className="font-bold text-slate-900 mb-3 px-1">Your Doubts ({doubts?.length ?? 0})</Text>
        {doubts?.map((d) => (
          <PremiumCard key={d._id} className="p-4 mb-3">
            <View className="flex-row items-center mb-2">
              <Badge label={d.status === "answered" ? "Answered" : "Pending"} color={d.status === "answered" ? theme.success : "#F59E0B"} />
            </View>
            <Text className="text-slate-900 leading-5">{d.questionText}</Text>
            {d.answer && (
              <View className="bg-emerald-50 rounded-xl p-3 mt-3 border border-emerald-100">
                <Text className="text-emerald-800 text-xs font-bold mb-1">Expert Answer</Text>
                <Text className="text-emerald-900 text-sm leading-5">{d.answer}</Text>
              </View>
            )}
          </PremiumCard>
        ))}
        {doubts?.length === 0 && <EmptyScreen icon="chatbubble-outline" message="No doubts yet. Ask your first question above!" />}
      </ScrollView>
    </View>
  );
}

import { View, Text, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ScreenHeader, PremiumCard, Badge, LoadingScreen } from "../../components/ui";
import { theme } from "../../constants/theme";

export default function CurrentAffairScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const affairs = useQuery(api.content.listCurrentAffairs, { limit: 50 });
  const article = affairs?.find((a) => a.slug === slug);

  if (affairs === undefined) return <LoadingScreen message="Loading article..." />;

  return (
    <View className="flex-1 bg-slate-50">
      <ScreenHeader title="Current Affairs" subtitle={article?.category} onBack={() => router.back()} />
      <ScrollView className="p-4" showsVerticalScrollIndicator={false}>
        <PremiumCard className="p-5">
          <Badge label={article?.category ?? "News"} color={theme.primary} />
          <Text className="text-xl font-bold text-slate-900 mt-3 leading-7">{article?.title}</Text>
          <Text className="text-slate-400 text-xs mt-2">
            {article?.date ? new Date(article.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : ""}
          </Text>
          <View className="bg-indigo-50 rounded-xl p-4 mt-4 border border-indigo-100">
            <Text className="text-indigo-900 font-semibold leading-6">{article?.summary}</Text>
          </View>
          <Text className="text-slate-700 text-base leading-7 mt-4">{article?.content}</Text>
        </PremiumCard>
      </ScrollView>
    </View>
  );
}

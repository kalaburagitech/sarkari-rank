import { View, Text, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ScreenHeader, PremiumCard, Badge, LoadingScreen, SourceLink, DisclaimerBanner } from "../../components/ui";
import { useTheme } from "../../lib/theme";

export default function CurrentAffairScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const affairs = useQuery(api.content.listCurrentAffairs, { limit: 60 });
  const article = affairs?.find((a) => a.slug === slug);

  if (affairs === undefined) return <LoadingScreen message="Loading article..." />;

  return (
    <View className="flex-1 bg-slate-50 dark:bg-ink-bg">
      <ScreenHeader title="Current Affairs" subtitle={article?.category} onBack={() => router.back()} />
      <ScrollView className="p-4" showsVerticalScrollIndicator={false}>
        <PremiumCard className="p-5">
          <Badge label={article?.category ?? "News"} color={colors.primary} />
          <Text className="text-xl font-bold text-slate-900 dark:text-slate-50 mt-3 leading-7">{article?.title}</Text>
          <Text className="text-slate-400 dark:text-slate-500 text-xs mt-2">
            {article?.date ? new Date(article.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : ""}
          </Text>
          <View className="bg-indigo-50 dark:bg-primary-950 rounded-xl p-4 mt-4 border border-indigo-100 dark:border-primary-800">
            <Text className="text-indigo-900 dark:text-indigo-200 font-semibold leading-6">{article?.summary}</Text>
          </View>
          <Text className="text-slate-700 dark:text-slate-300 text-base leading-7 mt-4">{article?.content}</Text>

          {/* Source link (Play policy: government/news info must link to its source) */}
          {article?.sourceUrl ? (
            <View className="mt-5">
              <Text className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1.5">
                Source{article.sourceName ? ` · ${article.sourceName}` : ""}
              </Text>
              <SourceLink label="Read full article at source" url={article.sourceUrl} />
            </View>
          ) : null}
        </PremiumCard>

        <Text className="text-slate-400 dark:text-slate-500 text-xs leading-5 mt-4 px-1">
          Current affairs are aggregated from public news sources for educational use.
          Please refer to the original source and official websites for authoritative
          information.
        </Text>
        <View className="mt-3">
          <DisclaimerBanner onPress={() => router.push("/disclaimer")} />
        </View>
      </ScrollView>
    </View>
  );
}

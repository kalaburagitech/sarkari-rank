import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useRouter, Link } from "expo-router";
import { ScreenHeader, PremiumCard, Badge, LoadingScreen, EmptyScreen } from "../components/ui";
import { theme } from "../constants/theme";

const CATEGORY_COLORS: Record<string, string> = {
  Economy: "#10B981",
  Banking: "#3B82F6",
  Science: "#8B5CF6",
  Environment: "#059669",
  Education: "#F59E0B",
  Sports: "#EF4444",
  Politics: "#6366F1",
};

export default function CurrentAffairsScreen() {
  const router = useRouter();
  const affairs = useQuery(api.content.listCurrentAffairs, {});

  if (affairs === undefined) return <LoadingScreen message="Loading current affairs..." />;

  return (
    <View className="flex-1 bg-slate-50">
      <ScreenHeader title="Current Affairs" subtitle="Daily updates for competitive exams" onBack={() => router.back()} />
      <ScrollView className="p-4" showsVerticalScrollIndicator={false}>
        {affairs.map((item) => (
          <Link key={item._id} href={`/current-affair/${item.slug}`} asChild>
            <TouchableOpacity activeOpacity={0.85}>
              <PremiumCard className="p-4 mb-3">
                <View className="flex-row items-center mb-2">
                  <Badge label={item.category} color={CATEGORY_COLORS[item.category] ?? theme.primary} />
                  <Text className="text-slate-400 text-xs ml-auto">
                    {new Date(item.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </Text>
                </View>
                <Text className="font-bold text-slate-900 text-base">{item.title}</Text>
                <Text className="text-slate-500 text-sm mt-1.5 leading-5" numberOfLines={2}>{item.summary}</Text>
              </PremiumCard>
            </TouchableOpacity>
          </Link>
        ))}
        {affairs.length === 0 && <EmptyScreen icon="newspaper-outline" message="No current affairs articles yet" />}
      </ScrollView>
    </View>
  );
}

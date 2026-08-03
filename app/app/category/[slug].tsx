import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter, Link } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { PremiumCard, Badge, LoadingScreen, EmptyScreen, ScreenHeader } from "../../components/ui";
import { useTheme } from "../../lib/theme";

export default function CategoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const categories = useQuery(api.exams.listCategories, {});
  const allExams = useQuery(api.exams.listExams, {});

  const category = useMemo(
    () => categories?.find((c) => c.slug === slug),
    [categories, slug]
  );

  const exams = useMemo(
    () => (category && allExams ? allExams.filter((e) => e.categoryId === category._id) : []),
    [category, allExams]
  );

  if (categories === undefined || allExams === undefined) return <LoadingScreen message="Loading exams..." />;
  if (!category) return <LoadingScreen message="Body not found" />;

  return (
    <View className="flex-1 bg-slate-50 dark:bg-ink-bg">
      <ScreenHeader
        title={category.name}
        subtitle={`${exams.length} exam${exams.length === 1 ? "" : "s"} available`}
        onBack={() => router.back()}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ backgroundColor: colors.hero }} className="px-5 pb-5">
          <View className="flex-row items-center">
            <View style={{ backgroundColor: "#ffffff22" }} className="w-12 h-12 rounded-2xl items-center justify-center mr-3">
              <Text className="text-2xl">{category.icon}</Text>
            </View>
            <Text className="text-indigo-200 text-sm flex-1 leading-5">{category.description}</Text>
          </View>
        </View>

        <View className="px-4 pt-4">
          {exams.length === 0 ? (
            <EmptyScreen icon="school-outline" message="No exams added under this body yet. Check back soon!" />
          ) : (
            exams.map((exam) => (
              <Link key={exam._id} href={`/exam/${exam.slug}`} asChild>
                <TouchableOpacity activeOpacity={0.85}>
                  <PremiumCard className="p-4 mb-3">
                    <View className="flex-row items-center">
                      <View style={{ backgroundColor: category.color + "18" }} className="w-12 h-12 rounded-2xl items-center justify-center mr-3">
                        <Text className="text-xl">{exam.icon ?? category.icon}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="font-bold text-slate-900 dark:text-slate-50 text-base">{exam.name}</Text>
                        <Text className="text-slate-500 dark:text-slate-400 text-xs mt-0.5" numberOfLines={2}>{exam.description}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                    </View>
                    <View className="flex-row items-center mt-3 gap-2 flex-wrap">
                      <Badge label={`${exam.totalTests} Tests`} color={colors.primary} />
                      {exam.posts && exam.posts.length > 0 && (
                        <Badge label={`${exam.posts.length} post types`} color="#10B981" />
                      )}
                    </View>
                  </PremiumCard>
                </TouchableOpacity>
              </Link>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

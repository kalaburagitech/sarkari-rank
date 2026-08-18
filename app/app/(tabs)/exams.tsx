import { View, Text, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useMemo } from "react";
import { SectionHeader, PremiumCard, Badge, LoadingScreen, DisclaimerBanner } from "../../components/ui";
import { useTheme } from "../../lib/theme";

export default function ExamsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const categories = useQuery(api.exams.listCategories, {});
  const exams = useQuery(api.exams.listExams, {});

  const examCountByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of exams ?? []) map[e.categoryId] = (map[e.categoryId] ?? 0) + 1;
    return map;
  }, [exams]);

  const searchResults = useMemo(() => {
    if (!exams || !search.trim()) return [];
    const q = search.toLowerCase();
    return exams.filter((e) => e.name.toLowerCase().includes(q) || e.description.toLowerCase().includes(q));
  }, [exams, search]);

  const { karnatakaBodies, nationalBodies } = useMemo(() => {
    const ka = (categories ?? []).filter((c) => c.region === "karnataka");
    const nat = (categories ?? []).filter((c) => c.region !== "karnataka");
    return { karnatakaBodies: ka, nationalBodies: nat };
  }, [categories]);

  if (!categories || !exams) return <LoadingScreen message="Loading exams..." />;

  const renderBodyCard = (cat: (typeof categories)[number]) => (
    <Link key={cat._id} href={`/category/${cat.slug}`} asChild>
      <TouchableOpacity activeOpacity={0.85}>
        <PremiumCard className="p-4 mb-3 flex-row items-center">
          <View style={{ backgroundColor: cat.color + "18" }} className="w-14 h-14 rounded-2xl items-center justify-center mr-3">
            <Text className="text-2xl">{cat.icon}</Text>
          </View>
          <View className="flex-1">
            <Text className="font-bold text-slate-900 dark:text-slate-50 text-base" numberOfLines={1}>{cat.name}</Text>
            <Text className="text-slate-500 dark:text-slate-400 text-xs mt-0.5" numberOfLines={2}>{cat.description}</Text>
            <View className="flex-row items-center mt-2">
              <Badge label={`${examCountByCategory[cat._id] ?? 0} exams`} color={cat.color} />
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
        </PremiumCard>
      </TouchableOpacity>
    </Link>
  );

  return (
    <View className="flex-1 bg-slate-50 dark:bg-ink-bg">
      <ScrollView stickyHeaderIndices={[0]} showsVerticalScrollIndicator={false}>
        <View className="bg-slate-50 dark:bg-ink-bg px-4 pt-3 pb-2">
          <View className="flex-row items-center bg-white dark:bg-ink-card rounded-2xl px-4 py-3 border border-slate-100 dark:border-slate-800 mb-2">
            <Ionicons name="search" size={18} color="#94A3B8" />
            <TextInput placeholder="Search exams (KAS, FDA, PDO, PSI...)" value={search} onChangeText={setSearch}
              className="flex-1 ml-3 text-slate-900 dark:text-slate-50 text-sm" placeholderTextColor="#94A3B8" />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={18} color="#CBD5E1" />
              </TouchableOpacity>
            )}
          </View>
          <Text className="text-slate-500 dark:text-slate-400 text-xs px-1">
            {categories.length} bodies · {exams.length} exams · Karnataka + All-India
          </Text>
        </View>

        <View className="px-4 pb-10">
          <View className="mt-2 mb-1">
            <DisclaimerBanner onPress={() => router.push("/disclaimer")} />
          </View>
          {/* Search results */}
          {search.trim().length > 0 ? (
            <View className="mt-2">
              <SectionHeader title="Search Results" subtitle={`${searchResults.length} exam(s) found`} />
              {searchResults.length === 0 ? (
                <Text className="text-slate-400 dark:text-slate-400 text-sm px-1 py-6 text-center">No exams match "{search}".</Text>
              ) : (
                searchResults.map((exam) => (
                  <Link key={exam._id} href={`/exam/${exam.slug}`} asChild>
                    <TouchableOpacity activeOpacity={0.85}>
                      <PremiumCard className="p-4 mb-2 flex-row items-center">
                        <View style={{ backgroundColor: colors.primary + "15" }} className="w-11 h-11 rounded-2xl items-center justify-center mr-3">
                          <Text className="text-lg">{exam.icon ?? "📘"}</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="font-bold text-slate-900 dark:text-slate-50 text-sm">{exam.name}</Text>
                          <Text className="text-slate-500 dark:text-slate-400 text-xs mt-0.5" numberOfLines={1}>{exam.description}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
                      </PremiumCard>
                    </TouchableOpacity>
                  </Link>
                ))
              )}
            </View>
          ) : (
            <>
              {/* Karnataka bodies on top */}
              {karnatakaBodies.length > 0 && (
                <View className="mt-3">
                  <SectionHeader title="🏛️ Karnataka State Exams" subtitle="KPSC · KEA · Police · KPTCL & more" />
                  {karnatakaBodies.map(renderBodyCard)}
                </View>
              )}

              {/* National / All-India bodies */}
              {nationalBodies.length > 0 && (
                <View className="mt-4">
                  <SectionHeader title="🇮🇳 National / All-India Exams" subtitle="SSC · Banking · Railway · UPSC & more" />
                  {nationalBodies.map(renderBodyCard)}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

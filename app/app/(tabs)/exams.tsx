import { View, Text, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useMemo } from "react";
import { SectionHeader, PremiumCard, Badge, LoadingScreen } from "../../components/ui";
import { theme } from "../../constants/theme";

export default function ExamsScreen() {
  const { category } = useLocalSearchParams<{ category?: string }>();
  const [search, setSearch] = useState("");
  const categories = useQuery(api.exams.listCategories, {});
  const exams = useQuery(api.exams.listExams, {});

  const filteredCategories = category ? categories?.filter((c) => c.slug === category) : categories;

  const filteredExams = useMemo(() => {
    if (!exams || !search) return exams ?? [];
    return exams.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));
  }, [exams, search]);

  if (!categories || !exams) return <LoadingScreen message="Loading exams..." />;

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView stickyHeaderIndices={[0]} showsVerticalScrollIndicator={false}>
        <View className="bg-slate-50 px-4 pt-3 pb-2">
          <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 border border-slate-100 mb-2">
            <Ionicons name="search" size={18} color="#94A3B8" />
            <TextInput placeholder="Search exams..." value={search} onChangeText={setSearch}
              className="flex-1 ml-3 text-slate-900 text-sm" placeholderTextColor="#94A3B8" />
          </View>
          <Text className="text-slate-500 text-xs px-1">{exams.length} Exams · SSC · Banking · Railway · UPSC</Text>
        </View>

        <View className="px-4 pb-8">
          {filteredCategories?.map((cat) => {
            const catExams = filteredExams.filter((e) => e.categoryId === cat._id);
            if (catExams.length === 0) return null;

            return (
              <View key={cat._id} className="mb-6">
                <SectionHeader title={`${cat.icon} ${cat.name}`} subtitle={`${catExams.length} exams available`} />
                {catExams.map((exam) => (
                  <Link key={exam._id} href={`/exam/${exam.slug}`} asChild>
                    <TouchableOpacity activeOpacity={0.85}>
                      <PremiumCard className="p-4 mb-3 flex-row items-center">
                        <View style={{ backgroundColor: theme.primary + "15" }} className="w-12 h-12 rounded-2xl items-center justify-center mr-3">
                          <Text className="text-xl">{cat.icon}</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="font-bold text-slate-900 text-base">{exam.name}</Text>
                          <Text className="text-slate-500 text-xs mt-0.5" numberOfLines={2}>{exam.description}</Text>
                          <View className="flex-row items-center mt-2 gap-2">
                            <Badge label={`${exam.totalTests} Tests`} color={theme.primary} />
                          </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                      </PremiumCard>
                    </TouchableOpacity>
                  </Link>
                ))}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

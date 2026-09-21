import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { api } from "../convex/_generated/api";
import { useCached } from "../lib/offline";
import { useBookmarks } from "../lib/bookmarks";
import { useAuth } from "../lib/auth";
import { useRouter, Link } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ScreenHeader, PremiumCard, EmptyScreen, LoadingScreen } from "../components/ui";
import { useTheme } from "../lib/theme";

export default function BookmarksScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  const { bookmarks } = useBookmarks(user?._id);
  const tests = useCached<any[]>("tests", api.exams.listTests, { view: "lite" }, ["tests"]);

  const getTestTitle = (testId: string) => tests?.find((t) => t._id === testId)?.title ?? "Saved Test";

  return (
    <View className="flex-1 bg-slate-50 dark:bg-ink-bg">
      <ScreenHeader title="Saved Items" subtitle={`${bookmarks.length} bookmarks`} onBack={() => router.back()} />
      <ScrollView className="p-4" showsVerticalScrollIndicator={false}>
        {bookmarks.map((b) => (
          <PremiumCard key={`${b.type}:${b.testId ?? b.questionId}`} className="p-4 mb-2 flex-row items-center">
            <View style={{ backgroundColor: colors.primary + "15" }} className="w-10 h-10 rounded-xl items-center justify-center mr-3">
              <Ionicons name={b.type === "test" ? "document-text" : "help-circle"} size={20} color={colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-slate-900 dark:text-slate-50">
                {b.type === "test" && b.testId ? getTestTitle(b.testId) : "Saved Question"}
              </Text>
              <Text className="text-slate-400 dark:text-slate-400 text-xs mt-0.5 capitalize">{b.type} bookmark</Text>
            </View>
            {b.testId && (
              <Link href={`/test/${b.testId}`} asChild>
                <TouchableOpacity className="bg-indigo-50 px-3 py-1.5 rounded-full">
                  <Text className="text-indigo-600 text-xs font-bold">Open</Text>
                </TouchableOpacity>
              </Link>
            )}
          </PremiumCard>
        ))}
        {bookmarks.length === 0 && (
          <EmptyScreen icon="bookmark-outline" message="Bookmark tests while browsing to save them here" />
        )}
      </ScrollView>
    </View>
  );
}

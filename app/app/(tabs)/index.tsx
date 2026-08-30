import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../../lib/auth";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SectionHeader, PremiumCard, Badge, StatBox, LoadingScreen, DisclaimerBanner } from "../../components/ui";
import { useRouter } from "expo-router";
import { useTheme } from "../../lib/theme";

export default function HomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const categories = useQuery(api.exams.listCategories, {});
  const exams = useQuery(api.exams.listExams, {});
  const tests = useQuery(api.exams.listTests, {});
  const dailyQuiz = useQuery(api.content.getDailyQuiz, {});
  const currentAffairs = useQuery(api.content.listCurrentAffairs, { limit: 5 });
  const notifications = useQuery(api.content.listNotifications, user ? { userId: user._id } : "skip");
  const analytics = useQuery(api.attempts.getPerformanceAnalytics, user ? { userId: user._id } : "skip");
  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  if (!categories || !tests || !exams) return <LoadingScreen message="Loading SarkariRank..." />;

  const popularTests = tests.filter((t) => t.isFree).slice(0, 4);
  const liveTests = tests.filter((t) => t.type === "live").slice(0, 3);

  return (
    <ScrollView className="flex-1 bg-slate-50 dark:bg-ink-bg" showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={{ backgroundColor: colors.hero }} className="px-5 pt-5 pb-10">
        <View className="flex-row justify-between items-start">
          <View className="flex-1 mr-3">
            <Text className="text-indigo-300 text-sm font-medium">Welcome back 👋</Text>
            <Text className="text-white text-2xl font-bold mt-1">{user?.name ?? "Aspirant"}</Text>
            <Text className="text-indigo-200 text-sm mt-1">Karnataka · KPSC · KEA · Police · SSC · Banking</Text>
          </View>
          <View className="flex-row items-center">
          {user?.isPremium ? (
            <View className="bg-amber-500/25 px-3 py-1.5 rounded-full border border-amber-400/30">
              <Text className="text-amber-300 text-xs font-bold">⭐ PREMIUM</Text>
            </View>
          ) : (
            <Link href="/premium" asChild>
              <TouchableOpacity className="bg-amber-500 px-3 py-1.5 rounded-full">
                <Text className="text-white text-xs font-bold">Get Pass</Text>
              </TouchableOpacity>
            </Link>
          )}
          <Link href="/notifications" asChild>
            <TouchableOpacity className="ml-2 w-10 h-10 rounded-xl bg-white/10 items-center justify-center">
              <Ionicons name="notifications-outline" size={22} color="#fff" />
              {unreadCount > 0 && (
                <View className="absolute -top-1 -right-1 bg-red-500 w-4 h-4 rounded-full items-center justify-center">
                  <Text className="text-white text-[10px] font-bold">{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </Link>
          </View>
        </View>
      </View>

      {/* Stats card */}
      <PremiumCard className="mx-4 -mt-6 p-1 flex-row">
        <StatBox icon="document-text" value={user?.totalTestsTaken ?? 0} label="Tests Taken" color={colors.primary} />
        <View className="w-px bg-slate-100 dark:bg-slate-800 my-3" />
        <StatBox icon="flame" value={`${user?.streak ?? 0}d`} label="Streak" color="#F59E0B" />
        <View className="w-px bg-slate-100 dark:bg-slate-800 my-3" />
        <StatBox icon="trophy" value={analytics?.bestRank ? `#${analytics.bestRank}` : "—"} label="Best Rank" color="#10B981" />
      </PremiumCard>

      {/* Platform stats banner */}
      <View className="mx-4 mt-4 bg-indigo-600 rounded-2xl p-4 flex-row justify-around">
        {[{ v: tests.length, l: "Tests" }, { v: categories.length, l: "Categories" }, { v: exams?.length ?? 0, l: "Exams" }].map((s) => (
          <View key={s.l} className="items-center">
            <Text className="text-white text-xl font-bold">{s.v}</Text>
            <Text className="text-indigo-200 text-xs">{s.l}</Text>
          </View>
        ))}
      </View>

      {/* Daily Quiz */}
      {dailyQuiz?.test && (
        <View className="mx-4 mt-6">
          <SectionHeader title="📅 Today's Daily Quiz" />
          <Link href={`/test/${dailyQuiz.test._id}`} asChild>
            <TouchableOpacity activeOpacity={0.9}>
              <View style={{ backgroundColor: colors.primary }} className="rounded-2xl p-5 flex-row items-center justify-between">
                <View className="flex-1">
                  <Badge label="FREE" color="#fff" />
                  <Text className="text-white font-bold text-base mt-2">{dailyQuiz.test.title}</Text>
                  <Text className="text-indigo-200 text-sm mt-1">{dailyQuiz.test.totalQuestions} Qs · {dailyQuiz.test.durationMinutes} min</Text>
                </View>
                <View className="bg-white/20 w-14 h-14 rounded-2xl items-center justify-center">
                  <Ionicons name="play" size={28} color="#fff" />
                </View>
              </View>
            </TouchableOpacity>
          </Link>
        </View>
      )}

      {/* Live Tests */}
      {liveTests.length > 0 && (
        <View className="mx-4 mt-6">
          <SectionHeader title="Live Tests" subtitle="Compete in real time" action={
            <Link href="/(tabs)/tests?type=live" asChild><TouchableOpacity><Text className="text-indigo-600 text-sm font-semibold">View All</Text></TouchableOpacity></Link>
          } />
          {liveTests.map((test) => (
            <Link key={test._id} href={`/test/${test._id}`} asChild>
              <TouchableOpacity className="mb-2.5" activeOpacity={0.9}>
                <View className="rounded-2xl p-4 flex-row items-center" style={{ backgroundColor: "#4F46E5", shadowColor: "#4F46E5", shadowOpacity: 0.3, shadowRadius: 12, elevation: 4 }}>
                  <View className="w-12 h-12 rounded-2xl items-center justify-center mr-3" style={{ backgroundColor: "#FFFFFF25" }}>
                    <Ionicons name="radio" size={22} color="#fff" />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                      <View className="bg-red-500 px-2 py-0.5 rounded-full flex-row items-center">
                        <View className="w-1.5 h-1.5 rounded-full bg-white mr-1" />
                        <Text className="text-white text-[10px] font-black" style={{ letterSpacing: 0.5 }}>LIVE</Text>
                      </View>
                    </View>
                    <Text className="text-white font-bold mt-1" numberOfLines={1}>{test.title}</Text>
                    <Text className="text-indigo-100 text-xs mt-0.5">{test.totalQuestions} Qs · {test.durationMinutes} min · {test.attemptCount}+ playing</Text>
                  </View>
                  <View className="w-9 h-9 rounded-full items-center justify-center ml-2" style={{ backgroundColor: "#FFFFFF2E" }}>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </View>
                </View>
              </TouchableOpacity>
            </Link>
          ))}
        </View>
      )}

      {/* Karnataka Exams */}
      {categories?.some((c) => c.region === "karnataka") && (
        <View className="mx-4 mt-6">
          <SectionHeader title="🏛️ Karnataka Exams" subtitle="KPSC · KEA · Police & more" action={
            <Link href="/(tabs)/exams" asChild><TouchableOpacity><Text className="text-indigo-600 text-sm font-semibold">View All</Text></TouchableOpacity></Link>
          } />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.filter((c) => c.region === "karnataka").map((cat) => (
              <Link key={cat._id} href={`/category/${cat.slug}`} asChild>
                <TouchableOpacity className="mr-3 w-36">
                  <PremiumCard className="p-4">
                    <Text className="text-3xl mb-2">{cat.icon}</Text>
                    <Text className="font-bold text-slate-900 dark:text-slate-50 text-sm" numberOfLines={1}>{cat.name.split("—")[0].trim()}</Text>
                    <Text className="text-slate-400 dark:text-slate-400 text-xs mt-1" numberOfLines={2}>{cat.description}</Text>
                  </PremiumCard>
                </TouchableOpacity>
              </Link>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Popular Exam Bodies */}
      <View className="mx-4 mt-6">
        <SectionHeader title="Popular Exams" action={
          <Link href="/(tabs)/exams" asChild><TouchableOpacity><Text className="text-indigo-600 text-sm font-semibold">View All</Text></TouchableOpacity></Link>
        } />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories?.filter((c) => c.isPopular).map((cat) => (
            <Link key={cat._id} href={`/category/${cat.slug}`} asChild>
              <TouchableOpacity className="mr-3 w-36">
                <PremiumCard className="p-4" >
                  <Text className="text-3xl mb-2">{cat.icon}</Text>
                  <Text className="font-bold text-slate-900 text-sm" numberOfLines={1}>{cat.name.split("—")[0].trim()}</Text>
                  <Text className="text-slate-400 text-xs mt-1" numberOfLines={2}>{cat.description}</Text>
                </PremiumCard>
              </TouchableOpacity>
            </Link>
          ))}
        </ScrollView>
      </View>

      {/* Free Mock Tests */}
      <View className="mx-4 mt-6">
        <SectionHeader title="Free Mock Tests" subtitle="Start practicing now" />
        {popularTests.map((test) => (
          <Link key={test._id} href={`/test/${test._id}`} asChild>
            <TouchableOpacity className="mb-2">
              <PremiumCard className="p-4 flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="font-semibold text-slate-900 dark:text-slate-50">{test.title}</Text>
                  <Text className="text-slate-400 dark:text-slate-400 text-xs mt-0.5">{test.totalQuestions} Qs · {test.durationMinutes} min · {test.attemptCount}+ attempts</Text>
                </View>
                <View className="bg-emerald-500 px-3 py-1.5 rounded-xl"><Text className="text-white text-xs font-bold">FREE</Text></View>
              </PremiumCard>
            </TouchableOpacity>
          </Link>
        ))}
      </View>

      {/* Quick Access Grid */}
      <View className="mx-4 mt-4">
        <SectionHeader title="Quick Access" />
        <View className="flex-row flex-wrap gap-3">
          {[
            { t: "Practice", i: "school", c: "#7C3AED", h: "/practice" },
            { t: "Mock Tests", i: "clipboard", c: "#4F46E5", h: "/(tabs)/tests?type=mock" },
            { t: "PYP Papers", i: "archive", c: "#F59E0B", h: "/previous-year-papers" },
            { t: "Study Notes", i: "book", c: "#8B5CF6", h: "/study-notes" },
            { t: "Current Affairs", i: "newspaper", c: "#059669", h: "/current-affairs" },
            { t: "Leaderboard", i: "podium", c: "#EC4899", h: "/leaderboard" },
            { t: "Doubts", i: "chatbubble", c: "#10B981", h: "/doubts" },
            { t: "Bookmarks", i: "bookmark", c: "#06B6D4", h: "/bookmarks" },
          ].map((item) => (
            <Link key={item.t} href={item.h as any} asChild>
              <TouchableOpacity className="w-[30%]">
                <PremiumCard className="p-3 items-center py-4">
                  <View style={{ backgroundColor: item.c + "18" }} className="w-10 h-10 rounded-xl items-center justify-center mb-2">
                    <Ionicons name={item.i as any} size={20} color={item.c} />
                  </View>
                  <Text className="text-xs font-semibold text-slate-700 dark:text-slate-200 text-center">{item.t}</Text>
                </PremiumCard>
              </TouchableOpacity>
            </Link>
          ))}
        </View>
      </View>

      {/* Current Affairs */}
      {currentAffairs && currentAffairs.length > 0 && (
        <View className="mx-4 mt-6 mb-8">
          <SectionHeader title="📰 Current Affairs" action={
            <Link href="/current-affairs" asChild><TouchableOpacity><Text className="text-indigo-600 text-sm font-semibold">View All</Text></TouchableOpacity></Link>
          } />
          {currentAffairs.map((affair) => (
            <Link key={affair._id} href={`/current-affair/${affair.slug}`} asChild>
              <TouchableOpacity className="mb-2">
                <PremiumCard className="p-4">
                  <View className="flex-row justify-between items-start">
                    <Text className="font-semibold text-slate-900 dark:text-slate-50 flex-1 mr-2">{affair.title}</Text>
                    <Badge label={affair.category} color={colors.primary} />
                  </View>
                  <Text className="text-slate-500 dark:text-slate-400 text-sm mt-1">{affair.summary}</Text>
                </PremiumCard>
              </TouchableOpacity>
            </Link>
          ))}
        </View>
      )}

      {/* Compliance footer */}
      <View className="mx-4 mt-2 mb-8">
        <DisclaimerBanner onPress={() => router.push("/disclaimer")} />
      </View>
    </ScrollView>
  );
}

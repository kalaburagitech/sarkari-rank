import { SELL_PASS } from "../../constants/features";
import { Touchable } from "../../components/Touchable";
import { View, Text, ScrollView } from "react-native";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useCached } from "../../lib/offline";
import { useAuth } from "../../lib/auth";
import { Link } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { SectionHeader, PremiumCard, Badge, LoadingScreen, DisclaimerBanner } from "../../components/ui";
import { HeroBackground } from "../../components/Gradient";
import { LogoRow } from "../../components/Logo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { palette } from "../../constants/theme";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useAllProgress, latestUnfinished } from "../../lib/progress";

const LIVE_GRADIENT = [palette.primary[700], palette.primary[500]] as const;
const GOLD_HERO = [palette.accent[400], palette.accent[500], palette.accent[600]] as const;

const QUICK = [
  { t: "Practice", i: "school", c: "#7C3AED", h: "/practice" },
  { t: "Mock Tests", i: "clipboard", c: "#1A49A3", h: "/(tabs)/tests?type=mock" },
  { t: "PYQ Papers", i: "archive", c: "#D48A00", h: "/previous-year-papers" },
  { t: "Notes", i: "book", c: "#0EA5E9", h: "/study-notes" },
  { t: "Affairs", i: "newspaper", c: "#059669", h: "/current-affairs" },
  { t: "Leaderboard", i: "podium", c: "#EC4899", h: "/leaderboard" },
  { t: "Doubts", i: "chatbubbles", c: "#10B981", h: "/doubts" },
  { t: "Bookmarks", i: "bookmark", c: "#06B6D4", h: "/bookmarks" },
];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}
import { useRouter } from "expo-router";
import { useTheme } from "../../lib/theme";

export default function HomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const resume = latestUnfinished(useAllProgress());
  const categories = useCached<any[]>("categories", api.exams.listCategories, {}, ["categories"]);
  const exams = useCached<any[]>("exams", api.exams.listExams, { view: "lite" }, ["exams"]);
  const tests = useCached<any[]>("tests", api.exams.listTests, { view: "lite" }, ["tests"]);
  const dailyQuiz = useCached<any>("dailyQuiz", api.content.getDailyQuiz, {}, ["dailyQuiz"]);
  const currentAffairs = useCached<any[]>("affairs:home", api.content.listCurrentAffairs, { limit: 5, view: "lite" }, ["currentAffairs"]);
  const notifications = useCached<any[]>(`notifications:${user?._id}`, api.content.listNotifications, user ? { userId: user._id } : "skip", ["notifications"]);
  const analytics = useCached<any>(`analytics:${user?._id}`, api.attempts.getPerformanceAnalytics, user ? { userId: user._id } : "skip", []);
  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  if (!categories || !tests || !exams) return <LoadingScreen message="Loading Astra..." />;

  const popularTests = tests.filter((t) => t.isFree).slice(0, 4);
  const liveTests = tests.filter((t) => t.type === "live").slice(0, 3);

  return (
    <ScrollView className="flex-1 bg-slate-50 dark:bg-ink-bg" showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <HeroBackground style={{ paddingTop: insets.top + 12 }} className="px-5 pb-16 rounded-b-[32px]">
        <View className="flex-row justify-between items-center">
          <LogoRow size={36} subtitle="ನಿಮ್ಮ ಯಶಸ್ಸಿನ ಅಸ್ತ್ರ" />
          <View className="flex-row items-center">
            {!SELL_PASS ? null : user?.isPremium ? (
              <View className="bg-amber-400/20 px-3 py-1.5 rounded-full border border-amber-300/40 flex-row items-center">
                <Ionicons name="diamond" size={12} color="#FCD34D" />
                <Text className="text-amber-200 text-xs font-bold ml-1">PASS</Text>
              </View>
            ) : (
              <Link href="/premium" asChild>
                <Touchable className="bg-accent-500 px-3 py-1.5 rounded-full flex-row items-center">
                  <Ionicons name="diamond" size={12} color="#fff" />
                  <Text className="text-white text-xs font-bold ml-1">Get Pass</Text>
                </Touchable>
              </Link>
            )}
            <Link href="/notifications" asChild>
              <Touchable accessibilityLabel="Notifications" className="ml-2 w-10 h-10 rounded-2xl bg-white/15 border border-white/10 items-center justify-center">
                <Ionicons name="notifications-outline" size={20} color="#fff" />
                {unreadCount > 0 && (
                  <View className="absolute -top-1 -right-1 bg-red-500 min-w-4 h-4 px-1 rounded-full items-center justify-center border border-white">
                    <Text className="text-white text-[9px] font-bold">{unreadCount}</Text>
                  </View>
                )}
              </Touchable>
            </Link>
          </View>
        </View>

        <Text className="text-primary-200 text-sm font-medium mt-6">{greeting()} 👋</Text>
        <Text className="text-white text-[26px] font-extrabold tracking-tight mt-0.5" numberOfLines={1}>{user?.name ?? "Aspirant"}</Text>
        <Text className="text-primary-200 text-xs mt-1">KPSC · KEA · Police · SSC · Banking · Railways</Text>

        {/* Glass stats */}
        <View className="flex-row mt-5 bg-white/10 border border-white/10 rounded-2xl py-3">
          {[
            { v: user?.totalTestsTaken ?? 0, l: "Tests taken", i: "document-text" },
            { v: `${user?.streak ?? 0}d`, l: "Streak", i: "flame" },
            { v: analytics?.bestRank ? `#${analytics.bestRank}` : "—", l: "Best rank", i: "trophy" },
          ].map((st, i) => (
            <View key={st.l} className={`flex-1 items-center ${i ? "border-l border-white/10" : ""}`}>
              <View className="flex-row items-center">
                <Ionicons name={st.i as any} size={14} color="#FFBA2E" />
                <Text className="text-white text-lg font-extrabold ml-1.5">{st.v}</Text>
              </View>
              <Text className="text-primary-200 text-[11px] mt-0.5">{st.l}</Text>
            </View>
          ))}
        </View>
      </HeroBackground>

      {/* Hero card — floats over the hero: resume practice > daily quiz > practice */}
      <Animated.View entering={FadeInDown.duration(450)} className="mx-4 -mt-10">
        {resume ? (
          <Link href={`/practice-chapter/${resume.chapterId}` as any} asChild>
            <Touchable>
              <PremiumCard className="p-5">
                <View className="flex-row items-center">
                  <View className="flex-1 pr-3">
                    <Text className="text-[11px] font-extrabold tracking-wider text-accent-600">CONTINUE WHERE YOU LEFT OFF</Text>
                    <Text className="text-slate-900 dark:text-slate-50 font-extrabold text-base mt-1" numberOfLines={1}>{resume.chapterName}</Text>
                    {resume.subjectName ? <Text className="text-slate-500 dark:text-slate-400 text-xs mt-0.5" numberOfLines={1}>{resume.subjectName}</Text> : null}
                  </View>
                  <View style={{ backgroundColor: colors.primary }} className="w-12 h-12 rounded-2xl items-center justify-center">
                    <Ionicons name="play" size={22} color="#fff" />
                  </View>
                </View>
                {(() => {
                  const done = Object.keys(resume.answers).length;
                  const pct = Math.round((done / Math.max(1, resume.total)) * 100);
                  return (
                    <View className="mt-4">
                      <View className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <View style={{ width: `${pct}%`, backgroundColor: colors.primary }} className="h-full rounded-full" />
                      </View>
                      <View className="flex-row justify-between mt-1.5">
                        <Text className="text-xs text-slate-500 dark:text-slate-400">{done} of {resume.total} answered</Text>
                        <Text className="text-xs font-bold" style={{ color: resume.correct / Math.max(1, done) >= 0.6 ? colors.success : colors.warning }}>{Math.round((resume.correct / Math.max(1, done)) * 100)}% accuracy</Text>
                      </View>
                    </View>
                  );
                })()}
              </PremiumCard>
            </Touchable>
          </Link>
        ) : dailyQuiz?.test ? (
          <Link href={`/test/${dailyQuiz.test._id}`} asChild>
            <Touchable activeOpacity={0.9}>
              <HeroBackground colors={GOLD_HERO} className="rounded-3xl p-5 flex-row items-center" style={{ elevation: 6 }}>
                <View className="flex-1 pr-3">
                  <View className="bg-white/25 self-start px-2.5 py-1 rounded-full">
                    <Text className="text-white text-[10px] font-extrabold tracking-wider">TODAY&apos;S DAILY QUIZ · FREE</Text>
                  </View>
                  <Text className="text-white font-extrabold text-lg mt-2" numberOfLines={2}>{dailyQuiz.test.title}</Text>
                  <Text className="text-white/85 text-xs mt-1">{dailyQuiz.test.totalQuestions} questions · {dailyQuiz.test.durationMinutes} min</Text>
                </View>
                <View className="bg-white w-14 h-14 rounded-2xl items-center justify-center">
                  <Ionicons name="play" size={26} color="#D48A00" />
                </View>
              </HeroBackground>
            </Touchable>
          </Link>
        ) : (
          <Link href={"/practice" as any} asChild>
            <Touchable activeOpacity={0.9}>
              <PremiumCard className="p-5 flex-row items-center">
                <View className="flex-1 pr-3">
                  <Text className="text-slate-900 dark:text-slate-50 font-extrabold text-base">Practice by subject</Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-xs mt-1">Chapter-wise questions with instant answers</Text>
                </View>
                <View style={{ backgroundColor: colors.primary }} className="w-12 h-12 rounded-2xl items-center justify-center">
                  <Ionicons name="arrow-forward" size={22} color="#fff" />
                </View>
              </PremiumCard>
            </Touchable>
          </Link>
        )}
      </Animated.View>

      {/* Daily quiz gets its own spot when "continue" took the hero card */}
      {resume && dailyQuiz?.test ? (
        <Animated.View entering={FadeInDown.delay(80).duration(450)} className="mx-4 mt-4">
          <Link href={`/test/${dailyQuiz.test._id}`} asChild>
            <Touchable activeOpacity={0.9}>
              <HeroBackground colors={GOLD_HERO} className="rounded-3xl p-5 flex-row items-center" style={{ elevation: 6 }}>
                <View className="flex-1 pr-3">
                  <View className="bg-white/25 self-start px-2.5 py-1 rounded-full">
                    <Text className="text-white text-[10px] font-extrabold tracking-wider">TODAY&apos;S DAILY QUIZ · FREE</Text>
                  </View>
                  <Text className="text-white font-extrabold text-lg mt-2" numberOfLines={2}>{dailyQuiz.test.title}</Text>
                  <Text className="text-white/85 text-xs mt-1">{dailyQuiz.test.totalQuestions} questions · {dailyQuiz.test.durationMinutes} min</Text>
                </View>
                <View className="bg-white w-14 h-14 rounded-2xl items-center justify-center">
                  <Ionicons name="play" size={26} color="#D48A00" />
                </View>
              </HeroBackground>
            </Touchable>
          </Link>
        </Animated.View>
      ) : null}

      {/* Quick Access */}
      <Animated.View entering={FadeInDown.delay(120).duration(450)} className="mx-4 mt-6">
        <SectionHeader title="Quick Access" />
        <PremiumCard className="py-4 px-2 flex-row flex-wrap">
          {QUICK.map((item) => (
            <Link key={item.t} href={item.h as any} asChild>
              <Touchable className="w-1/4 items-center mb-3" activeOpacity={0.7}>
                <View style={{ backgroundColor: item.c + "16" }} className="w-12 h-12 rounded-2xl items-center justify-center mb-1.5">
                  <Ionicons name={item.i as any} size={22} color={item.c} />
                </View>
                <Text className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 text-center" numberOfLines={1}>{item.t}</Text>
              </Touchable>
            </Link>
          ))}
        </PremiumCard>
      </Animated.View>

      {/* Live Tests */}
      {liveTests.length > 0 && (
        <View className="mx-4 mt-6">
          <SectionHeader title="Live Tests" subtitle="Compete in real time" action={
            <Link href="/(tabs)/tests?type=live" asChild><Touchable><Text className="text-primary-600 dark:text-primary-300 text-[13px] font-bold">View all →</Text></Touchable></Link>
          } />
          {liveTests.map((test) => (
            <Link key={test._id} href={`/test/${test._id}`} asChild>
              <Touchable className="mb-2.5" activeOpacity={0.9}>
                <HeroBackground colors={LIVE_GRADIENT} glow={false} className="rounded-2xl p-4 flex-row items-center">
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
                </HeroBackground>
              </Touchable>
            </Link>
          ))}
        </View>
      )}

      {/* Karnataka Exams */}
      {categories?.some((c) => c.region === "karnataka") && (
        <View className="mx-4 mt-6">
          <SectionHeader title="🏛️ Karnataka Exams" subtitle="KPSC · KEA · Police & more" action={
            <Link href="/(tabs)/exams" asChild><Touchable><Text className="text-primary-600 dark:text-primary-300 text-[13px] font-bold">View all →</Text></Touchable></Link>
          } />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.filter((c) => c.region === "karnataka").map((cat) => (
              <Link key={cat._id} href={`/category/${cat.slug}`} asChild>
                <Touchable className="mr-3 w-36">
                  <PremiumCard className="p-4">
                    <Text className="text-3xl mb-2">{cat.icon}</Text>
                    <Text className="font-bold text-slate-900 dark:text-slate-50 text-sm" numberOfLines={1}>{cat.name.split("—")[0].trim()}</Text>
                    <Text className="text-slate-400 dark:text-slate-400 text-xs mt-1" numberOfLines={2}>{cat.description}</Text>
                  </PremiumCard>
                </Touchable>
              </Link>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Popular Exam Bodies */}
      <View className="mx-4 mt-6">
        <SectionHeader title="Popular Exams" action={
          <Link href="/(tabs)/exams" asChild><Touchable><Text className="text-primary-600 dark:text-primary-300 text-[13px] font-bold">View all →</Text></Touchable></Link>
        } />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories?.filter((c) => c.isPopular && c.region !== "karnataka").map((cat) => (
            <Link key={cat._id} href={`/category/${cat.slug}`} asChild>
              <Touchable className="mr-3 w-36">
                <PremiumCard className="p-4" >
                  <Text className="text-3xl mb-2">{cat.icon}</Text>
                  <Text className="font-bold text-slate-900 text-sm" numberOfLines={1}>{cat.name.split("—")[0].trim()}</Text>
                  <Text className="text-slate-400 text-xs mt-1" numberOfLines={2}>{cat.description}</Text>
                </PremiumCard>
              </Touchable>
            </Link>
          ))}
        </ScrollView>
      </View>

      {/* Free Mock Tests */}
      <View className="mx-4 mt-6">
        <SectionHeader title="Free Mock Tests" subtitle="Start practicing now" />
        {popularTests.map((test) => (
          <Link key={test._id} href={`/test/${test._id}`} asChild>
            <Touchable className="mb-2">
              <PremiumCard className="p-3.5 flex-row items-center">
                <View style={{ backgroundColor: colors.primary + "14" }} className="w-12 h-12 rounded-2xl items-center justify-center mr-3">
                  <Ionicons name="clipboard" size={22} color={colors.primary} />
                </View>
                <View className="flex-1 mr-2">
                  <Text className="font-bold text-slate-900 dark:text-slate-50" numberOfLines={1}>{test.title}</Text>
                  <View className="flex-row items-center mt-1">
                    <View className="bg-emerald-500/15 px-1.5 py-0.5 rounded-md mr-2">
                      <Text className="text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold">FREE</Text>
                    </View>
                    <Text className="text-slate-400 text-xs" numberOfLines={1}>{test.totalQuestions} Qs · {test.durationMinutes} min · {test.attemptCount}+ taken</Text>
                  </View>
                </View>
                <View style={{ backgroundColor: colors.primary }} className="w-9 h-9 rounded-full items-center justify-center">
                  <Ionicons name="play" size={16} color="#fff" />
                </View>
              </PremiumCard>
            </Touchable>
          </Link>
        ))}
      </View>

      {/* Current Affairs */}
      {currentAffairs && currentAffairs.length > 0 && (
        <View className="mx-4 mt-6 mb-8">
          <SectionHeader title="📰 Current Affairs" action={
            <Link href="/current-affairs" asChild><Touchable><Text className="text-primary-600 dark:text-primary-300 text-[13px] font-bold">View all →</Text></Touchable></Link>
          } />
          {currentAffairs.map((affair) => (
            <Link key={affair._id} href={`/current-affair/${affair.slug}`} asChild>
              <Touchable className="mb-2">
                <PremiumCard className="p-4">
                  <View className="flex-row justify-between items-start">
                    <Text className="font-semibold text-slate-900 dark:text-slate-50 flex-1 mr-2">{affair.title}</Text>
                    <Badge label={affair.category} color={colors.primary} />
                  </View>
                  <Text className="text-slate-500 dark:text-slate-400 text-sm mt-1">{affair.summary}</Text>
                </PremiumCard>
              </Touchable>
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

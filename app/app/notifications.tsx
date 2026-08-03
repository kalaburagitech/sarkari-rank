import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "../lib/auth";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenHeader, PremiumCard, LoadingScreen, EmptyScreen } from "../components/ui";
import { useTheme } from "../lib/theme";

const TYPE_ICONS: Record<string, string> = {
  test: "clipboard",
  quiz: "today",
  ca: "newspaper",
  leaderboard: "trophy",
  premium: "star",
};

export default function NotificationsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  const notifications = useQuery(api.content.listNotifications, user ? { userId: user._id } : "skip");
  const markRead = useMutation(api.content.markNotificationRead);

  if (notifications === undefined) return <LoadingScreen message="Loading notifications..." />;

  return (
    <View className="flex-1 bg-slate-50 dark:bg-ink-bg">
      <ScreenHeader title="Notifications" subtitle="Stay updated with latest tests & news" onBack={() => router.back()} />
      <ScrollView className="p-4" showsVerticalScrollIndicator={false}>
        {notifications.map((n) => (
          <TouchableOpacity
            key={n._id}
            activeOpacity={0.85}
            onPress={() => !n.isRead && markRead({ id: n._id })}
          >
            <PremiumCard className={`p-4 mb-2 flex-row items-start ${!n.isRead ? "border-indigo-200" : ""}`}>
              <View style={{ backgroundColor: colors.primary + "15" }} className="w-10 h-10 rounded-xl items-center justify-center mr-3">
                <Ionicons name={(TYPE_ICONS[n.type] ?? "notifications") as any} size={20} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className={`font-semibold text-slate-900 dark:text-slate-50 ${!n.isRead ? "" : "opacity-70"}`}>{n.title}</Text>
                <Text className="text-slate-500 dark:text-slate-400 text-sm mt-1 leading-5">{n.body}</Text>
                <Text className="text-slate-400 dark:text-slate-400 text-xs mt-1.5">
                  {new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
              {!n.isRead && <View className="w-2.5 h-2.5 rounded-full bg-indigo-500 mt-1" />}
            </PremiumCard>
          </TouchableOpacity>
        ))}
        {notifications.length === 0 && <EmptyScreen icon="notifications-outline" message="No notifications yet" />}
      </ScrollView>
    </View>
  );
}

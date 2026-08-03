import { View, Text, ScrollView, TouchableOpacity, Alert, Image } from "react-native";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../../lib/auth";
import { useTheme, ThemeMode } from "../../lib/theme";
import { useRouter, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PremiumCard, StatBox, SectionHeader } from "../../components/ui";

const APPEARANCE: { mode: ThemeMode; label: string; icon: string }[] = [
  { mode: "light", label: "Light", icon: "sunny" },
  { mode: "dark", label: "Dark", icon: "moon" },
  { mode: "system", label: "System", icon: "phone-portrait" },
];

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { colors, mode, setMode } = useTheme();
  const router = useRouter();
  const notifications = useQuery(api.content.listNotifications, user ? { userId: user._id } : "skip");
  const unread = notifications?.filter((n) => !n.isRead).length ?? 0;

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: async () => { await logout(); router.replace("/(auth)/login"); } },
    ]);
  };

  const menuItems = [
    { icon: "bookmark", label: "Saved Tests & Questions", color: "#3B82F6", href: "/bookmarks" },
    { icon: "trophy", label: "All India Leaderboard", color: "#F59E0B", href: "/leaderboard" },
    { icon: "book", label: "Notes", color: "#8B5CF6", href: "/study-notes" },
    { icon: "newspaper", label: "Current Affairs", color: "#10B981", href: "/current-affairs" },
    { icon: "notifications", label: "Notifications", color: "#6366F1", href: "/notifications", badge: unread },
    { icon: "chatbubble", label: "Doubt Support", color: "#EC4899", href: "/doubts" },
    { icon: "card", label: "Premium Pass", color: "#EF4444", href: "/premium" },
  ];

  return (
    <ScrollView className="flex-1 bg-slate-50 dark:bg-ink-bg" showsVerticalScrollIndicator={false}>
      <View style={{ backgroundColor: colors.hero }} className="px-5 pt-6 pb-10 items-center">
        <View className="w-20 h-20 rounded-2xl items-center justify-center mb-3 border-2 border-amber-400/40 overflow-hidden" style={{ backgroundColor: colors.primary }}>
          <Image source={require("../../assets/icon.png")} style={{ width: 80, height: 80, position: "absolute", opacity: 0.25 }} />
          <Text className="text-white text-3xl font-black">{user?.name?.charAt(0)?.toUpperCase() ?? "U"}</Text>
        </View>
        <Text className="text-white text-xl font-bold">{user?.name}</Text>
        <Text style={{ color: colors.onHeroMuted }} className="text-sm mt-0.5">{user?.email}</Text>
        {user?.isPremium ? (
          <View className="bg-amber-500/25 px-4 py-1.5 rounded-full mt-3 border border-amber-400/40">
            <Text className="text-amber-300 text-sm font-bold">⭐ Premium Member</Text>
          </View>
        ) : (
          <Link href="/premium" asChild>
            <TouchableOpacity className="bg-amber-500 px-6 py-2.5 rounded-full mt-3">
              <Text className="text-white font-bold text-sm">Get Premium Pass · ₹499/yr</Text>
            </TouchableOpacity>
          </Link>
        )}
      </View>

      <PremiumCard className="mx-4 -mt-5 p-1 flex-row">
        <StatBox icon="document-text" value={user?.totalTestsTaken ?? 0} label="Tests" color={colors.primary} />
        <View className="w-px bg-slate-100 dark:bg-slate-800 my-3" />
        <StatBox icon="flame" value={`${user?.streak ?? 0}d`} label="Streak" color={colors.accent} />
        <View className="w-px bg-slate-100 dark:bg-slate-800 my-3" />
        <StatBox icon="star" value={user?.isPremium ? "PRO" : "FREE"} label="Plan" color={colors.success} />
      </PremiumCard>

      {/* Appearance */}
      <View className="px-4 mt-6">
        <SectionHeader title="Appearance" />
        <PremiumCard className="p-1.5 flex-row">
          {APPEARANCE.map((opt) => {
            const active = mode === opt.mode;
            return (
              <TouchableOpacity
                key={opt.mode}
                onPress={() => setMode(opt.mode)}
                activeOpacity={0.85}
                style={active ? { backgroundColor: colors.primary } : undefined}
                className="flex-1 py-2.5 rounded-xl items-center flex-row justify-center"
              >
                <Ionicons name={opt.icon as any} size={16} color={active ? "#fff" : colors.textMuted} />
                <Text className={`ml-1.5 text-sm font-semibold ${active ? "text-white" : "text-slate-600 dark:text-slate-300"}`}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </PremiumCard>
      </View>

      <View className="px-4 mt-6 mb-8">
        <SectionHeader title="Quick Access" />
        {menuItems.map((item) => (
          <Link key={item.label} href={item.href as any} asChild>
            <TouchableOpacity activeOpacity={0.85}>
              <PremiumCard className="p-4 mb-2 flex-row items-center">
                <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: item.color + "1F" }}>
                  <Ionicons name={item.icon as any} size={20} color={item.color} />
                </View>
                <Text className="flex-1 font-semibold text-slate-800 dark:text-slate-200">{item.label}</Text>
                {item.badge ? (
                  <View className="bg-red-500 w-5 h-5 rounded-full items-center justify-center mr-2">
                    <Text className="text-white text-xs font-bold">{item.badge}</Text>
                  </View>
                ) : null}
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </PremiumCard>
            </TouchableOpacity>
          </Link>
        ))}

        <TouchableOpacity onPress={handleLogout} className="bg-red-50 dark:bg-red-950/40 rounded-2xl p-4 mt-4 flex-row items-center justify-center border border-red-100 dark:border-red-900">
          <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          <Text className="text-red-500 font-bold ml-2">Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

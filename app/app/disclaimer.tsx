import { View, Text, ScrollView, TouchableOpacity, Linking } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenHeader, PremiumCard } from "../components/ui";
import { useTheme } from "../lib/theme";
import { DISCLAIMER_FULL, OFFICIAL_PORTALS } from "../constants/legal";

export default function DisclaimerScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View className="flex-1 bg-slate-50 dark:bg-ink-bg">
      <ScreenHeader title="About & Disclaimer" subtitle="Official sources & affiliation" onBack={() => router.back()} />
      <ScrollView className="p-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Prominent not-affiliated notice */}
        <View className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-4 mb-4">
          <View className="flex-row items-center mb-2">
            <Ionicons name="information-circle" size={20} color={colors.warning} />
            <Text className="text-amber-900 dark:text-amber-300 font-bold text-base ml-2">
              Not a Government App
            </Text>
          </View>
          <Text className="text-amber-800 dark:text-amber-300 text-sm leading-6">{DISCLAIMER_FULL}</Text>
        </View>

        {/* Official sources */}
        <Text className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2 ml-1">
          Official Government Sources
        </Text>
        <PremiumCard className="p-2 mb-4">
          {OFFICIAL_PORTALS.map((p, i) => (
            <TouchableOpacity
              key={p.url}
              activeOpacity={0.8}
              onPress={() => Linking.openURL(p.url)}
              className={`flex-row items-center px-2 py-3 ${i > 0 ? "border-t border-slate-100 dark:border-slate-800" : ""}`}
            >
              <View style={{ backgroundColor: colors.primary + "1F" }} className="w-9 h-9 rounded-xl items-center justify-center mr-3">
                <Ionicons name="globe-outline" size={18} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-slate-900 dark:text-slate-50 font-semibold text-sm">{p.name}</Text>
                <Text className="text-slate-400 dark:text-slate-500 text-xs">{p.url.replace("https://", "")}</Text>
              </View>
              <Ionicons name="open-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
          ))}
        </PremiumCard>

        <Text className="text-slate-400 dark:text-slate-500 text-xs text-center px-4 leading-5">
          Always confirm exam notifications, eligibility, dates and results on the official
          websites above. SarkariRank is a study-preparation tool only.
        </Text>
      </ScrollView>
    </View>
  );
}

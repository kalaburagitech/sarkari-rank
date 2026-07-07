import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "../lib/auth";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenHeader, PremiumCard, PrimaryButton } from "../components/ui";
import { LogoRow } from "../components/Logo";
import { theme } from "../constants/theme";

const PLANS = [
  { id: "monthly" as const, name: "Monthly", price: 99, duration: "1 month", save: null },
  { id: "yearly" as const, name: "Yearly Pass", price: 499, duration: "1 year", popular: true, save: "Save 58%" },
  { id: "lifetime" as const, name: "Lifetime", price: 1999, duration: "Forever", save: "Best Value" },
];

const FEATURES = [
  "Unlimited Mock & Live Tests",
  "All Previous Year Papers",
  "Premium Study Notes",
  "Detailed Performance Analytics",
  "All India Rank & Leaderboard",
  "Re-attempt & Solution Review",
  "Priority Doubt Support",
  "Daily Quiz + Streak Rewards",
];

export default function PremiumScreen() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const createSubscription = useMutation(api.content.createSubscription);

  const handlePurchase = async (plan: typeof PLANS[number]) => {
    if (!user) return;
    Alert.alert("Confirm Purchase", `Activate ${plan.name} for ₹${plan.price}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Activate Now",
        onPress: async () => {
          await createSubscription({ userId: user._id, plan: plan.id, amount: plan.price, paymentId: `demo_${Date.now()}` });
          await refreshUser();
          Alert.alert("🎉 Welcome to Premium!", "Your SarkariRank Pass is now active. Enjoy unlimited tests!");
          router.back();
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-slate-50">
      <ScreenHeader title="SarkariRank Pass" subtitle="Unlock your full potential" onBack={() => router.back()} />

      <ScrollView className="p-4" showsVerticalScrollIndicator={false}>
        <View style={{ backgroundColor: theme.primaryDark }} className="rounded-2xl p-5 mb-5">
          <LogoRow size={44} subtitle="Premium Exam Preparation" />
          <Text className="text-indigo-200 text-sm mt-4 leading-5">55+ mock tests · Live tests · PYP · Study notes · Analytics</Text>
        </View>

        {PLANS.map((plan) => (
          <TouchableOpacity key={plan.id} activeOpacity={0.9} onPress={() => handlePurchase(plan)}>
            <PremiumCard className={`p-5 mb-3 ${plan.popular ? "border-2 border-amber-400" : ""}`}>
              <View className="flex-row justify-between items-start">
                <View>
                  {plan.popular && <Text className="text-amber-600 text-xs font-black mb-1">⭐ MOST POPULAR</Text>}
                  <Text className="text-xl font-bold text-slate-900">{plan.name}</Text>
                  <Text className="text-slate-500 text-sm">{plan.duration}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-3xl font-black text-indigo-600">₹{plan.price}</Text>
                  {plan.save && <Text className="text-emerald-600 text-xs font-bold mt-1">{plan.save}</Text>}
                </View>
              </View>
            </PremiumCard>
          </TouchableOpacity>
        ))}

        <PremiumCard className="p-5 mt-2 mb-8">
          <Text className="font-bold text-slate-900 mb-3">Everything included:</Text>
          {FEATURES.map((f) => (
            <View key={f} className="flex-row items-center py-1.5">
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <Text className="text-slate-700 text-sm ml-2">{f}</Text>
            </View>
          ))}
        </PremiumCard>
      </ScrollView>
    </View>
  );
}

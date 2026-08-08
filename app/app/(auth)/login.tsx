import { useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useAuth } from "../../lib/auth";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { InputField, PrimaryButton, PremiumCard } from "../../components/ui";
import { Logo } from "../../components/Logo";
import { useTheme } from "../../lib/theme";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();

  const handleLogin = async () => {
    setError("");
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.ok) router.replace("/(tabs)");
    else setError(res.error ?? "Login failed. Please try again.");
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1" style={{ backgroundColor: colors.hero }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }} className="px-6 py-10">
        <View className="items-center mb-8">
          <Logo size={80} showText subtitle="India&apos;s #1 Govt Exam Prep Platform" />
          <View className="flex-row flex-wrap justify-center gap-2 mt-3">
            {["SSC", "Banking", "Railway", "UPSC", "Teaching"].map((tag) => (
              <View key={tag} className="bg-white/10 px-3 py-1 rounded-full">
                <Text className="text-indigo-200 text-xs font-medium">{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        <PremiumCard className="p-6">
          <Text className="text-xl font-bold text-slate-900 mb-1">Welcome Back 👋</Text>
          <Text className="text-slate-500 text-sm mb-6">Login to continue your preparation journey</Text>

          <InputField label="Email Address" value={email} onChangeText={(t) => { setEmail(t); if (error) setError(""); }} placeholder="your@email.com" keyboardType="email-address" icon="mail-outline" />
          <InputField label="Password" value={password} onChangeText={(t) => { setPassword(t); if (error) setError(""); }} placeholder="Enter password" secureTextEntry icon="lock-closed-outline" />

          {error ? (
            <View className="flex-row items-center bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900 rounded-xl px-3 py-2.5 mb-3">
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text className="text-red-600 dark:text-red-400 text-sm ml-2 flex-1">{error}</Text>
            </View>
          ) : null}

          <PrimaryButton title="Login to SarkariRank" onPress={handleLogin} loading={loading} />

          <View className="flex-row justify-center mt-5">
            <Text className="text-slate-500 text-sm">New here? </Text>
            <Link href="/(auth)/register" asChild>
              <Text className="text-indigo-600 font-bold text-sm">Create Free Account</Text>
            </Link>
          </View>
        </PremiumCard>

        <View className="flex-row justify-around mt-8 px-2">
          {[
            { icon: "clipboard", label: "55+ Tests" },
            { icon: "radio", label: "Live Tests" },
            { icon: "analytics", label: "Analytics" },
            { icon: "trophy", label: "Rank" },
          ].map((f) => (
            <View key={f.label} className="items-center">
              <View className="w-10 h-10 rounded-xl bg-white/10 items-center justify-center mb-1">
                <Ionicons name={f.icon as any} size={18} color="#A5B4FC" />
              </View>
              <Text className="text-indigo-300 text-xs">{f.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

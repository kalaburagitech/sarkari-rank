import { useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useAuth } from "../../lib/auth";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { InputField, PrimaryButton, PremiumCard } from "../../components/ui";
import { Logo } from "../../components/Logo";
import { useTheme } from "../../lib/theme";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();

  const handleRegister = async () => {
    if (!name || !email || !password) return;
    setLoading(true);
    const success = await register(name, email, password);
    setLoading(false);
    if (success) router.replace("/(tabs)");
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1" style={{ backgroundColor: colors.hero }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }} className="px-6 py-10">
        <View className="items-center mb-6">
          <Logo size={72} showText subtitle="Start free · No credit card required" />
        </View>

        <PremiumCard className="p-6">
          <Text className="text-xl font-bold text-slate-900 mb-1">Create Account</Text>
          <Text className="text-slate-500 text-sm mb-6">Join 10L+ aspirants preparing for govt exams</Text>

          <InputField label="Full Name" value={name} onChangeText={setName} placeholder="Your full name" icon="person-outline" />
          <InputField label="Email" value={email} onChangeText={setEmail} placeholder="your@email.com" keyboardType="email-address" icon="mail-outline" />
          <InputField label="Password" value={password} onChangeText={setPassword} placeholder="Min 6 characters" secureTextEntry icon="lock-closed-outline" />

          <PrimaryButton title="Sign Up Free" onPress={handleRegister} loading={loading} />

          <View className="flex-row justify-center mt-5">
            <Text className="text-slate-500 text-sm">Already have account? </Text>
            <Link href="/(auth)/login" asChild>
              <Text className="text-indigo-600 font-bold text-sm">Login</Text>
            </Link>
          </View>
        </PremiumCard>

        <View className="mt-6 px-2">
          {["Free mock tests", "Daily quiz & streak", "Performance analytics", "All India rank"].map((f) => (
            <View key={f} className="flex-row items-center mb-2">
              <Ionicons name="checkmark-circle" size={16} color="#818CF8" />
              <Text className="text-indigo-200 text-sm ml-2">{f}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

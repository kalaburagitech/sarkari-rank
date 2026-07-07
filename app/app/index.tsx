import { Redirect } from "expo-router";
import { useAuth } from "../lib/auth";
import { View } from "react-native";
import { Logo } from "../components/Logo";
import { theme } from "../constants/theme";

export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: theme.primaryDark }}>
        <Logo size={96} showText subtitle="Loading your exam prep..." />
      </View>
    );
  }

  if (user) return <Redirect href="/(tabs)" />;
  return <Redirect href="/(auth)/login" />;
}

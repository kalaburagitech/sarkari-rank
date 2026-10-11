import { Tabs, Redirect } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth } from "../../lib/auth";
import { useTheme } from "../../lib/theme";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Logo } from "../../components/Logo";
import { HeroBackground } from "../../components/Gradient";

// Filled icon when active, outline otherwise. (The tab icon slot is ~30px
// wide, so no pill background — it gets clipped.)
function TabIcon({ name, focused, color }: { name: string; focused: boolean; color: unknown }) {
  return <Ionicons name={(focused ? name : `${name}-outline`) as any} size={24} color={String(color)} />;
}

export default function TabLayout() {
  const { user, isLoading } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.hero }}>
        <Logo size={88} showText subtitle="Preparing your dashboard..." />
      </View>
    );
  }

  if (!user) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: { backgroundColor: colors.tabBar, borderTopWidth: 0, height: 66 + insets.bottom, paddingBottom: insets.bottom + 8, paddingTop: 8, elevation: 16, shadowColor: "#0B1B3F", shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: -4 } },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700", marginTop: 2 },
        headerStyle: { backgroundColor: colors.hero },
        headerBackground: () => <HeroBackground style={{ flex: 1 }} glow={false} />,
        headerShadowVisible: false,
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false, // the home hero is its own header
          tabBarIcon: ({ color, focused }) => <TabIcon name="home" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="exams"
        options={{
          title: "Exams",
          tabBarIcon: ({ color, focused }) => <TabIcon name="school" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tests"
        options={{
          title: "Tests",
          tabBarIcon: ({ color, focused }) => <TabIcon name="document-text" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Analytics",
          headerShown: false, // the screen's gradient hero is its header
          tabBarIcon: ({ color, focused }) => <TabIcon name="bar-chart" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false, // the screen's gradient hero is its header
          tabBarIcon: ({ color, focused }) => <TabIcon name="person" focused={focused} color={color} />,
        }}
      />
    </Tabs>
  );
}

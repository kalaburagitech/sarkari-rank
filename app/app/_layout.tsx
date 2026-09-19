import "../global.css";
import { Stack } from "expo-router";
import { ConvexProvider } from "convex/react";
import { convex } from "../lib/convex";
import { AuthProvider } from "../lib/auth";
import { ThemeProvider } from "../lib/theme";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { AppState } from "react-native";
import { prefetchAll, invalidateVersions } from "../lib/offline";
import { flushAttempts } from "../lib/attempts";

export default function RootLayout() {
  // Warm the on-device catalogue and push any attempt taken offline. Both are
  // cheap no-ops when nothing changed and silent when there is no network.
  useEffect(() => {
    const sync = () => {
      invalidateVersions();
      flushAttempts().catch(() => {});
      prefetchAll().catch(() => {});
    };
    sync();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") sync();
    });
    return () => sub.remove();
  }, []);

  return (
    <ConvexProvider client={convex}>
      <ThemeProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="category/[slug]" options={{ headerShown: false }} />
          <Stack.Screen name="test/[id]" options={{ headerShown: true, title: "Mock Test" }} />
          <Stack.Screen name="exam/[slug]" options={{ headerShown: true, title: "Exam" }} />
          <Stack.Screen name="doubts" options={{ headerShown: false }} />
          <Stack.Screen name="premium" options={{ headerShown: false }} />
          <Stack.Screen name="bookmarks" options={{ headerShown: false }} />
          <Stack.Screen name="study-note/[slug]" options={{ headerShown: false }} />
          <Stack.Screen name="current-affair/[slug]" options={{ headerShown: false }} />
          <Stack.Screen name="study-notes" options={{ headerShown: false }} />
          <Stack.Screen name="current-affairs" options={{ headerShown: false }} />
          <Stack.Screen name="previous-year-papers" options={{ headerShown: false }} />
          <Stack.Screen name="notifications" options={{ headerShown: false }} />
          <Stack.Screen name="leaderboard" options={{ headerShown: false }} />
            <Stack.Screen name="results/[attemptId]" options={{ headerShown: true, title: "Results" }} />
            <Stack.Screen name="disclaimer" options={{ headerShown: false }} />
          </Stack>
        </AuthProvider>
      </ThemeProvider>
    </ConvexProvider>
  );
}

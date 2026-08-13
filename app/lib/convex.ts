import { ConvexReactClient } from "convex/react";
import Constants from "expo-constants";

const convexUrl =
  process.env.EXPO_PUBLIC_CONVEX_URL ??
  (Constants.expoConfig?.extra?.convexUrl as string) ??
  "https://silent-jackal-490.convex.cloud";

export const convex = new ConvexReactClient(convexUrl);

import { ConvexReactClient } from "convex/react";
import Constants from "expo-constants";

const convexUrl =
  process.env.EXPO_PUBLIC_CONVEX_URL ??
  (Constants.expoConfig?.extra?.convexUrl as string) ??
  "https://hardy-leopard-835.convex.cloud";

export const convex = new ConvexReactClient(convexUrl);

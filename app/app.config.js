export default {
  expo: {
    name: "SarkariRank - Govt Exam Prep",
    slug: "sarkari-rank-govt-exam-prep",
    version: "1.0.4",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    scheme: "sarkarirank",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#201584",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.sarkarirank.examprep",
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#201584",
        foregroundImage: "./assets/android-icon-foreground.png",
      },
      package: "com.sarkarirank.app",
      versionCode: 5,
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/favicon.png",
    },
    plugins: ["expo-router", "expo-sharing"],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      convexUrl: process.env.EXPO_PUBLIC_CONVEX_URL ?? "https://hardy-leopard-835.convex.cloud",
    },
  },
};

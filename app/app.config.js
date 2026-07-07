export default {
  expo: {
    name: "SarkariRank - Govt Exam Prep",
    slug: "sarkari-rank-govt-exam-prep",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    scheme: "sarkarirank",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#312E81",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.sarkarirank.examprep",
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#312E81",
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png",
      },
      package: "com.sarkarirank.examprep",
      versionCode: 1,
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/favicon.png",
    },
    plugins: ["expo-router"],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      convexUrl: process.env.EXPO_PUBLIC_CONVEX_URL ?? "https://hardy-leopard-835.convex.cloud",
      eas: {
        projectId: "sarkari-rank-exam-prep",
      },
    },
  },
};

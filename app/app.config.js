export default {
  expo: {
    name: "Astraa Exam App",
    slug: "sarkari-rank-govt-exam-prep",
    version: "1.0.11",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    scheme: "sarkarirank",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#FFFFFF",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.sarkarirank.examprep",
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#FFFFFF",
        foregroundImage: "./assets/android-icon-foreground.png",
      },
      package: "com.astraa.examapp",
      versionCode: 12,
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/favicon.png",
    },
    plugins: [
      "expo-router",
      "expo-sharing",
      // Keeps release-build shrinking + the native-module ProGuard keep rules
      // reproducible across `expo prebuild` (the android/ dir is gitignored).
      [
        "expo-build-properties",
        {
          android: {
            enableProguardInReleaseBuilds: true,
            enableShrinkResourcesInReleaseBuilds: true,
            extraProguardRules: [
              "-keep class com.shockwave.** { *; }",
              "-keep class com.swmansion.reanimated.** { *; }",
              "-keep class com.facebook.react.turbomodule.** { *; }",
            ].join("\n"),
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      convexUrl: process.env.EXPO_PUBLIC_CONVEX_URL ?? "https://capable-gazelle-597.convex.cloud",
    },
  },
};

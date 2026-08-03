// ─────────────────────────────────────────────────────────────
// SarkariRank Design Tokens
// One source of truth for colors. `lightColors` / `darkColors` are
// consumed through useTheme() (lib/theme.tsx). The legacy `theme`
// export stays as a light alias so screens migrate incrementally.
// ─────────────────────────────────────────────────────────────

// Raw brand scales (also mirrored in tailwind.config.js for classes)
export const palette = {
  primary: {
    50: "#EEF2FF",
    100: "#E0E7FF",
    200: "#C7D2FE",
    300: "#A5B4FC",
    400: "#818CF8",
    500: "#6366F1",
    600: "#4F46E5",
    700: "#4338CA",
    800: "#3730A3",
    900: "#312E81",
    950: "#1E1B4B",
  },
  secondary: {
    50: "#ECFDF5",
    100: "#D1FAE5",
    300: "#6EE7B7",
    400: "#34D399",
    500: "#10B981",
    600: "#059669",
    700: "#047857",
  },
  accent: {
    50: "#FFFBEB",
    100: "#FEF3C7",
    400: "#FBBF24",
    500: "#F59E0B",
    600: "#D97706",
  },
  danger: { 400: "#F87171", 500: "#EF4444", 600: "#DC2626" },
  info: { 400: "#60A5FA", 500: "#3B82F6" },
  neutral: {
    50: "#F8FAFC",
    100: "#F1F5F9",
    200: "#E2E8F0",
    300: "#CBD5E1",
    400: "#94A3B8",
    500: "#64748B",
    600: "#475569",
    700: "#334155",
    800: "#1E293B",
    900: "#0F172A",
    950: "#0B1120",
  },
};

export type ThemeColors = {
  scheme: "light" | "dark";
  // surfaces
  bg: string;
  surface: string;
  surfaceAlt: string;
  card: string;
  cardBorder: string;
  border: string;
  // text
  text: string;
  textMuted: string;
  muted: string; // alias of textMuted (legacy)
  textFaint: string;
  // brand
  primary: string;
  primaryDark: string;
  primarySoft: string; // subtle tint background
  onPrimary: string;
  secondary: string;
  secondaryDark: string;
  accent: string;
  accentDark: string;
  // semantic
  success: string;
  warning: string;
  danger: string;
  info: string;
  // chrome
  hero: string;
  onHero: string;
  onHeroMuted: string;
  tabBar: string;
  tabBarBorder: string;
  tabActive: string;
  tabInactive: string;
};

export const lightColors: ThemeColors = {
  scheme: "light",
  bg: palette.neutral[50],
  surface: "#FFFFFF",
  surfaceAlt: palette.neutral[100],
  card: "#FFFFFF",
  cardBorder: palette.neutral[100],
  border: palette.neutral[200],
  text: palette.neutral[900],
  textMuted: palette.neutral[500],
  muted: palette.neutral[500],
  textFaint: palette.neutral[400],
  primary: palette.primary[600],
  primaryDark: palette.primary[900],
  primarySoft: palette.primary[50],
  onPrimary: "#FFFFFF",
  secondary: palette.secondary[500],
  secondaryDark: palette.secondary[600],
  accent: palette.accent[500],
  accentDark: palette.accent[600],
  success: palette.secondary[500],
  warning: palette.accent[500],
  danger: palette.danger[500],
  info: palette.info[500],
  hero: palette.primary[900],
  onHero: "#FFFFFF",
  onHeroMuted: palette.primary[200],
  tabBar: "#FFFFFF",
  tabBarBorder: palette.neutral[200],
  tabActive: palette.primary[600],
  tabInactive: palette.neutral[400],
};

export const darkColors: ThemeColors = {
  scheme: "dark",
  bg: palette.neutral[950],
  surface: "#0F1729",
  surfaceAlt: palette.neutral[800],
  card: "#111a2e",
  cardBorder: "#22304a",
  border: palette.neutral[700],
  text: palette.neutral[50],
  textMuted: palette.neutral[400],
  muted: palette.neutral[400],
  textFaint: palette.neutral[500],
  primary: palette.primary[500],
  primaryDark: palette.primary[950],
  primarySoft: "#1c2242",
  onPrimary: "#FFFFFF",
  secondary: palette.secondary[400],
  secondaryDark: palette.secondary[500],
  accent: palette.accent[400],
  accentDark: palette.accent[500],
  success: palette.secondary[400],
  warning: palette.accent[400],
  danger: palette.danger[400],
  info: palette.info[400],
  hero: palette.primary[950],
  onHero: "#FFFFFF",
  onHeroMuted: palette.primary[300],
  tabBar: "#0F1729",
  tabBarBorder: "#22304a",
  tabActive: palette.primary[400],
  tabInactive: palette.neutral[500],
};

// ── Legacy alias — keeps un-migrated screens compiling during reskin ──
export const theme = {
  primary: lightColors.primary,
  primaryDark: lightColors.primaryDark,
  accent: lightColors.accent,
  success: lightColors.success,
  danger: lightColors.danger,
  bg: lightColors.bg,
  card: lightColors.card,
  text: lightColors.text,
  muted: lightColors.muted,
  border: lightColors.border,
  gradients: {
    hero: ["#1E1B4B", "#312E81", "#4338CA"],
    card: ["#6366F1", "#8B5CF6"],
    gold: ["#F59E0B", "#D97706"],
    success: ["#10B981", "#059669"],
  },
};

// Content-type → label/color/icon. `color` is a role key resolved via colors[...] at render,
// but we keep concrete light hexes here for back-compat; screens may map to tokens.
export const TEST_TYPE_CONFIG: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  mock: { label: "Mock Test", color: palette.primary[600], icon: "clipboard" },
  live: { label: "Live Test", color: palette.danger[500], icon: "radio" },
  chapter: { label: "Chapter", color: "#8B5CF6", icon: "layers" },
  subject: { label: "Subject", color: palette.secondary[500], icon: "book" },
  pyp: { label: "Previous Year", color: palette.accent[500], icon: "archive" },
  daily: { label: "Daily Quiz", color: "#EC4899", icon: "today" },
  practice: { label: "Practice", color: "#06B6D4", icon: "fitness" },
};

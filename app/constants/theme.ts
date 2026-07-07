export const theme = {
  primary: "#4F46E5",
  primaryDark: "#312E81",
  accent: "#F59E0B",
  success: "#10B981",
  danger: "#EF4444",
  bg: "#F8FAFC",
  card: "#FFFFFF",
  text: "#0F172A",
  muted: "#64748B",
  border: "#E2E8F0",
  gradients: {
    hero: ["#1E1B4B", "#312E81", "#4338CA"],
    card: ["#6366F1", "#8B5CF6"],
    gold: ["#F59E0B", "#D97706"],
    success: ["#10B981", "#059669"],
  },
};

export const TEST_TYPE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  mock: { label: "Mock Test", color: "#4F46E5", icon: "clipboard" },
  live: { label: "Live Test", color: "#EF4444", icon: "radio" },
  chapter: { label: "Chapter", color: "#8B5CF6", icon: "layers" },
  subject: { label: "Subject", color: "#10B981", icon: "book" },
  pyp: { label: "PYP", color: "#F59E0B", icon: "archive" },
  daily: { label: "Daily Quiz", color: "#EC4899", icon: "today" },
  practice: { label: "Practice", color: "#06B6D4", icon: "fitness" },
};

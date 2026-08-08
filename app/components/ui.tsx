import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../lib/theme";
import { DISCLAIMER_SHORT } from "../constants/legal";
import { Logo } from "./Logo";

export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <View className="flex-row justify-between items-center mb-3 px-1">
      <View className="flex-1 pr-2">
        <Text className="text-lg font-bold text-slate-900 dark:text-slate-50">{title}</Text>
        {subtitle && <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</Text>}
      </View>
      {action}
    </View>
  );
}

export function PremiumCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { colors } = useTheme();
  return (
    <View
      className={`bg-white dark:bg-ink-card rounded-2xl border border-slate-100 dark:border-slate-800 ${className}`}
      style={{ shadowColor: colors.primary, shadowOpacity: colors.scheme === "dark" ? 0.25 : 0.06, shadowRadius: 12, elevation: 3 }}
    >
      {children}
    </View>
  );
}

export function Badge({ label, color }: { label: string; color?: string }) {
  const { colors } = useTheme();
  const c = color ?? colors.primary;
  return (
    <View style={{ backgroundColor: c + "22" }} className="px-2.5 py-0.5 rounded-full">
      <Text style={{ color: c }} className="text-xs font-bold">{label}</Text>
    </View>
  );
}

export function Chip({ label, color }: { label: string; color?: string }) {
  return <Badge label={label} color={color} />;
}

export function StatBox({ icon, value, label, color }: { icon: string; value: string | number; label: string; color: string }) {
  return (
    <View className="flex-1 items-center py-3">
      <View style={{ backgroundColor: color + "1F" }} className="w-10 h-10 rounded-xl items-center justify-center mb-2">
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text className="text-xl font-bold text-slate-900 dark:text-slate-50">{value}</Text>
      <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</Text>
    </View>
  );
}

export function LoadingScreen({ message = "Loading..." }: { message?: string }) {
  const { colors } = useTheme();
  return (
    <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-ink-bg">
      <Logo size={72} />
      <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 16 }} />
      <Text className="text-slate-400 dark:text-slate-500 text-sm mt-3">{message}</Text>
    </View>
  );
}

export function EmptyScreen({ icon, message, action }: { icon: string; message: string; action?: React.ReactNode }) {
  return (
    <View className="items-center py-16 px-6">
      <View className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mb-4">
        <Ionicons name={icon as any} size={28} color="#94A3B8" />
      </View>
      <Text className="text-slate-400 dark:text-slate-500 text-center text-sm">{message}</Text>
      {action && <View className="mt-4">{action}</View>}
    </View>
  );
}

/** Lightweight skeleton block for list loading states. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <View className={`bg-slate-200 dark:bg-slate-800 rounded-xl ${className}`} />;
}

export function PrimaryButton({ title, onPress, loading, variant = "primary", icon }: { title: string; onPress: () => void; loading?: boolean; variant?: "primary" | "outline" | "gold" | "secondary"; icon?: string }) {
  const { colors } = useTheme();
  const bg = variant === "gold" ? colors.accent : variant === "secondary" ? colors.secondary : variant === "outline" ? "transparent" : colors.primary;
  const textColor = variant === "outline" ? colors.primary : "#FFFFFF";
  return (
    <TouchableOpacity onPress={onPress} disabled={loading} activeOpacity={0.85}
      style={{ backgroundColor: bg, borderWidth: variant === "outline" ? 1.5 : 0, borderColor: colors.primary }}
      className="rounded-2xl py-4 items-center flex-row justify-center">
      {loading ? <ActivityIndicator color={variant === "outline" ? colors.primary : "#fff"} /> : (
        <>
          {icon && <Ionicons name={icon as any} size={18} color={textColor} style={{ marginRight: 8 }} />}
          <Text className="font-bold text-base" style={{ color: textColor }}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

export function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}
      style={active ? { backgroundColor: colors.primary } : undefined}
      className={`px-4 py-2 rounded-full mr-2 mb-2 ${active ? "" : "bg-white dark:bg-ink-card border border-slate-200 dark:border-slate-700"}`}>
      <Text className={`text-sm font-semibold ${active ? "text-white" : "text-slate-600 dark:text-slate-300"}`}>{label}</Text>
    </TouchableOpacity>
  );
}

export function InputField({
  label, value, onChangeText, placeholder, secureTextEntry, keyboardType, icon,
}: {
  label: string; value: string; onChangeText: (t: string) => void; placeholder?: string;
  secureTextEntry?: boolean; keyboardType?: "default" | "email-address"; icon?: string;
}) {
  return (
    <View className="mb-4">
      <Text className="text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">{label}</Text>
      <View className="flex-row items-center border border-slate-200 dark:border-slate-700 rounded-2xl px-4 bg-slate-50 dark:bg-ink-soft">
        {icon && <Ionicons name={icon as any} size={18} color="#94A3B8" />}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={keyboardType === "email-address" ? "none" : "words"}
          className={`flex-1 py-3.5 text-slate-900 dark:text-slate-50 ${icon ? "ml-3" : ""}`}
          placeholderTextColor="#94A3B8"
        />
      </View>
    </View>
  );
}

export function ScreenHeader({
  title, subtitle, onBack, right,
}: {
  title: string; subtitle?: string; onBack?: () => void; right?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  return (
    <View style={{ backgroundColor: colors.hero, paddingTop: insets.top + 10 }} className="px-5 pb-4 flex-row items-center">
      {onBack && (
        <TouchableOpacity onPress={onBack} hitSlop={8} className="mr-3 w-10 h-10 rounded-xl bg-white/10 items-center justify-center">
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
      )}
      <View className="flex-1">
        <Text className="text-white text-lg font-bold" numberOfLines={1}>{title}</Text>
        {subtitle && <Text style={{ color: colors.onHeroMuted }} className="text-xs mt-0.5" numberOfLines={1}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

/** Small, always-visible "not a government entity" disclaimer. Tap → details. */
export function DisclaimerBanner({ onPress }: { onPress?: () => void }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
      className="flex-row items-center bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/60 rounded-xl px-3 py-2"
    >
      <Ionicons name="information-circle" size={16} color={colors.warning} />
      <Text className="flex-1 text-amber-800 dark:text-amber-300 text-xs ml-2 leading-4">
        {DISCLAIMER_SHORT}
      </Text>
      {onPress && <Ionicons name="chevron-forward" size={14} color={colors.warning} />}
    </TouchableOpacity>
  );
}

/** Tappable external source link (opens the original/official URL). */
export function SourceLink({ label, url }: { label?: string; url: string }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={() => Linking.openURL(url)}
      activeOpacity={0.8}
      className="flex-row items-center bg-primary-50 dark:bg-primary-950 rounded-xl px-3 py-2.5"
    >
      <Ionicons name="open-outline" size={16} color={colors.primary} />
      <Text style={{ color: colors.primary }} className="flex-1 font-semibold text-sm ml-2" numberOfLines={1}>
        {label ?? url}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={colors.primary} />
    </TouchableOpacity>
  );
}

/** Answer option row for the test-taking flow, with visual state. */
export function AnswerOptionCard({
  optionId, text, state, onPress, disabled,
}: {
  optionId: string;
  text: string;
  state: "idle" | "selected" | "correct" | "wrong";
  onPress?: () => void;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  const map = {
    idle: { bg: colors.surface, border: colors.border, fg: colors.text, badge: colors.surfaceAlt, badgeFg: colors.textMuted },
    selected: { bg: colors.primarySoft, border: colors.primary, fg: colors.text, badge: colors.primary, badgeFg: "#fff" },
    correct: { bg: colors.scheme === "dark" ? "#0f2e22" : "#ECFDF5", border: colors.success, fg: colors.text, badge: colors.success, badgeFg: "#fff" },
    wrong: { bg: colors.scheme === "dark" ? "#3a1620" : "#FEF2F2", border: colors.danger, fg: colors.text, badge: colors.danger, badgeFg: "#fff" },
  }[state];
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.85}
      style={{ backgroundColor: map.bg, borderColor: map.border, borderWidth: 1.5 }}
      className="rounded-2xl p-4 mb-3 flex-row items-center">
      <View style={{ backgroundColor: map.badge }} className="w-8 h-8 rounded-full items-center justify-center mr-3">
        <Text style={{ color: map.badgeFg }} className="font-bold">{optionId.toUpperCase()}</Text>
      </View>
      <Text style={{ color: map.fg }} className="flex-1 text-[15px]">{text}</Text>
      {state === "correct" && <Ionicons name="checkmark-circle" size={22} color={colors.success} />}
      {state === "wrong" && <Ionicons name="close-circle" size={22} color={colors.danger} />}
    </TouchableOpacity>
  );
}

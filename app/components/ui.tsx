import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../constants/theme";
import { Logo } from "./Logo";

export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <View className="flex-row justify-between items-center mb-3 px-1">
      <View>
        <Text className="text-lg font-bold text-slate-900">{title}</Text>
        {subtitle && <Text className="text-xs text-slate-500 mt-0.5">{subtitle}</Text>}
      </View>
      {action}
    </View>
  );
}

export function PremiumCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <View className={`bg-white rounded-2xl border border-slate-100 shadow-sm ${className}`} style={{ shadowColor: "#6366F1", shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 }}>
      {children}
    </View>
  );
}

export function Badge({ label, color = theme.primary }: { label: string; color?: string }) {
  return (
    <View style={{ backgroundColor: color + "18" }} className="px-2.5 py-0.5 rounded-full">
      <Text style={{ color }} className="text-xs font-bold">{label}</Text>
    </View>
  );
}

export function StatBox({ icon, value, label, color }: { icon: string; value: string | number; label: string; color: string }) {
  return (
    <View className="flex-1 items-center py-3">
      <View style={{ backgroundColor: color + "15" }} className="w-10 h-10 rounded-xl items-center justify-center mb-2">
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text className="text-xl font-bold text-slate-900">{value}</Text>
      <Text className="text-xs text-slate-500 mt-0.5">{label}</Text>
    </View>
  );
}

export function LoadingScreen({ message = "Loading..." }: { message?: string }) {
  return (
    <View className="flex-1 items-center justify-center bg-slate-50">
      <Logo size={72} />
      <ActivityIndicator size="large" color={theme.primary} className="mt-4" />
      <Text className="text-slate-400 text-sm mt-3">{message}</Text>
    </View>
  );
}

export function EmptyScreen({ icon, message, action }: { icon: string; message: string; action?: React.ReactNode }) {
  return (
    <View className="items-center py-16 px-6">
      <View className="w-16 h-16 rounded-full bg-slate-100 items-center justify-center mb-4">
        <Ionicons name={icon as any} size={28} color="#CBD5E1" />
      </View>
      <Text className="text-slate-400 text-center text-sm">{message}</Text>
      {action && <View className="mt-4">{action}</View>}
    </View>
  );
}

export function PrimaryButton({ title, onPress, loading, variant = "primary" }: { title: string; onPress: () => void; loading?: boolean; variant?: "primary" | "outline" | "gold" }) {
  const bg = variant === "gold" ? "#F59E0B" : variant === "outline" ? "transparent" : theme.primary;
  return (
    <TouchableOpacity onPress={onPress} disabled={loading}
      style={{ backgroundColor: bg, borderWidth: variant === "outline" ? 1.5 : 0, borderColor: theme.primary }}
      className="rounded-2xl py-4 items-center">
      {loading ? <ActivityIndicator color="#fff" /> : (
        <Text className={`font-bold text-base ${variant === "outline" ? "text-indigo-600" : "text-white"}`}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

export function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress}
      className={`px-4 py-2 rounded-full mr-2 mb-2 ${active ? "bg-indigo-600" : "bg-white border border-slate-200"}`}>
      <Text className={`text-sm font-semibold ${active ? "text-white" : "text-slate-600"}`}>{label}</Text>
    </TouchableOpacity>
  );
}

export function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  icon,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
  icon?: string;
}) {
  return (
    <View className="mb-4">
      <Text className="text-slate-600 text-sm font-medium mb-1.5">{label}</Text>
      <View className="flex-row items-center border border-slate-200 rounded-2xl px-4 bg-slate-50">
        {icon && <Ionicons name={icon as any} size={18} color="#94A3B8" />}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={keyboardType === "email-address" ? "none" : "words"}
          className={`flex-1 py-3.5 text-slate-900 ${icon ? "ml-3" : ""}`}
          placeholderTextColor="#94A3B8"
        />
      </View>
    </View>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <View style={{ backgroundColor: theme.primaryDark }} className="px-5 py-4 flex-row items-center">
      {onBack && (
        <TouchableOpacity onPress={onBack} className="mr-3 w-10 h-10 rounded-xl bg-white/10 items-center justify-center">
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
      )}
      <View className="flex-1">
        <Text className="text-white text-lg font-bold">{title}</Text>
        {subtitle && <Text className="text-indigo-300 text-xs mt-0.5">{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

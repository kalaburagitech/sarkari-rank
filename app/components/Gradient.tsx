import { View, ViewStyle, StyleProp } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { palette } from "../constants/theme";

export const HERO_GRADIENT = [palette.primary[950], palette.primary[800], palette.primary[600]] as const;
export const BRAND_GRADIENT = [palette.primary[500], palette.primary[700]] as const;
export const GOLD_GRADIENT = [palette.accent[400], palette.accent[600]] as const;

/**
 * Navy brand gradient with soft decorative shapes — the "premium" backdrop
 * used by headers, the home hero, feature cards and the auth screens.
 */
export function HeroBackground({
  children,
  style,
  className,
  colors = HERO_GRADIENT,
  glow = true,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  className?: string;
  colors?: readonly [string, string, ...string[]];
  glow?: boolean;
}) {
  return (
    <View style={[{ overflow: "hidden" }, style]} className={className}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      {glow && (
        <>
          <View pointerEvents="none" style={{ position: "absolute", width: 220, height: 220, borderRadius: 110, top: -90, right: -60, backgroundColor: "rgba(255,255,255,0.07)" }} />
          <View pointerEvents="none" style={{ position: "absolute", width: 140, height: 140, borderRadius: 70, top: 30, right: -40, backgroundColor: "rgba(245,163,0,0.16)" }} />
          <View pointerEvents="none" style={{ position: "absolute", width: 180, height: 180, borderRadius: 90, bottom: -110, left: -50, backgroundColor: "rgba(255,255,255,0.05)" }} />
        </>
      )}
      {children}
    </View>
  );
}

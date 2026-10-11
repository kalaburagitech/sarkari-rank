import { View, Text, Image, ImageStyle, ViewStyle } from "react-native";
import { theme, palette } from "../constants/theme";

const emblemSource = require("../assets/icon.png");
const fullLogoSource = require("../assets/logo-full.png");
const FULL_LOGO_RATIO = 800 / 952; // width / height of assets/logo-full.png

type LogoProps = {
  size?: number;
  showText?: boolean;
  subtitle?: string;
  variant?: "light" | "dark";
  style?: ViewStyle;
  imageStyle?: ImageStyle;
};

// Emblem on a white rounded tile (the logo artwork is designed for a white background).
function Emblem({ size, imageStyle }: { size: number; imageStyle?: ImageStyle }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        backgroundColor: "#FFFFFF",
        overflow: "hidden",
      }}
    >
      <Image source={emblemSource} style={[{ width: size, height: size }, imageStyle]} resizeMode="contain" />
    </View>
  );
}

export function Logo({
  size = 64,
  showText = false,
  subtitle,
  variant = "light",
  style,
  imageStyle,
}: LogoProps) {
  const textColor = variant === "light" ? "#FFFFFF" : theme.text;
  const subColor = variant === "light" ? palette.primary[200] : theme.muted;

  return (
    <View className="items-center" style={style}>
      <Emblem size={size} imageStyle={imageStyle} />
      {showText && (
        <View className="items-center mt-3">
          <Text style={{ color: textColor }} className="text-2xl font-black tracking-tight">
            Astraa
          </Text>
          {subtitle && (
            <Text style={{ color: subColor }} className="text-sm mt-1 text-center">
              {subtitle}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

/** Full logo (emblem + "Astraa / EXAM APP" + Kannada tagline) inside a white card. */
export function LogoFull({ width = 200, style }: { width?: number; style?: ViewStyle }) {
  const pad = width * 0.08;
  return (
    <View style={[{ backgroundColor: "#FFFFFF", borderRadius: 24, padding: pad }, style]}>
      <Image
        source={fullLogoSource}
        style={{ width: width - pad * 2, height: (width - pad * 2) / FULL_LOGO_RATIO }}
        resizeMode="contain"
        accessibilityLabel="Astraa Exam App"
      />
    </View>
  );
}

export function LogoRow({
  size = 40,
  subtitle,
  variant = "light",
}: {
  size?: number;
  subtitle?: string;
  variant?: "light" | "dark";
}) {
  const textColor = variant === "light" ? "#FFFFFF" : theme.text;
  const subColor = variant === "light" ? palette.primary[200] : theme.muted;

  return (
    <View className="flex-row items-center">
      <Emblem size={size} />
      <View className="ml-3">
        <Text style={{ color: textColor }} className="text-lg font-black">
          Astraa
        </Text>
        {subtitle && (
          // Android under-measures Kannada (measured before the fallback font
          // loads) and clips the last word; reserve room so it always fits.
          <Text style={{ color: subColor, minWidth: 150 }} className="text-xs">
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
}

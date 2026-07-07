import { View, Text, Image, ImageStyle, ViewStyle } from "react-native";
import { theme } from "../constants/theme";

const logoSource = require("../assets/icon.png");

type LogoProps = {
  size?: number;
  showText?: boolean;
  subtitle?: string;
  variant?: "light" | "dark";
  style?: ViewStyle;
  imageStyle?: ImageStyle;
};

export function Logo({
  size = 64,
  showText = false,
  subtitle,
  variant = "light",
  style,
  imageStyle,
}: LogoProps) {
  const textColor = variant === "light" ? "#FFFFFF" : theme.text;
  const subColor = variant === "light" ? "#C7D2FE" : theme.muted;

  return (
    <View className={`items-center ${showText ? "" : ""}`} style={style}>
      <Image
        source={logoSource}
        style={[
          {
            width: size,
            height: size,
            borderRadius: size * 0.22,
          },
          imageStyle,
        ]}
        resizeMode="cover"
      />
      {showText && (
        <View className="items-center mt-3">
          <Text style={{ color: textColor }} className="text-2xl font-black tracking-tight">
            SarkariRank
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
  const subColor = variant === "light" ? "#C7D2FE" : theme.muted;

  return (
    <View className="flex-row items-center">
      <Image
        source={logoSource}
        style={{ width: size, height: size, borderRadius: size * 0.22 }}
        resizeMode="cover"
      />
      <View className="ml-3">
        <Text style={{ color: textColor }} className="text-lg font-black">
          SarkariRank
        </Text>
        {subtitle && (
          <Text style={{ color: subColor }} className="text-xs">
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
}

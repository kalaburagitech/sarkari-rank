import { forwardRef } from "react";
import { Pressable, PressableProps, View } from "react-native";

// Drop-in replacement for TouchableOpacity. TouchableOpacity fades the whole
// view on press; on Android a card's elevation shadow then shows through as a
// dark flash. This presses in with a slight scale instead (NativeWind's
// `active:` state on Pressable) — no opacity change, so shadows stay clean.

type Props = PressableProps & {
  className?: string;
  activeOpacity?: number; // accepted for TouchableOpacity compatibility, unused
};

export const Touchable = forwardRef<View, Props>(function Touchable(
  { activeOpacity: _ignored, className = "", ...rest },
  ref
) {
  return <Pressable ref={ref} className={`${className} active:scale-[0.97]`} {...rest} />;
});

import { Touchable } from "./Touchable";
import { useState } from "react";
import { View, Text, Image, Modal, ScrollView, ActivityIndicator, TextStyle, useWindowDimensions } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../lib/theme";
import { parseRich, parseInline } from "../lib/rich";

// Renders question / option / passage / explanation text written in the admin
// editor: **bold**, bullet / numbered / a-b-c lists and images (lib/rich.ts).

function Inline({ text, style }: { text: string; style: TextStyle }) {
  return (
    <Text style={style}>
      {parseInline(text).map((r, i) =>
        r.bold ? (
          <Text key={i} style={{ fontWeight: "700" }}>{r.text}</Text>
        ) : (
          r.text
        )
      )}
    </Text>
  );
}

/** Image that sizes itself to its real aspect ratio; tap to view full screen. */
export function RichImage({ uri, maxHeight = 340, zoomable = true }: { uri: string; maxHeight?: number; zoomable?: boolean }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const [ratio, setRatio] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const [zoom, setZoom] = useState(false);

  if (failed) {
    return (
      <View style={{ backgroundColor: colors.surfaceAlt }} className="rounded-xl p-4 my-2 flex-row items-center">
        <Ionicons name="image-outline" size={18} color={colors.textMuted} />
        <Text style={{ color: colors.textMuted }} className="text-xs ml-2 flex-1">
          Image couldn&apos;t load. Check your internet connection and reopen this question.
        </Text>
      </View>
    );
  }

  return (
    <>
      {/* Not zoomable inside an answer option: a tap there must select it. */}
      <Touchable activeOpacity={0.9} onPress={() => setZoom(true)} disabled={!zoomable} className="my-2">
        <View
          style={{ aspectRatio: ratio ?? 4 / 3, maxHeight, backgroundColor: "#fff", borderColor: colors.border }}
          className="w-full rounded-xl border overflow-hidden items-center justify-center"
        >
          <Image
            source={{ uri }}
            resizeMode="contain"
            style={{ width: "100%", height: "100%" }}
            onLoad={(e) => {
              const { width, height } = e.nativeEvent.source;
              if (width && height) setRatio(width / height);
            }}
            onError={() => setFailed(true)}
            accessibilityLabel="Question image"
          />
          {ratio === null && <ActivityIndicator style={{ position: "absolute" }} color={colors.primary} />}
          {zoomable && (
            <View className="absolute bottom-2 right-2 bg-black/50 rounded-full p-1.5">
              <Ionicons name="expand" size={14} color="#fff" />
            </View>
          )}
        </View>
      </Touchable>

      <Modal visible={zoom} transparent animationType="fade" onRequestClose={() => setZoom(false)} statusBarTranslucent>
        <View className="flex-1 bg-black">
          {/* iOS gets pinch-to-zoom from the ScrollView; Android shows it full screen. */}
          <ScrollView
            maximumZoomScale={5}
            minimumZoomScale={1}
            centerContent
            contentContainerStyle={{ flexGrow: 1, alignItems: "center", justifyContent: "center" }}
          >
            <Image source={{ uri }} resizeMode="contain" style={{ width: screenW, height: screenH * 0.85 }} />
          </ScrollView>
          <Touchable
            onPress={() => setZoom(false)}
            hitSlop={12}
            accessibilityLabel="Close image"
            style={{ top: insets.top + 12 }}
            className="absolute right-4 w-10 h-10 rounded-full bg-white/20 items-center justify-center"
          >
            <Ionicons name="close" size={24} color="#fff" />
          </Touchable>
        </View>
      </Modal>
    </>
  );
}

export function RichText({
  text,
  size = 15,
  color,
  weight = "400",
  lineHeight,
}: {
  text?: string;
  size?: number;
  color?: string;
  weight?: TextStyle["fontWeight"];
  lineHeight?: number;
}) {
  const { colors } = useTheme();
  if (!text) return null;
  const base: TextStyle = { color: color ?? colors.text, fontSize: size, lineHeight: lineHeight ?? Math.round(size * 1.6), fontWeight: weight };
  return (
    <View>
      {parseRich(text).map((b, i) => {
        if (b.kind === "gap") return <View key={i} style={{ height: size * 0.6 }} />;
        if (b.kind === "img") return <RichImage key={i} uri={b.url} />;
        if (b.kind === "li")
          return (
            <View key={i} style={{ flexDirection: "row", marginLeft: b.indent * 18, marginTop: 3 }}>
              <Text style={[base, { minWidth: size * 1.7, fontWeight: "600", color: colors.primary }]}>{b.marker}</Text>
              <View style={{ flex: 1 }}>
                <Inline text={b.text} style={base} />
              </View>
            </View>
          );
        return <Inline key={i} text={b.text} style={base} />;
      })}
    </View>
  );
}

/** Comprehension passage shown above the questions that share it. */
export function PassageCard({ text }: { text: string }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(true);
  return (
    <View
      style={{ backgroundColor: colors.scheme === "dark" ? "#2a2110" : "#FFFBEB", borderColor: colors.scheme === "dark" ? "#5c4613" : "#FDE68A" }}
      className="rounded-2xl border mb-3 overflow-hidden"
    >
      <Touchable activeOpacity={0.7} onPress={() => setOpen((o) => !o)} className="flex-row items-center px-4 py-3">
        <Ionicons name="document-text" size={16} color={colors.accentDark} />
        <Text style={{ color: colors.accentDark }} className="font-bold text-xs uppercase tracking-wider ml-2 flex-1">
          Read the passage
        </Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color={colors.accentDark} />
      </Touchable>
      {open && (
        <View className="px-4 pb-4">
          <RichText text={text} size={14.5} />
        </View>
      )}
    </View>
  );
}

/** Passage + question text + question image — the top of every question. */
export function QuestionContent({
  passage,
  text,
  image,
}: {
  passage?: string;
  text?: string;
  image?: string;
}) {
  return (
    <>
      {passage ? <PassageCard text={passage} /> : null}
      <RichText text={text} size={16} weight="500" />
      {image ? <RichImage uri={image} /> : null}
    </>
  );
}

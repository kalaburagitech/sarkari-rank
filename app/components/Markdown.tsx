import React from "react";
import { View, Text, Linking, TextStyle } from "react-native";
import { useTheme } from "../lib/theme";

// Lightweight, dependency-free Markdown renderer tuned for a clean,
// book/PDF-like reading experience. Supports: # ## ### headings, **bold**,
// *italic* / _italic_, `code`, [links](url), bullet & numbered lists,
// > blockquotes, --- horizontal rules, and paragraphs.

type Seg = { t: "text" | "bold" | "italic" | "code" | "link"; v: string; url?: string };

function parseInline(text: string): Seg[] {
  const tokens =
    text.split(/(\*\*.+?\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\)|\*[^*]+\*|_[^_]+_)/g).filter(Boolean);
  return tokens.map((tok) => {
    if (tok.startsWith("**") && tok.endsWith("**")) return { t: "bold", v: tok.slice(2, -2) };
    if (tok.startsWith("`") && tok.endsWith("`")) return { t: "code", v: tok.slice(1, -1) };
    const link = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) return { t: "link", v: link[1], url: link[2] };
    if ((tok.startsWith("*") && tok.endsWith("*")) || (tok.startsWith("_") && tok.endsWith("_")))
      return { t: "italic", v: tok.slice(1, -1) };
    return { t: "text", v: tok };
  });
}

function useInline() {
  const { colors } = useTheme();
  return (text: string, base?: TextStyle) =>
    parseInline(text).map((s, i) => {
      if (s.t === "bold") return <Text key={i} style={[base, { fontWeight: "700" }]}>{s.v}</Text>;
      if (s.t === "italic") return <Text key={i} style={[base, { fontStyle: "italic" }]}>{s.v}</Text>;
      if (s.t === "code")
        return (
          <Text
            key={i}
            style={[base, { fontFamily: "monospace", backgroundColor: colors.surfaceAlt, color: colors.primary }]}
          >
            {" "}{s.v}{" "}
          </Text>
        );
      if (s.t === "link")
        return (
          <Text key={i} style={[base, { color: colors.primary, textDecorationLine: "underline" }]} onPress={() => s.url && Linking.openURL(s.url)}>
            {s.v}
          </Text>
        );
      return <Text key={i} style={base}>{s.v}</Text>;
    });
}

export function Markdown({ content }: { content: string }) {
  const { colors } = useTheme();
  const inline = useInline();
  const lines = (content ?? "").replace(/\r\n/g, "\n").split("\n");

  const blocks: React.ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flushList = (key: string) => {
    if (!list) return;
    const cur = list;
    blocks.push(
      <View key={key} style={{ marginBottom: 14 }}>
        {cur.items.map((it, i) => (
          <View key={i} style={{ flexDirection: "row", marginBottom: 6, paddingRight: 8 }}>
            <Text style={{ color: colors.primary, fontWeight: "700", width: cur.ordered ? 24 : 16, fontSize: 15 }}>
              {cur.ordered ? `${i + 1}.` : "•"}
            </Text>
            <Text style={{ flex: 1, color: colors.text, fontSize: 15.5, lineHeight: 26 }}>
              {inline(it, { color: colors.text, fontSize: 15.5, lineHeight: 26 })}
            </Text>
          </View>
        ))}
      </View>
    );
    list = null;
  };

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    const key = `b${idx}`;

    // list items
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+\.\s+(.*)$/);
    if (bullet) {
      if (!list || list.ordered) { flushList(`${key}-f`); list = { ordered: false, items: [] }; }
      list.items.push(bullet[1]);
      return;
    }
    if (numbered) {
      if (!list || !list.ordered) { flushList(`${key}-f`); list = { ordered: true, items: [] }; }
      list.items.push(numbered[1]);
      return;
    }
    flushList(`${key}-f`);

    if (line.trim() === "") return;

    if (/^#{1,6}\s+/.test(line)) {
      const level = (line.match(/^#+/)?.[0].length ?? 1);
      const txt = line.replace(/^#+\s+/, "");
      const sizes = [23, 20, 17.5, 16, 15, 15];
      blocks.push(
        <Text
          key={key}
          style={{
            color: colors.text,
            fontSize: sizes[Math.min(level, 6) - 1],
            fontWeight: "800",
            marginTop: level <= 2 ? 20 : 14,
            marginBottom: 8,
            lineHeight: sizes[Math.min(level, 6) - 1] * 1.3,
          }}
        >
          {inline(txt)}
        </Text>
      );
      return;
    }

    if (/^>\s?/.test(line)) {
      blocks.push(
        <View key={key} style={{ borderLeftWidth: 3, borderLeftColor: colors.primary, backgroundColor: colors.surfaceAlt, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 14 }}>
          <Text style={{ color: colors.textMuted, fontSize: 15, lineHeight: 24, fontStyle: "italic" }}>
            {inline(line.replace(/^>\s?/, ""), { color: colors.textMuted, fontStyle: "italic" })}
          </Text>
        </View>
      );
      return;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      blocks.push(<View key={key} style={{ height: 1, backgroundColor: colors.border, marginVertical: 18 }} />);
      return;
    }

    // paragraph
    blocks.push(
      <Text key={key} style={{ color: colors.text, fontSize: 15.5, lineHeight: 27, marginBottom: 14 }}>
        {inline(line, { color: colors.text, fontSize: 15.5, lineHeight: 27 })}
      </Text>
    );
  });
  flushList("b-final");

  return <View>{blocks}</View>;
}

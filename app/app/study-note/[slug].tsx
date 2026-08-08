import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "convex/react";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../convex/_generated/api";
import { ScreenHeader, Badge, LoadingScreen } from "../../components/ui";
import { Markdown } from "../../components/Markdown";
import { useTheme } from "../../lib/theme";
import { buildNoteHtml } from "../../lib/notesPdf";

export default function StudyNoteScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const note = useQuery(api.content.getStudyNote, { slug });
  const exams = useQuery(api.exams.listExams, {});
  const [downloading, setDownloading] = useState(false);

  if (note === undefined) return <LoadingScreen message="Loading note..." />;

  const examName = exams?.find((e) => e._id === note?.examId)?.name;
  const words = (note?.content ?? "").trim().split(/\s+/).filter(Boolean).length;
  const readMins = Math.max(1, Math.round(words / 200));

  const handleDownload = async () => {
    if (!note) return;
    setDownloading(true);
    try {
      const html = buildNoteHtml({
        title: note.title,
        subject: note.subject,
        topic: note.topic,
        examName,
        content: note.content,
      });
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: note.title,
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("Saved", `PDF saved to: ${uri}`);
      }
    } catch {
      Alert.alert("Download failed", "Could not generate the PDF. Please try again.");
    }
    setDownloading(false);
  };

  if (!note) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-ink-bg">
        <ScreenHeader title="Study Note" onBack={() => router.back()} />
        <View className="flex-1 items-center justify-center">
          <Text className="text-slate-400">Note not found.</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50 dark:bg-ink-bg">
      <ScreenHeader
        title="Study Note"
        subtitle={note.subject ?? examName}
        onBack={() => router.back()}
        right={
          <TouchableOpacity
            onPress={handleDownload}
            disabled={downloading}
            hitSlop={8}
            className="w-10 h-10 rounded-xl bg-white/10 items-center justify-center"
          >
            {downloading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="download-outline" size={20} color="#fff" />}
          </TouchableOpacity>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Book page */}
        <View
          className="bg-white dark:bg-ink-card rounded-2xl border border-slate-100 dark:border-slate-800"
          style={{ padding: 22, shadowColor: colors.primary, shadowOpacity: colors.scheme === "dark" ? 0.2 : 0.05, shadowRadius: 14, elevation: 2 }}
        >
          {/* Meta */}
          <View className="flex-row flex-wrap gap-2 mb-3">
            {examName ? <Badge label={examName} color={colors.primary} /> : null}
            {note.subject ? <Badge label={note.subject} color="#8B5CF6" /> : null}
            {note.topic ? <Badge label={note.topic} color="#0EA5E9" /> : null}
            {note.isPremium ? <Badge label="Premium" color={colors.accent} /> : <Badge label="Free" color={colors.success} />}
          </View>

          {/* Title */}
          <Text style={{ color: colors.text }} className="text-2xl font-black leading-8">{note.title}</Text>

          <View className="flex-row items-center mt-2 mb-3">
            <Ionicons name="book-outline" size={13} color={colors.textMuted} />
            <Text className="text-slate-400 dark:text-slate-500 text-xs ml-1.5">{readMins} min read · {words} words</Text>
          </View>

          {/* Accent rule */}
          <View style={{ height: 3, width: 52, backgroundColor: colors.primary, borderRadius: 3, marginBottom: 18 }} />

          {note.summary ? (
            <View className="bg-indigo-50 dark:bg-primary-950 border border-indigo-100 dark:border-primary-800 rounded-xl px-4 py-3 mb-5">
              <Text className="text-indigo-900 dark:text-indigo-200 text-[15px] leading-6 italic">{note.summary}</Text>
            </View>
          ) : null}

          {/* Body */}
          <Markdown content={note.content} />
        </View>

        {/* Download CTA */}
        <TouchableOpacity
          onPress={handleDownload}
          disabled={downloading}
          activeOpacity={0.85}
          style={{ backgroundColor: colors.primary }}
          className="rounded-2xl py-4 mt-4 flex-row items-center justify-center"
        >
          {downloading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="download-outline" size={18} color="#fff" />
              <Text className="text-white font-bold text-base ml-2">Download as PDF</Text>
            </>
          )}
        </TouchableOpacity>

        <Text className="text-slate-400 dark:text-slate-500 text-[11px] text-center mt-3 px-6 leading-4">
          For educational use. Verify official information on the respective official government websites.
        </Text>
      </ScrollView>
    </View>
  );
}

import { useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Linking, Dimensions } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "convex/react";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import Pdf from "react-native-pdf";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../convex/_generated/api";
import { ScreenHeader, Badge, LoadingScreen, FilterChip, DisclaimerBanner } from "../../components/ui";
import { Markdown } from "../../components/Markdown";
import { useTheme } from "../../lib/theme";
import { buildNoteHtml } from "../../lib/notesPdf";

export default function StudyNoteScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const note = useQuery(api.content.getStudyNote, { slug });
  const exams = useQuery(api.exams.listExams, {});
  // Sibling notes in the same exam — used to find other language versions of
  // this chapter (same subject + topic).
  const examNotes = useQuery(
    api.content.listStudyNotes,
    note ? { examId: note.examId } : "skip"
  );
  const [downloading, setDownloading] = useState(false);

  // Language versions of THIS chapter (same subject + topic), incl. current.
  const versions = useMemo(() => {
    if (!note) return [];
    return (examNotes ?? [])
      .filter(
        (n) =>
          (n.subject ?? "") === (note.subject ?? "") &&
          (n.topic ?? "") === (note.topic ?? "")
      )
      .sort((a, b) => (a.language ?? "").localeCompare(b.language ?? ""));
  }, [examNotes, note]);

  if (note === undefined) return <LoadingScreen message="Loading note..." />;

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

  const examName = exams?.find((e) => e._id === note.examId)?.name;
  const words = (note.content ?? "").trim().split(/\s+/).filter(Boolean).length;
  const readMins = Math.max(1, Math.round(words / 200));
  const isPdf = !!note.pdfUrl;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      if (isPdf && note.pdfUrl) {
        // Uploaded PDF — open/share the file directly.
        await Linking.openURL(note.pdfUrl);
      } else {
        const html = buildNoteHtml({
          title: note.title,
          subject: note.subject,
          topic: note.topic,
          examName,
          content: note.content ?? "",
        });
        const { uri } = await Print.printToFileAsync({ html });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: note.title, UTI: "com.adobe.pdf" });
        } else {
          Alert.alert("Saved", `PDF saved to: ${uri}`);
        }
      }
    } catch {
      Alert.alert("Download failed", "Could not open the PDF. Please try again.");
    }
    setDownloading(false);
  };

  // Language switcher — only when this chapter exists in more than one language.
  const LanguageBar = () =>
    versions.length > 1 ? (
      <View className="pt-2 pb-1">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {versions.map((v) => (
            <FilterChip
              key={v._id}
              label={v.language ?? "English"}
              active={v.slug === note.slug}
              onPress={() => v.slug !== note.slug && router.replace(`/study-note/${v.slug}`)}
            />
          ))}
        </ScrollView>
      </View>
    ) : null;

  // ── PDF note: full-screen in-app viewer ──
  if (isPdf) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-ink-bg">
        <ScreenHeader
          title={note.subject || "Study Note"}
          subtitle={note.topic || examName}
          onBack={() => router.back()}
          right={
            <TouchableOpacity onPress={handleDownload} hitSlop={8} className="w-10 h-10 rounded-xl bg-white/10 items-center justify-center">
              <Ionicons name="open-outline" size={20} color="#fff" />
            </TouchableOpacity>
          }
        />
        <LanguageBar />
        <View className="flex-1 mx-3 mb-3 mt-1 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
          <Pdf
            source={{ uri: note.pdfUrl!, cache: true }}
            trustAllCerts={false}
            style={{ flex: 1, width: Dimensions.get("window").width - 24, backgroundColor: colors.bg }}
            renderActivityIndicator={() => <ActivityIndicator size="large" color={colors.primary} />}
            onError={() => Alert.alert("PDF error", "This PDF could not be displayed. Tap the open icon to view it in your browser.")}
          />
        </View>
        <Text className="text-slate-400 dark:text-slate-500 text-[11px] text-center mb-3 px-6 leading-4">
          For educational use. Verify official information on the respective official government websites.
        </Text>
      </View>
    );
  }

  // ── Markdown note ──
  return (
    <View className="flex-1 bg-slate-50 dark:bg-ink-bg">
      <ScreenHeader
        title="Study Note"
        subtitle={note.subject ?? examName}
        onBack={() => router.back()}
        right={
          <TouchableOpacity onPress={handleDownload} disabled={downloading} hitSlop={8} className="w-10 h-10 rounded-xl bg-white/10 items-center justify-center">
            {downloading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="download-outline" size={20} color="#fff" />}
          </TouchableOpacity>
        }
      />
      <LanguageBar />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View
          className="bg-white dark:bg-ink-card rounded-2xl border border-slate-100 dark:border-slate-800"
          style={{ padding: 22, shadowColor: colors.primary, shadowOpacity: colors.scheme === "dark" ? 0.2 : 0.05, shadowRadius: 14, elevation: 2 }}
        >
          <View className="flex-row flex-wrap gap-2 mb-3">
            {examName ? <Badge label={examName} color={colors.primary} /> : null}
            {note.subject ? <Badge label={note.subject} color="#8B5CF6" /> : null}
            {note.topic ? <Badge label={note.topic} color="#0EA5E9" /> : null}
            <Badge label={note.language ?? "English"} color={colors.secondary} />
            {note.isPremium ? <Badge label="Premium" color={colors.accent} /> : <Badge label="Free" color={colors.success} />}
          </View>

          <Text style={{ color: colors.text }} className="text-2xl font-black leading-8">{note.title}</Text>

          <View className="flex-row items-center mt-2 mb-3">
            <Ionicons name="book-outline" size={13} color={colors.textMuted} />
            <Text className="text-slate-400 dark:text-slate-500 text-xs ml-1.5">{readMins} min read · {words} words</Text>
          </View>

          <View style={{ height: 3, width: 52, backgroundColor: colors.primary, borderRadius: 3, marginBottom: 18 }} />

          {note.summary ? (
            <View className="bg-indigo-50 dark:bg-primary-950 border border-indigo-100 dark:border-primary-800 rounded-xl px-4 py-3 mb-5">
              <Text className="text-indigo-900 dark:text-indigo-200 text-[15px] leading-6 italic">{note.summary}</Text>
            </View>
          ) : null}

          <Markdown content={note.content ?? ""} />
        </View>

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

        <View className="mt-4">
          <DisclaimerBanner onPress={() => router.push("/disclaimer")} />
        </View>
      </ScrollView>
    </View>
  );
}

import { View, Text, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ScreenHeader, PremiumCard, Badge, LoadingScreen } from "../../components/ui";
import { theme } from "../../constants/theme";

export default function StudyNoteScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const note = useQuery(api.content.getStudyNote, { slug });

  if (note === undefined) return <LoadingScreen message="Loading note..." />;

  return (
    <View className="flex-1 bg-slate-50">
      <ScreenHeader title={note?.title ?? "Study Note"} subtitle={note ? `${note.subject ?? ""}${note.topic ? ` · ${note.topic}` : ""}` : ""} onBack={() => router.back()} />
      <ScrollView className="p-4" showsVerticalScrollIndicator={false}>
        <PremiumCard className="p-5">
          {note?.subject && (
            <View className="flex-row gap-2 mb-4">
              <Badge label={note.subject} color={theme.primary} />
              {note.topic && <Badge label={note.topic} color="#8B5CF6" />}
              {note.isPremium ? <Badge label="Premium" color="#F59E0B" /> : <Badge label="Free" color={theme.success} />}
            </View>
          )}
          <Text className="text-slate-800 text-base leading-7">{note?.content}</Text>
        </PremiumCard>
      </ScrollView>
    </View>
  );
}

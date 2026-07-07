import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useRouter, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenHeader, PremiumCard, Badge, LoadingScreen, EmptyScreen } from "../components/ui";
import { theme } from "../constants/theme";

export default function StudyNotesScreen() {
  const router = useRouter();
  const notes = useQuery(api.content.listStudyNotes, {});

  if (notes === undefined) return <LoadingScreen message="Loading study notes..." />;

  return (
    <View className="flex-1 bg-slate-50">
      <ScreenHeader title="Study Notes" subtitle={`${notes.length} expert notes for exam prep`} onBack={() => router.back()} />
      <ScrollView className="p-4" showsVerticalScrollIndicator={false}>
        {notes.map((note) => (
          <Link key={note._id} href={`/study-note/${note.slug}`} asChild>
            <TouchableOpacity activeOpacity={0.85}>
              <PremiumCard className="p-4 mb-3">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 mr-2">
                    <Text className="font-bold text-slate-900 text-base">{note.title}</Text>
                    {note.subject && (
                      <Text className="text-slate-500 text-xs mt-1">{note.subject}{note.topic ? ` · ${note.topic}` : ""}</Text>
                    )}
                    <Text className="text-slate-400 text-sm mt-2 leading-5" numberOfLines={2}>{note.content}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
                </View>
                <View className="flex-row mt-3 gap-2">
                  {note.isPremium ? <Badge label="Premium" color="#F59E0B" /> : <Badge label="Free" color={theme.success} />}
                </View>
              </PremiumCard>
            </TouchableOpacity>
          </Link>
        ))}
        {notes.length === 0 && <EmptyScreen icon="book-outline" message="No study notes available yet" />}
      </ScrollView>
    </View>
  );
}

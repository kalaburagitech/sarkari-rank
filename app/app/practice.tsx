import { View, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { ScreenHeader, DisclaimerBanner } from "../components/ui";
import { PracticeTree } from "../components/PracticeTree";

export default function PracticeScreen() {
  const router = useRouter();
  return (
    <View className="flex-1 bg-slate-50 dark:bg-ink-bg">
      <ScreenHeader
        title="Practice by Subject"
        subtitle="Choose a subject & chapter to practice"
        onBack={() => router.back()}
      />

      <ScrollView className="px-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32, paddingTop: 12 }}>
        <View className="mb-3">
          <DisclaimerBanner onPress={() => router.push("/disclaimer")} />
        </View>

        <PracticeTree />
      </ScrollView>
    </View>
  );
}

"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { toast } from "sonner";
import { PageHeader, Button, Select, LoadingState, Card, Badge } from "@/components/admin/ui";

export default function DailyQuizAdminPage() {
  const tests = useQuery(api.exams.listTests, {});
  const dailyQuiz = useQuery(api.content.getDailyQuiz, {});
  const setDailyQuiz = useMutation(api.content.setDailyQuiz);
  const [selectedTest, setSelectedTest] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);

  const handleSet = async () => {
    if (!selectedTest) { toast.error("Select a test"); return; }
    setSaving(true);
    try {
      await setDailyQuiz({ date, testId: selectedTest as Id<"tests"> });
      toast.success(`Daily quiz set for ${date}!`);
    } catch (err) { toast.error((err as Error).message); }
    setSaving(false);
  };

  if (tests === undefined) return <LoadingState />;

  return (
    <div>
      <PageHeader title="Daily Quiz" description="Assign today's quiz — shown on mobile app home screen" />
      {dailyQuiz?.test && (
        <Card className="p-4 mb-6 bg-emerald-50 border-emerald-200">
          <p className="text-sm text-emerald-800">✅ Today&apos;s quiz: <strong>{dailyQuiz.test.title}</strong> ({dailyQuiz.test.totalQuestions} questions)</p>
        </Card>
      )}
      <Card className="p-6 max-w-lg space-y-4">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
        <Select label="Select Test" value={selectedTest} onChange={(e) => setSelectedTest(e.target.value)}>
          <option value="">Choose test for daily quiz</option>
          {tests?.map((t) => <option key={t._id} value={t._id}>{t.title} ({t.type})</option>)}
        </Select>
        <Button onClick={handleSet} disabled={saving}>{saving ? "Setting..." : "Set Daily Quiz"}</Button>
      </Card>
    </div>
  );
}

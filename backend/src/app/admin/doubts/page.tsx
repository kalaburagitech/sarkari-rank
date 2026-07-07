"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { toast } from "sonner";
import { PageHeader, LoadingState, EmptyState, Card, Button, Textarea } from "@/components/admin/ui";

export default function DoubtsPage() {
  const doubts = useQuery(api.content.listDoubts, { status: "pending" });
  const answerDoubt = useMutation(api.content.answerDoubt);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const handleAnswer = async (id: string) => {
    const answer = answers[id];
    if (!answer?.trim()) { toast.error("Enter an answer"); return; }
    setSaving(id);
    try {
      await answerDoubt({ id: id as any, answer });
      toast.success("Doubt answered!");
      setAnswers({ ...answers, [id]: "" });
    } catch (err) { toast.error((err as Error).message); }
    setSaving(null);
  };

  if (doubts === undefined) return <LoadingState />;

  return (
    <div>
      <PageHeader title="Pending Doubts" description={`${doubts.length} doubts awaiting answer`} />
      {doubts.length === 0 ? <EmptyState message="No pending doubts. Great job!" /> : (
        <div className="space-y-4">
          {doubts.map((doubt) => (
            <Card key={doubt._id} className="p-5">
              <p className="font-medium text-slate-900">{doubt.questionText}</p>
              <p className="text-xs text-slate-400 mt-1">{new Date(doubt.createdAt).toLocaleString()}</p>
              <div className="flex gap-2 mt-3">
                <Textarea placeholder="Type your answer..." value={answers[doubt._id] ?? ""} onChange={(e) => setAnswers({ ...answers, [doubt._id]: e.target.value })} rows={2} className="flex-1" />
                <Button onClick={() => handleAnswer(doubt._id)} disabled={saving === doubt._id}>{saving === doubt._id ? "..." : "Answer"}</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Plus, Trash2, FileJson } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Button, FormCard, Input, Textarea, Select, LoadingState, EmptyState, Card, Badge } from "@/components/admin/ui";
import { BulkImportQuestions } from "@/components/admin/BulkImportQuestions";

export default function QuestionsPage() {
  const tests = useQuery(api.exams.listTests, {});
  const [selectedTestId, setSelectedTestId] = useState("");
  const questions = useQuery(api.exams.listQuestions, selectedTestId ? { testId: selectedTestId as Id<"tests">, includeAnswers: true } : "skip");
  const createQuestion = useMutation(api.exams.createQuestion);
  const deleteQuestion = useMutation(api.exams.deleteQuestion);

  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    questionText: "", options: [{ id: "a", text: "" }, { id: "b", text: "" }, { id: "c", text: "" }, { id: "d", text: "" }],
    correctOptionId: "a", explanation: "", subject: "", difficulty: "medium" as "easy" | "medium" | "hard", marks: 2, negativeMarks: 0.5, language: "English",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTestId || !form.questionText.trim()) { toast.error("Select test and enter question"); return; }
    if (form.options.some((o) => !o.text.trim())) { toast.error("All options required"); return; }
    setSaving(true);
    try {
      await createQuestion({ testId: selectedTestId as Id<"tests">, ...form, order: (questions?.length ?? 0) + 1 });
      toast.success("Question added!");
      setForm({ questionText: "", options: [{ id: "a", text: "" }, { id: "b", text: "" }, { id: "c", text: "" }, { id: "d", text: "" }],
        correctOptionId: "a", explanation: "", subject: "", difficulty: "medium", marks: 2, negativeMarks: 0.5, language: "English" });
      setShowForm(false);
    } catch (err) { toast.error((err as Error).message); }
    setSaving(false);
  };

  const updateOption = (idx: number, text: string) => {
    const opts = [...form.options]; opts[idx] = { ...opts[idx], text }; setForm({ ...form, options: opts });
  };

  if (tests === undefined) return <LoadingState />;

  return (
    <div>
      <PageHeader title="Question Bank" description="All MCQs stored in Convex database — students see live data in the mobile app"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => { setShowImport(!showImport); setShowForm(false); }}><FileJson size={16} /> Import JSON</Button>
            <Button onClick={() => { setShowForm(!showForm); setShowImport(false); }} disabled={!selectedTestId}><Plus size={16} /> Add Question</Button>
          </div>
        } />

      {showImport && <BulkImportQuestions onClose={() => setShowImport(false)} onDone={() => {}} />}

      <Card className="p-4 mb-6">
        <Select label="Select Test to manage questions" value={selectedTestId} onChange={(e) => { setSelectedTestId(e.target.value); setShowForm(false); }}>
          <option value="">— Choose a test —</option>
          {tests?.map((t) => <option key={t._id} value={t._id}>{t.title} ({t.totalQuestions} questions)</option>)}
        </Select>
      </Card>

      {showForm && selectedTestId && (
        <FormCard title="Add New Question" onSubmit={handleSubmit}>
          <Textarea label="Question Text *" value={form.questionText} onChange={(e) => setForm({ ...form, questionText: e.target.value })} rows={3} required />
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Options (select correct answer)</p>
            {form.options.map((opt, idx) => (
              <div key={opt.id} className="flex items-center gap-3">
                <input type="radio" name="correct" checked={form.correctOptionId === opt.id} onChange={() => setForm({ ...form, correctOptionId: opt.id })} />
                <span className="font-bold text-sm w-5">{opt.id.toUpperCase()}.</span>
                <Input placeholder={`Option ${opt.id.toUpperCase()}`} value={opt.text} onChange={(e) => updateOption(idx, e.target.value)} required />
              </div>
            ))}
          </div>
          <Textarea label="Explanation (shown after test)" value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} rows={2} />
          <div className="grid grid-cols-4 gap-3">
            <Input label="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            <Select label="Difficulty" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value as typeof form.difficulty })}>
              <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
            </Select>
            <Input label="Marks" type="number" value={form.marks} onChange={(e) => setForm({ ...form, marks: parseFloat(e.target.value) })} />
            <Input label="Negative" type="number" step="0.25" value={form.negativeMarks} onChange={(e) => setForm({ ...form, negativeMarks: parseFloat(e.target.value) })} />
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Add Question"}</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </FormCard>
      )}

      {selectedTestId && questions === undefined && <LoadingState />}
      {selectedTestId && questions?.length === 0 && <EmptyState message="No questions in this test yet." action={<Button onClick={() => setShowForm(true)}><Plus size={16} /> Add First Question</Button>} />}
      {questions && questions.length > 0 && (
        <div className="space-y-3">
          {questions.map((q, idx) => (
            <Card key={q._id} className="p-5">
              <div className="flex justify-between">
                <div className="flex-1">
                  <p className="text-xs text-slate-400 mb-1">Q{idx + 1} · {q.subject} · <Badge color={q.difficulty === "easy" ? "green" : q.difficulty === "hard" ? "red" : "amber"}>{q.difficulty}</Badge></p>
                  <p className="font-medium text-slate-900 mb-3">{q.questionText}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {q.options.map((opt) => (
                      <p key={opt.id} className={`text-sm px-3 py-2 rounded-lg ${"correctOptionId" in q && q.correctOptionId === opt.id ? "bg-emerald-100 text-emerald-800 font-medium" : "bg-slate-50 text-slate-600"}`}>
                        {opt.id.toUpperCase()}. {opt.text}
                      </p>
                    ))}
                  </div>
                </div>
                <button onClick={async () => { if (confirm("Delete?")) { await deleteQuestion({ id: q._id }); toast.success("Deleted"); } }}
                  className="p-2 hover:bg-red-50 rounded-lg text-red-500 ml-4 h-fit"><Trash2 size={16} /></button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

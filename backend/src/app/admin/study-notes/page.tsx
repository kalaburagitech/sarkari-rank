"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Button, FormCard, Input, Textarea, Select, LoadingState, EmptyState, Card } from "@/components/admin/ui";
import { slugify } from "@/lib/utils";

export default function StudyNotesPage() {
  const exams = useQuery(api.exams.listExams, {});
  const notes = useQuery(api.content.listStudyNotes, { includeInactive: true });
  const createNote = useMutation(api.content.createStudyNote);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ examId: "", title: "", content: "", subject: "", topic: "", isPremium: false });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.examId || !form.title.trim() || !form.content.trim()) { toast.error("All fields required"); return; }
    setSaving(true);
    try {
      await createNote({ examId: form.examId as Id<"exams">, title: form.title, slug: slugify(form.title), content: form.content, subject: form.subject, topic: form.topic, isPremium: form.isPremium });
      toast.success("Study note published!");
      setShowForm(false);
      setForm({ examId: "", title: "", content: "", subject: "", topic: "", isPremium: false });
    } catch (err) { toast.error((err as Error).message); }
    setSaving(false);
  };

  if (notes === undefined) return <LoadingState />;

  return (
    <div>
      <PageHeader title="Study Notes" description={`${notes.length} study notes`}
        action={<Button onClick={() => setShowForm(!showForm)}><Plus size={16} /> Add Note</Button>} />

      {showForm && (
        <FormCard title="Create Study Note" onSubmit={handleSubmit}>
          <Select label="Exam *" value={form.examId} onChange={(e) => setForm({ ...form, examId: e.target.value })} required>
            <option value="">Select Exam</option>
            {exams?.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}
          </Select>
          <Input label="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <Textarea label="Content *" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={6} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            <Input label="Topic" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isPremium} onChange={(e) => setForm({ ...form, isPremium: e.target.checked })} /> Premium only</label>
          <div className="flex gap-3">
            <Button type="submit" disabled={saving}>{saving ? "Publishing..." : "Publish Note"}</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </FormCard>
      )}

      {notes.length === 0 ? <EmptyState message="No study notes yet." /> : (
        <div className="space-y-3">
          {notes.map((note) => (
            <Card key={note._id} className="p-5">
              <h3 className="font-semibold">{note.title}</h3>
              <p className="text-sm text-slate-500">{note.subject} · {note.topic}</p>
              <p className="text-sm mt-2 text-slate-600 line-clamp-3">{note.content}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

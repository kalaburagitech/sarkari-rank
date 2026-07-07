"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Button, FormCard, Input, Textarea, Select, LoadingState, EmptyState, Card, Badge } from "@/components/admin/ui";
import { slugify } from "@/lib/utils";

export default function TestSeriesPage() {
  const exams = useQuery(api.exams.listExams, {});
  const series = useQuery(api.exams.listTestSeries, { includeInactive: true });
  const createSeries = useMutation(api.exams.createTestSeries);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ examId: "", title: "", description: "", isFree: false, isPremium: true, price: 499, languages: ["English", "Hindi"], tags: ["Full Length"] });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.examId || !form.title.trim()) { toast.error("Exam and title required"); return; }
    setSaving(true);
    try {
      await createSeries({ examId: form.examId as Id<"exams">, title: form.title, slug: slugify(form.title), description: form.description,
        isFree: form.isFree, isPremium: form.isPremium, price: form.price, languages: form.languages, tags: form.tags });
      toast.success(`Test series "${form.title}" created!`);
      setShowForm(false);
    } catch (err) { toast.error((err as Error).message); }
    setSaving(false);
  };

  if (series === undefined) return <LoadingState />;

  return (
    <div>
      <PageHeader title="Test Series" description={`${series.length} test series bundles`}
        action={<Button onClick={() => setShowForm(!showForm)}><Plus size={16} /> Create Series</Button>} />

      {showForm && (
        <FormCard title="Create Test Series" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Exam *" value={form.examId} onChange={(e) => setForm({ ...form, examId: e.target.value })} required>
              <option value="">Select Exam</option>
              {exams?.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}
            </Select>
            <Input label="Series Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <div className="col-span-2"><Textarea label="Description *" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} required /></div>
            <Input label="Price (₹)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) })} />
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={saving}>{saving ? "Creating..." : "Create Series"}</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </FormCard>
      )}

      {series.length === 0 ? <EmptyState message="No test series yet." /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {series.map((s) => (
            <Card key={s._id} className="p-5 hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-slate-900">{s.title}</h3>
              <p className="text-sm text-slate-500 mt-1">{s.description}</p>
              <div className="flex gap-2 mt-3">
                <Badge color="indigo">{s.totalTests} tests</Badge>
                <Badge color="green">₹{s.price}</Badge>
                {s.isPremium && <Badge color="amber">Premium</Badge>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

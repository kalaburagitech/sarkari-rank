"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Button, FormCard, Input, Textarea, Select, LoadingState, EmptyState, TableWrap, Badge } from "@/components/admin/ui";
import { slugify } from "@/lib/utils";

export default function ExamsPage() {
  const categories = useQuery(api.exams.listCategories, {});
  const exams = useQuery(api.exams.listExams, { includeInactive: true });
  const createExam = useMutation(api.exams.createExam);
  const deleteExam = useMutation(api.exams.deleteExam);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ categoryId: "", name: "", description: "", order: 1 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categoryId || !form.name.trim()) { toast.error("Category and name are required"); return; }
    setSaving(true);
    try {
      await createExam({ categoryId: form.categoryId as Id<"examCategories">, name: form.name, slug: slugify(form.name), description: form.description, order: form.order });
      toast.success(`Exam "${form.name}" created!`);
      setShowForm(false);
      setForm({ categoryId: "", name: "", description: "", order: 1 });
    } catch (err) { toast.error((err as Error).message); }
    setSaving(false);
  };

  const getCategoryName = (id: string) => categories?.find((c) => c._id === id)?.name ?? "—";

  if (exams === undefined || categories === undefined) return <LoadingState />;

  return (
    <div>
      <PageHeader title="Exams" description={`${exams.length} exams across all categories`}
        action={<Button onClick={() => setShowForm(!showForm)}><Plus size={16} /> Add Exam</Button>} />

      {showForm && (
        <FormCard title="Create New Exam" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Category *" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required>
              <option value="">Select Category</option>
              {categories?.map((c) => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}
            </Select>
            <Input label="Exam Name *" placeholder="e.g. SSC CGL" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <div className="col-span-2"><Textarea label="Description *" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} required /></div>
            <Input label="Order" type="number" value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) })} />
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Create Exam"}</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </FormCard>
      )}

      {exams.length === 0 ? <EmptyState message="No exams yet." action={<Button onClick={() => setShowForm(true)}><Plus size={16} /> Add Exam</Button>} /> : (
        <TableWrap>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b"><tr>{["Exam", "Category", "Tests", "Status", "Actions"].map((h) => <th key={h} className="text-left p-4 font-semibold text-slate-600">{h}</th>)}</tr></thead>
            <tbody>
              {exams.map((exam) => (
                <tr key={exam._id} className="border-b border-slate-50 hover:bg-indigo-50/30">
                  <td className="p-4 font-medium text-slate-900">{exam.name}</td>
                  <td className="p-4 text-slate-500">{getCategoryName(exam.categoryId)}</td>
                  <td className="p-4"><Badge color="blue">{exam.totalTests} tests</Badge></td>
                  <td className="p-4"><Badge color={exam.isActive ? "green" : "red"}>{exam.isActive ? "Active" : "Inactive"}</Badge></td>
                  <td className="p-4">
                    <button onClick={async () => { if (confirm("Deactivate?")) { await deleteExam({ id: exam._id }); toast.success("Deactivated"); } }}
                      className="p-2 hover:bg-red-50 rounded-lg text-red-500"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}
    </div>
  );
}

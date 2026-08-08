"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Button, FormCard, Input, Textarea, Select, LoadingState, EmptyState, TableWrap, Badge } from "@/components/admin/ui";
import { ActionMenu, ConfirmDialog, Modal } from "@/components/admin/ui-extras";
import { slugify } from "@/lib/utils";

type ExamForm = {
  categoryId: string; name: string; description: string; icon: string; order: number;
  conductingBody: string; officialWebsite: string; eligibility: string; posts: string;
  examPattern: string; syllabus: string; isActive: boolean;
};
const emptyForm: ExamForm = {
  categoryId: "", name: "", description: "", icon: "", order: 1,
  conductingBody: "", officialWebsite: "", eligibility: "", posts: "", examPattern: "", syllabus: "", isActive: true,
};

// posts is a string[] in the schema; the form edits it as a comma-separated string.
const splitPosts = (s: string) => s.split(",").map((p) => p.trim()).filter(Boolean);

export default function ExamsPage() {
  const categories = useQuery(api.exams.listCategories, {});
  const exams = useQuery(api.exams.listExams, { includeInactive: true });
  const createExam = useMutation(api.exams.createExam);
  const updateExam = useMutation(api.exams.updateExam);
  const deleteExam = useMutation(api.exams.deleteExam);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ExamForm>(emptyForm);

  const [editRow, setEditRow] = useState<({ _id: string } & ExamForm) | null>(null);
  const [deleteRow, setDeleteRow] = useState<{ _id: string; name: string } | null>(null);

  const buildFields = (f: ExamForm) => ({
    name: f.name, description: f.description, order: f.order,
    icon: f.icon.trim() || undefined,
    conductingBody: f.conductingBody.trim() || undefined,
    officialWebsite: f.officialWebsite.trim() || undefined,
    eligibility: f.eligibility.trim() || undefined,
    posts: splitPosts(f.posts).length ? splitPosts(f.posts) : undefined,
    examPattern: f.examPattern.trim() || undefined,
    syllabus: f.syllabus.trim() || undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categoryId || !form.name.trim()) { toast.error("Category and name are required"); return; }
    setSaving(true);
    try {
      await createExam({ categoryId: form.categoryId as Id<"examCategories">, slug: slugify(form.name), ...buildFields(form) });
      toast.success(`Exam "${form.name}" created!`);
      setShowForm(false);
      setForm(emptyForm);
    } catch (err) { toast.error((err as Error).message); }
    setSaving(false);
  };

  const saveEdit = async () => {
    if (!editRow) return;
    setSaving(true);
    try {
      await updateExam({
        id: editRow._id as Id<"exams">,
        categoryId: editRow.categoryId ? (editRow.categoryId as Id<"examCategories">) : undefined,
        isActive: editRow.isActive,
        ...buildFields(editRow),
      });
      toast.success("Exam updated");
      setEditRow(null);
    } catch (err) { toast.error((err as Error).message); }
    setSaving(false);
  };

  const getCategoryName = (id: string) => categories?.find((c) => c._id === id)?.name ?? "—";

  if (exams === undefined || categories === undefined) return <LoadingState />;

  // A render helper (NOT a component) so controlled inputs keep focus across keystrokes.
  const fields = (f: ExamForm, set: (f: ExamForm) => void) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Select label="Category *" value={f.categoryId} onChange={(e) => set({ ...f, categoryId: e.target.value })}>
        <option value="">Select Category</option>
        {categories?.map((c) => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}
      </Select>
      <Input label="Exam Name *" placeholder="e.g. SSC CGL" value={f.name} onChange={(e) => set({ ...f, name: e.target.value })} />
      <div className="sm:col-span-2"><Textarea label="Description *" value={f.description} onChange={(e) => set({ ...f, description: e.target.value })} rows={2} /></div>
      <Input label="Icon (emoji)" value={f.icon} onChange={(e) => set({ ...f, icon: e.target.value })} />
      <Input label="Order" type="number" value={f.order} onChange={(e) => set({ ...f, order: parseInt(e.target.value) || 0 })} />
      <Input label="Conducting Body" placeholder="e.g. Staff Selection Commission" value={f.conductingBody} onChange={(e) => set({ ...f, conductingBody: e.target.value })} />
      <Input label="Official Website" placeholder="ssc.nic.in" value={f.officialWebsite} onChange={(e) => set({ ...f, officialWebsite: e.target.value })} />
      <div className="sm:col-span-2"><Input label="Posts (comma-separated)" placeholder="Inspector, Auditor, Assistant" value={f.posts} onChange={(e) => set({ ...f, posts: e.target.value })} /></div>
      <div className="sm:col-span-2"><Textarea label="Eligibility" value={f.eligibility} onChange={(e) => set({ ...f, eligibility: e.target.value })} rows={2} /></div>
      <div className="sm:col-span-2"><Textarea label="Exam Pattern" value={f.examPattern} onChange={(e) => set({ ...f, examPattern: e.target.value })} rows={2} /></div>
      <div className="sm:col-span-2"><Textarea label="Syllabus" value={f.syllabus} onChange={(e) => set({ ...f, syllabus: e.target.value })} rows={2} /></div>
    </div>
  );

  return (
    <div>
      <PageHeader title="Exams" description={`${exams.length} exams across all categories`}
        action={<Button onClick={() => setShowForm(!showForm)}><Plus size={16} /> Add Exam</Button>} />

      {showForm && (
        <FormCard title="Create New Exam" onSubmit={handleSubmit}>
          {fields(form, setForm)}
          <div className="flex gap-3">
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Create Exam"}</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </FormCard>
      )}

      {exams.length === 0 ? <EmptyState message="No exams yet." action={<Button onClick={() => setShowForm(true)}><Plus size={16} /> Add Exam</Button>} /> : (
        <TableWrap>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b"><tr>{["Exam", "Category", "Tests", "Status", ""].map((h, i) => <th key={i} className="text-left p-4 font-semibold text-slate-600">{h}</th>)}</tr></thead>
            <tbody>
              {exams.map((exam) => (
                <tr key={exam._id} className="border-b border-slate-50 hover:bg-indigo-50/30">
                  <td className="p-4 font-medium text-slate-900">{exam.name}</td>
                  <td className="p-4 text-slate-500">{getCategoryName(exam.categoryId)}</td>
                  <td className="p-4"><Badge color="blue">{exam.totalTests} tests</Badge></td>
                  <td className="p-4"><Badge color={exam.isActive ? "green" : "red"}>{exam.isActive ? "Active" : "Inactive"}</Badge></td>
                  <td className="p-4">
                    <ActionMenu items={[
                      { label: "Edit", icon: Pencil, onClick: () => setEditRow({
                          _id: exam._id, categoryId: exam.categoryId, name: exam.name, description: exam.description,
                          icon: exam.icon ?? "", order: exam.order ?? 1, conductingBody: exam.conductingBody ?? "",
                          officialWebsite: exam.officialWebsite ?? "", eligibility: exam.eligibility ?? "",
                          posts: (exam.posts ?? []).join(", "), examPattern: exam.examPattern ?? "", syllabus: exam.syllabus ?? "", isActive: exam.isActive,
                        }) },
                      { label: exam.isActive ? "Deactivate" : "Activate", icon: Trash2, danger: exam.isActive, onClick: () => exam.isActive ? setDeleteRow({ _id: exam._id, name: exam.name }) : updateExam({ id: exam._id, isActive: true }).then(() => toast.success("Activated")) },
                    ]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}

      {editRow && (
        <Modal open={!!editRow} onOpenChange={(o) => !o && setEditRow(null)} title="Edit Exam" wide>
          <div className="space-y-4">
            {fields(editRow, (f) => setEditRow({ ...editRow, ...f }))}
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={editRow.isActive} onChange={(e) => setEditRow({ ...editRow, isActive: e.target.checked })} /> Active</label>
            <div className="flex gap-3">
              <Button onClick={saveEdit} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
              <Button variant="secondary" onClick={() => setEditRow(null)}>Cancel</Button>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleteRow}
        onOpenChange={(o) => !o && setDeleteRow(null)}
        title={`Deactivate "${deleteRow?.name}"?`}
        description="The exam will be hidden from the app. You can re-activate it later by editing it."
        confirmLabel="Deactivate"
        danger
        onConfirm={async () => {
          if (!deleteRow) return;
          await deleteExam({ id: deleteRow._id as Id<"exams"> });
          toast.success("Exam deactivated");
          setDeleteRow(null);
        }}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Button, FormCard, Input, Textarea, Select, LoadingState, EmptyState, Card, Badge } from "@/components/admin/ui";
import { ActionMenu, ConfirmDialog, Modal, usePagination, Pagination } from "@/components/admin/ui-extras";
import { slugify } from "@/lib/utils";

const TEST_TYPES = ["mock", "live", "chapter", "subject", "pyp", "daily", "practice"] as const;

type EditForm = {
  _id: string; title: string; description: string; year: string;
  durationMinutes: number; totalMarks: number; negativeMarking: number;
  isFree: boolean; isPremium: boolean; isActive: boolean;
};

export default function TestsPage() {
  const exams = useQuery(api.exams.listExams, {});
  const tests = useQuery(api.exams.listTests, { includeInactive: true });
  const createTest = useMutation(api.exams.createTest);
  const updateTest = useMutation(api.exams.updateTest);
  const deleteTest = useMutation(api.exams.deleteTest);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    examId: "", title: "", description: "", type: "mock" as typeof TEST_TYPES[number],
    durationMinutes: 60, totalMarks: 100, negativeMarking: 0.25, languages: ["English", "Hindi"], isFree: true, isPremium: false,
  });

  const [editRow, setEditRow] = useState<EditForm | null>(null);
  const [deleteRow, setDeleteRow] = useState<{ _id: string; title: string } | null>(null);
  const pager = usePagination(tests ?? [], 12);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.examId || !form.title.trim()) { toast.error("Exam and title required"); return; }
    setSaving(true);
    try {
      await createTest({ examId: form.examId as Id<"exams">, title: form.title, slug: slugify(form.title), description: form.description, type: form.type,
        durationMinutes: form.durationMinutes, totalMarks: form.totalMarks, negativeMarking: form.negativeMarking, languages: form.languages, isFree: form.isFree, isPremium: form.isPremium });
      toast.success(`Test "${form.title}" created! Add questions next.`);
      setShowForm(false);
    } catch (err) { toast.error((err as Error).message); }
    setSaving(false);
  };

  const saveEdit = async () => {
    if (!editRow) return;
    setSaving(true);
    try {
      await updateTest({
        id: editRow._id as Id<"tests">,
        title: editRow.title, description: editRow.description,
        year: editRow.year ? parseInt(editRow.year) : undefined,
        durationMinutes: editRow.durationMinutes, totalMarks: editRow.totalMarks, negativeMarking: editRow.negativeMarking,
        isFree: editRow.isFree, isPremium: editRow.isPremium, isActive: editRow.isActive,
      });
      toast.success("Test updated");
      setEditRow(null);
    } catch (err) { toast.error((err as Error).message); }
    setSaving(false);
  };

  const getExamName = (id: string) => exams?.find((e) => e._id === id)?.name ?? "—";
  const typeColors: Record<string, string> = { mock: "indigo", live: "red", chapter: "blue", subject: "green", pyp: "amber", daily: "amber", practice: "blue" };

  if (tests === undefined) return <LoadingState />;

  return (
    <div>
      <PageHeader title="Tests & Quizzes" description={`${tests.length} tests · Mock, Live, PYP, Chapter, Daily`}
        action={<Button onClick={() => setShowForm(!showForm)}><Plus size={16} /> Create Test</Button>} />

      {showForm && (
        <FormCard title="Create New Test" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Exam *" value={form.examId} onChange={(e) => setForm({ ...form, examId: e.target.value })} required>
              <option value="">Select Exam</option>
              {exams?.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}
            </Select>
            <Select label="Test Type *" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as typeof form.type })}>
              {TEST_TYPES.map((t) => <option key={t} value={t}>{t.toUpperCase()}</option>)}
            </Select>
            <div className="sm:col-span-2"><Input label="Test Title *" placeholder="SSC CGL Mock Test 1" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
            <Input label="Duration (min)" type="number" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: parseInt(e.target.value) || 0 })} />
            <Input label="Total Marks" type="number" value={form.totalMarks} onChange={(e) => setForm({ ...form, totalMarks: parseInt(e.target.value) || 0 })} />
            <Input label="Negative Marking" type="number" step="0.25" value={form.negativeMarking} onChange={(e) => setForm({ ...form, negativeMarking: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isFree} onChange={(e) => setForm({ ...form, isFree: e.target.checked })} /> Free</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isPremium} onChange={(e) => setForm({ ...form, isPremium: e.target.checked })} /> Premium</label>
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={saving}>{saving ? "Creating..." : "Create Test"}</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </FormCard>
      )}

      {tests.length === 0 ? <EmptyState message="No tests yet. Create your first test above." /> : (
        <div className="grid gap-3">
          {pager.pageItems.map((test) => (
            <Card key={test._id} className="p-5 flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge color={typeColors[test.type] as any}>{test.type.toUpperCase()}</Badge>
                  {test.isFree ? <Badge color="green">FREE</Badge> : <Badge color="amber">PREMIUM</Badge>}
                  {!test.isActive && <Badge color="red">Inactive</Badge>}
                </div>
                <h3 className="font-semibold text-slate-900">{test.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{getExamName(test.examId)} · {test.totalQuestions} Qs · {test.durationMinutes} min · {test.totalMarks} marks</p>
              </div>
              <ActionMenu items={[
                { label: "Edit", icon: Pencil, onClick: () => setEditRow({
                    _id: test._id, title: test.title, description: test.description ?? "",
                    year: test.year ? String(test.year) : "", durationMinutes: test.durationMinutes,
                    totalMarks: test.totalMarks, negativeMarking: test.negativeMarking,
                    isFree: test.isFree, isPremium: test.isPremium, isActive: test.isActive,
                  }) },
                { label: test.isActive ? "Deactivate" : "Activate", icon: Trash2, danger: test.isActive, onClick: () => test.isActive ? setDeleteRow({ _id: test._id, title: test.title }) : updateTest({ id: test._id, isActive: true }).then(() => toast.success("Activated")) },
              ]} />
            </Card>
          ))}
          <Pagination page={pager.page} totalPages={pager.totalPages} onChange={pager.setPage} from={pager.from} to={pager.to} total={pager.total} label="tests" />
        </div>
      )}

      {editRow && (
        <Modal open={!!editRow} onOpenChange={(o) => !o && setEditRow(null)} title="Edit Test" wide>
          <div className="space-y-4">
            <Input label="Test Title" value={editRow.title} onChange={(e) => setEditRow({ ...editRow, title: e.target.value })} />
            <Textarea label="Description" value={editRow.description} onChange={(e) => setEditRow({ ...editRow, description: e.target.value })} rows={2} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Year (for PYP)" type="number" placeholder="2024" value={editRow.year} onChange={(e) => setEditRow({ ...editRow, year: e.target.value })} />
              <Input label="Duration (min)" type="number" value={editRow.durationMinutes} onChange={(e) => setEditRow({ ...editRow, durationMinutes: parseInt(e.target.value) || 0 })} />
              <Input label="Total Marks" type="number" value={editRow.totalMarks} onChange={(e) => setEditRow({ ...editRow, totalMarks: parseInt(e.target.value) || 0 })} />
              <Input label="Negative Marking" type="number" step="0.25" value={editRow.negativeMarking} onChange={(e) => setEditRow({ ...editRow, negativeMarking: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editRow.isFree} onChange={(e) => setEditRow({ ...editRow, isFree: e.target.checked })} /> Free</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editRow.isPremium} onChange={(e) => setEditRow({ ...editRow, isPremium: e.target.checked })} /> Premium</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editRow.isActive} onChange={(e) => setEditRow({ ...editRow, isActive: e.target.checked })} /> Active</label>
            </div>
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
        title={`Deactivate "${deleteRow?.title}"?`}
        description="The test will be hidden from the app. You can re-activate it later by editing it."
        confirmLabel="Deactivate"
        danger
        onConfirm={async () => {
          if (!deleteRow) return;
          await deleteTest({ id: deleteRow._id as Id<"tests"> });
          toast.success("Test deactivated");
          setDeleteRow(null);
        }}
      />
    </div>
  );
}

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

type EditForm = {
  _id: string; title: string; description: string; price: number;
  isFree: boolean; isPremium: boolean; languages: string; tags: string; isActive: boolean;
};
const splitList = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

export default function TestSeriesPage() {
  const exams = useQuery(api.exams.listExams, {});
  const series = useQuery(api.exams.listTestSeries, { includeInactive: true });
  const createSeries = useMutation(api.exams.createTestSeries);
  const updateSeries = useMutation(api.exams.updateTestSeries);
  const deleteSeriesCascade = useMutation(api.exams.deleteTestSeriesCascade);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ examId: "", title: "", description: "", isFree: false, isPremium: true, price: 499, languages: ["English", "Hindi"], tags: ["Full Length"] });

  const [editRow, setEditRow] = useState<EditForm | null>(null);
  const [deleteRow, setDeleteRow] = useState<{ _id: string; title: string } | null>(null);
  const pager = usePagination(series ?? [], 12);

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

  const saveEdit = async () => {
    if (!editRow) return;
    setSaving(true);
    try {
      await updateSeries({
        id: editRow._id as Id<"testSeries">,
        title: editRow.title, description: editRow.description, price: editRow.price,
        isFree: editRow.isFree, isPremium: editRow.isPremium,
        languages: splitList(editRow.languages), tags: splitList(editRow.tags), isActive: editRow.isActive,
      });
      toast.success("Test series updated");
      setEditRow(null);
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Exam *" value={form.examId} onChange={(e) => setForm({ ...form, examId: e.target.value })} required>
              <option value="">Select Exam</option>
              {exams?.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}
            </Select>
            <Input label="Series Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <div className="sm:col-span-2"><Textarea label="Description *" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} required /></div>
            <Input label="Price (₹)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })} />
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={saving}>{saving ? "Creating..." : "Create Series"}</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </FormCard>
      )}

      {series.length === 0 ? <EmptyState message="No test series yet." /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pager.pageItems.map((s) => (
            <Card key={s._id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-slate-900">{s.title}</h3>
                <ActionMenu items={[
                  { label: "Edit", icon: Pencil, onClick: () => setEditRow({
                      _id: s._id, title: s.title, description: s.description, price: s.price ?? 0,
                      isFree: s.isFree, isPremium: s.isPremium, languages: (s.languages ?? []).join(", "), tags: (s.tags ?? []).join(", "), isActive: s.isActive,
                    }) },
                  { label: "Delete", icon: Trash2, danger: true, onClick: () => setDeleteRow({ _id: s._id, title: s.title }) },
                ]} />
              </div>
              <p className="text-sm text-slate-500 mt-1">{s.description}</p>
              <div className="flex gap-2 mt-3 flex-wrap">
                <Badge color="indigo">{s.totalTests} tests</Badge>
                <Badge color="green">₹{s.price}</Badge>
                {s.isPremium && <Badge color="amber">Premium</Badge>}
                {!s.isActive && <Badge color="red">Inactive</Badge>}
              </div>
            </Card>
          ))}
          <div className="md:col-span-2">
            <Pagination page={pager.page} totalPages={pager.totalPages} onChange={pager.setPage} from={pager.from} to={pager.to} total={pager.total} label="series" />
          </div>
        </div>
      )}

      {editRow && (
        <Modal open={!!editRow} onOpenChange={(o) => !o && setEditRow(null)} title="Edit Test Series" wide>
          <div className="space-y-4">
            <Input label="Series Title" value={editRow.title} onChange={(e) => setEditRow({ ...editRow, title: e.target.value })} />
            <Textarea label="Description" value={editRow.description} onChange={(e) => setEditRow({ ...editRow, description: e.target.value })} rows={2} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Price (₹)" type="number" value={editRow.price} onChange={(e) => setEditRow({ ...editRow, price: parseInt(e.target.value) || 0 })} />
              <Input label="Languages (comma-separated)" value={editRow.languages} onChange={(e) => setEditRow({ ...editRow, languages: e.target.value })} />
              <Input label="Tags (comma-separated)" value={editRow.tags} onChange={(e) => setEditRow({ ...editRow, tags: e.target.value })} />
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
        title={`Delete "${deleteRow?.title}"?`}
        description="This permanently deletes the series AND all of its tests and their questions. This cannot be undone."
        confirmLabel="Delete Everything"
        danger
        onConfirm={async () => {
          if (!deleteRow) return;
          const res = await deleteSeriesCascade({ id: deleteRow._id as Id<"testSeries"> });
          toast.success(`Deleted series · ${res.removedTests} tests · ${res.removedQuestions} questions`);
          setDeleteRow(null);
        }}
      />
    </div>
  );
}

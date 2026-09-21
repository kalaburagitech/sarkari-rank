"use client";

import { useState } from "react";
import { api } from "@convex/_generated/api";
import { useOnce, useAdminMutation } from "@/lib/admin-data";
import { Id } from "@convex/_generated/dataModel";
import { Plus, Pencil, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Button, FormCard, Input, Textarea, Select, LoadingState, EmptyState, TableWrap, Badge } from "@/components/admin/ui";
import { ActionMenu, ConfirmDialog, Modal, usePagination, Pagination } from "@/components/admin/ui-extras";
import { slugify } from "@/lib/utils";

type Region = "karnataka" | "national";
type CatForm = { name: string; description: string; icon: string; color: string; isPopular: boolean; order: number; isActive: boolean; region: Region };
const emptyForm: CatForm = { name: "", description: "", icon: "📋", color: "#3B82F6", isPopular: false, order: 1, isActive: true, region: "national" };

export default function CategoriesPage() {
  const categories = useOnce(api.exams.listCategories, { includeInactive: true });
  const createCategory = useAdminMutation(api.exams.createCategory);
  const updateCategory = useAdminMutation(api.exams.updateCategory);
  const deleteCategory = useAdminMutation(api.exams.deleteCategory);
  const backfillRegions = useAdminMutation(api.exams.backfillRegions);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CatForm>(emptyForm);

  const [editRow, setEditRow] = useState<{ _id: string } & CatForm | null>(null);
  const [deleteRow, setDeleteRow] = useState<{ _id: string; name: string } | null>(null);
  const pager = usePagination(categories ?? [], 20);

  const handleBackfill = async () => {
    try {
      const r = await backfillRegions();
      toast.success(r.message);
    } catch (err) { toast.error((err as Error).message); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      await createCategory({
        name: form.name, description: form.description, icon: form.icon,
        color: form.color, isPopular: form.isPopular, order: form.order, slug: slugify(form.name), region: form.region,
      });
      toast.success(`Category "${form.name}" created!`);
      setShowForm(false);
      setForm(emptyForm);
    } catch (err) { toast.error((err as Error).message); }
    setSaving(false);
  };

  const saveEdit = async () => {
    if (!editRow) return;
    setSaving(true);
    try {
      await updateCategory({
        id: editRow._id as Id<"examCategories">,
        name: editRow.name, description: editRow.description, icon: editRow.icon,
        color: editRow.color, isPopular: editRow.isPopular, order: editRow.order, isActive: editRow.isActive, region: editRow.region,
      });
      toast.success("Category updated");
      setEditRow(null);
    } catch (err) { toast.error((err as Error).message); }
    setSaving(false);
  };

  if (categories === undefined) return <LoadingState />;

  return (
    <div>
      <PageHeader title="Exam Categories" description={`${categories.length} categories · SSC, Banking, Railway & more`}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleBackfill}><Wand2 size={16} /> Fix Missing Regions</Button>
            <Button onClick={() => setShowForm(!showForm)}><Plus size={16} /> Add Category</Button>
          </div>
        } />

      {showForm && (
        <FormCard title="Create New Category" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Category Name *" placeholder="e.g. SSC Exams" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label="Icon (emoji)" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
            <div className="sm:col-span-2"><Textarea label="Description *" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} required /></div>
            <Input label="Color" type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
            <Input label="Display Order" type="number" value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })} />
            <Select label="Region" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value as Region })}>
              <option value="karnataka">Karnataka State</option>
              <option value="national">National / All-India</option>
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.isPopular} onChange={(e) => setForm({ ...form, isPopular: e.target.checked })} className="rounded" />
            Mark as Popular (shown on home screen)
          </label>
          <div className="flex gap-3">
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Create Category"}</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </FormCard>
      )}

      {categories.length === 0 ? (
        <EmptyState message="No categories yet. Click 'Add Category' or seed sample data." action={<Button onClick={() => setShowForm(true)}><Plus size={16} /> Add First Category</Button>} />
      ) : (
        <TableWrap>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>{["Category", "Slug", "Region", "Popular", "Status", ""].map((h, i) => (
                <th key={i} className="text-left p-4 font-semibold text-slate-600">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {pager.pageItems.map((cat) => (
                <tr key={cat._id} className="border-b border-slate-50 hover:bg-indigo-50/30 transition-colors">
                  <td className="p-4"><span className="mr-2 text-lg">{cat.icon}</span><span className="font-medium">{cat.name}</span></td>
                  <td className="p-4 text-slate-400 font-mono text-xs">{cat.slug}</td>
                  <td className="p-4"><Badge color={cat.region === "karnataka" ? "green" : "blue"}>{cat.region === "karnataka" ? "Karnataka" : "National"}</Badge></td>
                  <td className="p-4">{cat.isPopular ? <Badge color="amber">Popular</Badge> : "—"}</td>
                  <td className="p-4"><Badge color={cat.isActive ? "green" : "red"}>{cat.isActive ? "Active" : "Inactive"}</Badge></td>
                  <td className="p-4">
                    <ActionMenu items={[
                      { label: "Edit", icon: Pencil, onClick: () => setEditRow({ _id: cat._id, name: cat.name, description: cat.description, icon: cat.icon ?? "📋", color: cat.color ?? "#3B82F6", isPopular: !!cat.isPopular, order: cat.order ?? 1, isActive: cat.isActive, region: cat.region ?? "national" }) },
                      { label: cat.isActive ? "Deactivate" : "Activate", icon: Trash2, danger: cat.isActive, onClick: () => cat.isActive ? setDeleteRow({ _id: cat._id, name: cat.name }) : updateCategory({ id: cat._id, isActive: true }).then(() => toast.success("Activated")) },
                    ]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 pb-3">
            <Pagination page={pager.page} totalPages={pager.totalPages} onChange={pager.setPage} from={pager.from} to={pager.to} total={pager.total} label="categories" />
          </div>
        </TableWrap>
      )}

      {editRow && (
        <Modal open={!!editRow} onOpenChange={(o) => !o && setEditRow(null)} title="Edit Category" wide>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Category Name" value={editRow.name} onChange={(e) => setEditRow({ ...editRow, name: e.target.value })} />
              <Input label="Icon (emoji)" value={editRow.icon} onChange={(e) => setEditRow({ ...editRow, icon: e.target.value })} />
              <div className="sm:col-span-2"><Textarea label="Description" value={editRow.description} onChange={(e) => setEditRow({ ...editRow, description: e.target.value })} rows={2} /></div>
              <Input label="Color" type="color" value={editRow.color} onChange={(e) => setEditRow({ ...editRow, color: e.target.value })} />
              <Input label="Display Order" type="number" value={editRow.order} onChange={(e) => setEditRow({ ...editRow, order: parseInt(e.target.value) || 0 })} />
              <Select label="Region" value={editRow.region} onChange={(e) => setEditRow({ ...editRow, region: e.target.value as Region })}>
                <option value="karnataka">Karnataka State</option>
                <option value="national">National / All-India</option>
              </Select>
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={editRow.isPopular} onChange={(e) => setEditRow({ ...editRow, isPopular: e.target.checked })} /> Popular</label>
              <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={editRow.isActive} onChange={(e) => setEditRow({ ...editRow, isActive: e.target.checked })} /> Active</label>
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
        title={`Deactivate "${deleteRow?.name}"?`}
        description="The category will be hidden from the app. You can re-activate it later by editing it."
        confirmLabel="Deactivate"
        danger
        onConfirm={async () => {
          if (!deleteRow) return;
          await deleteCategory({ id: deleteRow._id as Id<"examCategories"> });
          toast.success("Category deactivated");
          setDeleteRow(null);
        }}
      />
    </div>
  );
}

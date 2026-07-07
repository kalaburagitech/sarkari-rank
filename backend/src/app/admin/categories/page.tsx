"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Button, FormCard, Input, Textarea, LoadingState, EmptyState, TableWrap, Badge } from "@/components/admin/ui";
import { slugify } from "@/lib/utils";

export default function CategoriesPage() {
  const categories = useQuery(api.exams.listCategories, { includeInactive: true });
  const createCategory = useMutation(api.exams.createCategory);
  const updateCategory = useMutation(api.exams.updateCategory);
  const deleteCategory = useMutation(api.exams.deleteCategory);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", icon: "📋", color: "#3B82F6", isPopular: false, order: 1 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      await createCategory({ ...form, slug: slugify(form.name) });
      toast.success(`Category "${form.name}" created!`);
      setShowForm(false);
      setForm({ name: "", description: "", icon: "📋", color: "#3B82F6", isPopular: false, order: 1 });
    } catch (err) { toast.error((err as Error).message); }
    setSaving(false);
  };

  const toggleActive = async (id: any, isActive: boolean) => {
    await updateCategory({ id, isActive: !isActive });
    toast.success(isActive ? "Category deactivated" : "Category activated");
  };

  const handleDelete = async (id: any, name: string) => {
    if (!confirm(`Deactivate "${name}"?`)) return;
    await deleteCategory({ id });
    toast.success("Category deactivated");
  };

  if (categories === undefined) return <LoadingState />;

  return (
    <div>
      <PageHeader title="Exam Categories" description={`${categories.length} categories · SSC, Banking, Railway & more`}
        action={<Button onClick={() => setShowForm(!showForm)}><Plus size={16} /> Add Category</Button>} />

      {showForm && (
        <FormCard title="Create New Category" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Category Name *" placeholder="e.g. SSC Exams" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label="Icon (emoji)" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
            <div className="col-span-2"><Textarea label="Description *" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} required /></div>
            <Input label="Color" type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
            <Input label="Display Order" type="number" value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) })} />
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
              <tr>{["Category", "Slug", "Popular", "Status", "Actions"].map((h) => (
                <th key={h} className="text-left p-4 font-semibold text-slate-600">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat._id} className="border-b border-slate-50 hover:bg-indigo-50/30 transition-colors">
                  <td className="p-4"><span className="mr-2 text-lg">{cat.icon}</span><span className="font-medium">{cat.name}</span></td>
                  <td className="p-4 text-slate-400 font-mono text-xs">{cat.slug}</td>
                  <td className="p-4">{cat.isPopular ? <Badge color="amber">Popular</Badge> : "—"}</td>
                  <td className="p-4"><Badge color={cat.isActive ? "green" : "red"}>{cat.isActive ? "Active" : "Inactive"}</Badge></td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button onClick={() => toggleActive(cat._id, cat.isActive)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Toggle active">
                        {cat.isActive ? <ToggleRight size={18} className="text-emerald-500" /> : <ToggleLeft size={18} className="text-slate-400" />}
                      </button>
                      <button onClick={() => handleDelete(cat._id, cat.name)} className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors"><Trash2 size={16} /></button>
                    </div>
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

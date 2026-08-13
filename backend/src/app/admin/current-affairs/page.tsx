"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Button, FormCard, Input, Textarea, LoadingState, EmptyState, Card, Badge } from "@/components/admin/ui";
import { ActionMenu, ConfirmDialog, Modal, usePagination, Pagination } from "@/components/admin/ui-extras";
import { slugify } from "@/lib/utils";

type EditForm = {
  _id: string; title: string; summary: string; content: string; category: string;
  sourceUrl: string; sourceName: string; isActive: boolean;
};

export default function CurrentAffairsPage() {
  const affairs = useQuery(api.content.listCurrentAffairs, { limit: 50 });
  const createAffair = useMutation(api.content.createCurrentAffair);
  const updateAffair = useMutation(api.content.updateCurrentAffair);
  const deleteAffair = useMutation(api.content.deleteCurrentAffair);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", summary: "", content: "", category: "General" });

  const [editRow, setEditRow] = useState<EditForm | null>(null);
  const [deleteRow, setDeleteRow] = useState<{ _id: string; title: string } | null>(null);
  const pager = usePagination(affairs ?? [], 15);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) { toast.error("Title and content required"); return; }
    setSaving(true);
    try {
      await createAffair({ ...form, slug: slugify(form.title), date: Date.now() });
      toast.success("Article published!");
      setShowForm(false);
      setForm({ title: "", summary: "", content: "", category: "General" });
    } catch (err) { toast.error((err as Error).message); }
    setSaving(false);
  };

  const saveEdit = async () => {
    if (!editRow) return;
    setSaving(true);
    try {
      await updateAffair({
        id: editRow._id as Id<"currentAffairs">,
        title: editRow.title, summary: editRow.summary, content: editRow.content, category: editRow.category,
        sourceUrl: editRow.sourceUrl.trim() || undefined, sourceName: editRow.sourceName.trim() || undefined,
        isActive: editRow.isActive,
      });
      toast.success("Article updated");
      setEditRow(null);
    } catch (err) { toast.error((err as Error).message); }
    setSaving(false);
  };

  if (affairs === undefined) return <LoadingState />;

  return (
    <div>
      <PageHeader title="Current Affairs" description={`${affairs.length} articles`}
        action={<Button onClick={() => setShowForm(!showForm)}><Plus size={16} /> Add Article</Button>} />

      {showForm && (
        <FormCard title="Publish Current Affairs" onSubmit={handleSubmit}>
          <Input label="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <Input label="Summary *" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} required />
          <Textarea label="Full Content *" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={6} required />
          <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <div className="flex gap-3">
            <Button type="submit" disabled={saving}>{saving ? "Publishing..." : "Publish"}</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </FormCard>
      )}

      {affairs.length === 0 ? <EmptyState message="No articles yet." /> : (
        <div className="space-y-3">
          {pager.pageItems.map((a) => (
            <Card key={a._id} className="p-5 flex justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-900">{a.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{a.summary}</p>
              </div>
              <div className="flex items-start gap-2 shrink-0">
                <Badge color="blue">{a.category}</Badge>
                <ActionMenu items={[
                  { label: "Edit", icon: Pencil, onClick: () => setEditRow({
                      _id: a._id, title: a.title, summary: a.summary ?? "", content: (a as { content?: string }).content ?? "",
                      category: a.category, sourceUrl: (a as { sourceUrl?: string }).sourceUrl ?? "",
                      sourceName: (a as { sourceName?: string }).sourceName ?? "", isActive: (a as { isActive?: boolean }).isActive ?? true,
                    }) },
                  { label: "Delete", icon: Trash2, danger: true, onClick: () => setDeleteRow({ _id: a._id, title: a.title }) },
                ]} />
              </div>
            </Card>
          ))}
          <Pagination page={pager.page} totalPages={pager.totalPages} onChange={pager.setPage} from={pager.from} to={pager.to} total={pager.total} label="articles" />
        </div>
      )}

      {editRow && (
        <Modal open={!!editRow} onOpenChange={(o) => !o && setEditRow(null)} title="Edit Article" wide>
          <div className="space-y-4">
            <Input label="Title" value={editRow.title} onChange={(e) => setEditRow({ ...editRow, title: e.target.value })} />
            <Input label="Summary" value={editRow.summary} onChange={(e) => setEditRow({ ...editRow, summary: e.target.value })} />
            <Textarea label="Full Content" value={editRow.content} onChange={(e) => setEditRow({ ...editRow, content: e.target.value })} rows={6} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Category" value={editRow.category} onChange={(e) => setEditRow({ ...editRow, category: e.target.value })} />
              <Input label="Source Name" value={editRow.sourceName} onChange={(e) => setEditRow({ ...editRow, sourceName: e.target.value })} />
              <div className="sm:col-span-2"><Input label="Source URL" value={editRow.sourceUrl} onChange={(e) => setEditRow({ ...editRow, sourceUrl: e.target.value })} /></div>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editRow.isActive} onChange={(e) => setEditRow({ ...editRow, isActive: e.target.checked })} /> Active (visible in app)</label>
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
        description="This permanently removes the article. This action cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={async () => {
          if (!deleteRow) return;
          await deleteAffair({ id: deleteRow._id as Id<"currentAffairs"> });
          toast.success("Article deleted");
          setDeleteRow(null);
        }}
      />
    </div>
  );
}

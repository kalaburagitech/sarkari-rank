"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Button, FormCard, Input, Textarea, LoadingState, EmptyState, Card, Badge } from "@/components/admin/ui";
import { slugify } from "@/lib/utils";

export default function CurrentAffairsPage() {
  const affairs = useQuery(api.content.listCurrentAffairs, { limit: 50 });
  const createAffair = useMutation(api.content.createCurrentAffair);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", summary: "", content: "", category: "General" });

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
          {affairs.map((a) => (
            <Card key={a._id} className="p-5 flex justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">{a.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{a.summary}</p>
              </div>
              <Badge color="blue">{a.category}</Badge>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

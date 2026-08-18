"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { toast } from "sonner";
import { Plus, Eye, Pencil, Copy, Trash2, CheckCircle2, Rocket } from "lucide-react";
import {
  PageHeader,
  Button,
  Card,
  LoadingState,
  EmptyState,
  TableWrap,
  Badge,
} from "@/components/admin/ui";
import {
  SearchInput,
  Breadcrumbs,
  ActionMenu,
  ConfirmDialog,
  Modal,
  StatusBadge,
} from "@/components/admin/ui-extras";
import { NoteForm, NoteTarget } from "./NoteForm";

type Note = {
  _id: string;
  examId: string;
  title: string;
  content?: string;
  summary?: string;
  subject?: string;
  topic?: string;
  language?: string;
  pdfStorageId?: string;
  pdfUrl?: string | null;
  isPremium: boolean;
  isActive: boolean;
};

export function NotesManager() {
  const exams = useQuery(api.exams.listExams, {});
  const notes = useQuery(api.content.listStudyNotes, { includeInactive: true }) as
    | Note[]
    | undefined;

  const updateNote = useMutation(api.content.updateStudyNote);
  const duplicateNote = useMutation(api.content.duplicateStudyNote);
  const deleteNote = useMutation(api.content.deleteStudyNote);

  const [examId, setExamId] = useState("");
  const [subjectF, setSubjectF] = useState("");
  const [statusF, setStatusF] = useState("");
  const [search, setSearch] = useState("");

  const [adding, setAdding] = useState(false);
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [viewNote, setViewNote] = useState<Note | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);

  const examName = (id: string) => exams?.find((e) => e._id === id)?.name ?? "—";

  const subjects = useMemo(() => {
    const s = new Set<string>();
    (notes ?? []).forEach((n) => n.subject && s.add(n.subject));
    return [...s].sort();
  }, [notes]);

  const filtered = useMemo(() => {
    let list = notes ?? [];
    if (examId) list = list.filter((n) => n.examId === examId);
    if (subjectF) list = list.filter((n) => n.subject === subjectF);
    if (statusF)
      list = list.filter((n) => (n.isActive ? "published" : "draft") === statusF);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          (n.subject ?? "").toLowerCase().includes(q) ||
          (n.topic ?? "").toLowerCase().includes(q) ||
          (n.content ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [notes, examId, subjectF, statusF, search]);

  if (exams === undefined) return <LoadingState />;
  const examList = exams.map((e) => ({ _id: e._id, name: e.name }));

  async function togglePublish(n: Note) {
    await updateNote({ id: n._id as Id<"studyNotes">, isActive: !n.isActive });
    toast.success(n.isActive ? "Note unpublished (draft)" : "Note published!");
  }

  return (
    <div>
      <PageHeader
        title="Notes"
        description="Study notes organised by Exam → Subject → Chapter"
        action={
          <Button onClick={() => setAdding((v) => !v)}>
            <Plus size={16} /> Add Notes
          </Button>
        }
      />

      <Breadcrumbs
        items={[
          { label: "Notes" },
          { label: examId ? examName(examId) : "All Exams" },
        ]}
      />

      {adding && (
        <Card className="p-6 mb-6 border-indigo-100">
          <h3 className="font-semibold text-slate-900 text-lg mb-4">Add Notes</h3>
          <NoteForm
            mode="add"
            exams={examList}
            preset={{ examId: examId || undefined, subject: subjectF || undefined }}
            onClose={() => setAdding(false)}
          />
        </Card>
      )}

      {/* Filters */}
      <Card className="p-4 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search notes…" />
          <select
            value={examId}
            onChange={(e) => setExamId(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 bg-white"
          >
            <option value="">All Exams</option>
            {exams.map((e) => (
              <option key={e._id} value={e._id}>
                {e.name}
              </option>
            ))}
          </select>
          <select
            value={subjectF}
            onChange={(e) => setSubjectF(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 bg-white"
          >
            <option value="">All Subjects</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={statusF}
            onChange={(e) => setStatusF(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 bg-white"
          >
            <option value="">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </Card>

      {notes === undefined ? (
        <LoadingState message="Loading notes…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          message={
            notes.length === 0
              ? "No notes available yet."
              : "No notes match your filters."
          }
          action={
            <Button onClick={() => setAdding(true)}>
              <Plus size={16} /> Add First Note
            </Button>
          }
        />
      ) : (
        <TableWrap>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Exam</th>
                <th className="px-4 py-3">Subject / Chapter</th>
                <th className="px-4 py-3 w-28">Language</th>
                <th className="px-4 py-3 w-24">Access</th>
                <th className="px-4 py-3 w-28">Status</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((n) => (
                <tr key={n._id} className="border-b border-slate-50 hover:bg-slate-50/60">
                  <td className="px-4 py-3 max-w-xs">
                    <button
                      onClick={() => setViewNote(n)}
                      className="text-left text-slate-800 font-medium hover:text-indigo-600 line-clamp-1"
                    >
                      {n.title}
                    </button>
                    {n.summary && (
                      <p className="text-xs text-slate-400 line-clamp-1">{n.summary}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    {examName(n.examId)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {n.subject || "—"}
                    {n.topic ? <span className="text-slate-400"> · {n.topic}</span> : null}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Badge color="blue">{n.language ?? "English"}</Badge>
                      {n.pdfStorageId && <Badge color="indigo">PDF</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {n.isPremium ? (
                      <Badge color="amber">Premium</Badge>
                    ) : (
                      <Badge color="green">Free</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={n.isActive ? "published" : "draft"} />
                  </td>
                  <td className="px-4 py-3">
                    <ActionMenu
                      items={[
                        { label: "View", icon: Eye, onClick: () => setViewNote(n) },
                        { label: "Edit", icon: Pencil, onClick: () => setEditNote(n) },
                        {
                          label: n.isActive ? "Unpublish" : "Publish",
                          icon: n.isActive ? CheckCircle2 : Rocket,
                          onClick: () => togglePublish(n),
                        },
                        {
                          label: "Duplicate",
                          icon: Copy,
                          onClick: async () => {
                            await duplicateNote({ id: n._id as Id<"studyNotes"> });
                            toast.success("Duplicated as a draft copy");
                          },
                        },
                        {
                          label: "Delete",
                          icon: Trash2,
                          danger: true,
                          onClick: () => setDeleteTarget(n),
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}

      {notes && filtered.length > 0 && (
        <p className="text-xs text-slate-400 mt-3">
          Showing {filtered.length} note{filtered.length > 1 ? "s" : ""}
        </p>
      )}

      {/* Edit */}
      {editNote && (
        <Modal
          open={!!editNote}
          onOpenChange={(o) => !o && setEditNote(null)}
          title="Edit Note"
          wide
        >
          <NoteForm
            mode="edit"
            exams={examList}
            editTarget={editNote as NoteTarget}
            onClose={() => setEditNote(null)}
          />
        </Modal>
      )}

      {/* View */}
      {viewNote && (
        <Modal
          open={!!viewNote}
          onOpenChange={(o) => !o && setViewNote(null)}
          title={viewNote.title}
          wide
        >
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge color="blue">{examName(viewNote.examId)}</Badge>
              {viewNote.subject && <Badge>{viewNote.subject}</Badge>}
              {viewNote.topic && <Badge>{viewNote.topic}</Badge>}
              <Badge color="indigo">{viewNote.language ?? "English"}</Badge>
              <StatusBadge status={viewNote.isActive ? "published" : "draft"} />
            </div>
            {viewNote.summary && (
              <p className="text-sm text-slate-500 italic">{viewNote.summary}</p>
            )}
            {viewNote.pdfUrl && (
              <a href={viewNote.pdfUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:underline">
                <Eye size={15} /> Open attached PDF
              </a>
            )}
            {viewNote.content ? (
              <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed border-t border-slate-100 pt-3">
                {viewNote.content}
              </div>
            ) : (
              <p className="text-sm text-slate-400 border-t border-slate-100 pt-3">No written content — this note is a PDF.</p>
            )}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => {
                  setEditNote(viewNote);
                  setViewNote(null);
                }}
              >
                <Pencil size={15} /> Edit
              </Button>
              <Button variant="ghost" onClick={() => setViewNote(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.title}"?`}
        description="This permanently removes the note. This action cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteNote({ id: deleteTarget._id as Id<"studyNotes"> });
          toast.success("Note deleted");
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}

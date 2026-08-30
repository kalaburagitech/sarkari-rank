"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { toast } from "sonner";
import {
  Plus, FolderTree, BookOpen, ChevronRight, Pencil, Trash2, FileJson,
  Check, X, GripVertical,
} from "lucide-react";
import { PageHeader, Button, Card, Input, Textarea, Badge, LoadingState, EmptyState } from "@/components/admin/ui";
import { cn } from "@/lib/utils";
import { PracticeQuestionForm, PracticeQuestion } from "./PracticeQuestionForm";
import { PracticeJsonImport } from "./PracticeJsonImport";

type SubjectRow = {
  _id: Id<"subjects">;
  name: string;
  description?: string;
  icon?: string;
  chapterCount: number;
  questionCount: number;
};
type ChapterRow = {
  _id: Id<"chapters">;
  name: string;
  description?: string;
  questionCount: number;
  publishedCount: number;
};

const diffColor: Record<string, string> = { easy: "green", medium: "amber", hard: "red" };

export function PracticeBankManager() {
  const subjects = useQuery(api.practiceBank.listSubjects, {}) as SubjectRow[] | undefined;

  const [subjectId, setSubjectId] = useState<Id<"subjects"> | null>(null);
  const [chapterId, setChapterId] = useState<Id<"chapters"> | null>(null);

  const chapters = useQuery(
    api.practiceBank.listChapters,
    subjectId ? { subjectId } : "skip"
  ) as ChapterRow[] | undefined;
  const questions = useQuery(
    api.practiceBank.listChapterQuestions,
    chapterId ? { chapterId } : "skip"
  ) as PracticeQuestion[] | undefined;

  // Selections are derived by lookup — a stale id (e.g. after a delete) simply
  // resolves to null and the dependent panel falls back to its empty state, so
  // no cleanup effect is needed.
  const selectedSubject = subjects?.find((s) => s._id === subjectId) ?? null;
  const selectedChapter = chapters?.find((c) => c._id === chapterId) ?? null;

  if (subjects === undefined) return <LoadingState message="Loading practice bank…" />;

  return (
    <div>
      <PageHeader
        title="Practice Bank"
        description="A global Subject → Chapter question bank for the app's Practice by Subject section — independent of any exam."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <SubjectsPanel
          subjects={subjects}
          selectedId={subjectId}
          onSelect={(id) => { setSubjectId(id); setChapterId(null); }}
        />
        <ChaptersPanel
          subject={selectedSubject}
          chapters={chapters}
          selectedId={chapterId}
          onSelect={setChapterId}
        />
      </div>

      <QuestionsPanel
        key={selectedChapter?._id ?? "none"}
        subject={selectedSubject}
        chapter={selectedChapter}
        questions={questions}
      />
    </div>
  );
}

// ─── Subjects ──────────────────────────────────────────────────────────────

function SubjectsPanel({
  subjects, selectedId, onSelect,
}: {
  subjects: SubjectRow[];
  selectedId: Id<"subjects"> | null;
  onSelect: (id: Id<"subjects">) => void;
}) {
  const createSubject = useMutation(api.practiceBank.createSubject);
  const updateSubject = useMutation(api.practiceBank.updateSubject);
  const deleteSubject = useMutation(api.practiceBank.deleteSubject);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const reset = () => { setAdding(false); setEditing(null); setName(""); setDescription(""); };

  const startEdit = (s: SubjectRow) => {
    setEditing(s._id); setAdding(false); setName(s.name); setDescription(s.description ?? "");
  };

  const submit = async () => {
    if (!name.trim()) { toast.error("Subject name is required"); return; }
    try {
      if (editing) {
        await updateSubject({ id: editing as Id<"subjects">, name, description });
        toast.success("Subject updated");
      } else {
        const id = await createSubject({ name, description });
        toast.success("Subject created");
        onSelect(id as Id<"subjects">);
      }
      reset();
    } catch (e) { toast.error((e as Error).message); }
  };

  const remove = async (s: SubjectRow) => {
    if (!confirm(`Delete "${s.name}" and its ${s.chapterCount} chapter(s) + ${s.questionCount} question(s)? This cannot be undone.`)) return;
    try { await deleteSubject({ id: s._id }); toast.success("Subject deleted"); }
    catch (e) { toast.error((e as Error).message); }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FolderTree size={18} className="text-indigo-600" />
          <h3 className="font-semibold text-slate-900">Subjects</h3>
          <Badge color="blue">{subjects.length}</Badge>
        </div>
        {!adding && !editing && (
          <Button size="sm" onClick={() => { setAdding(true); setName(""); setDescription(""); }}>
            <Plus size={15} /> New Subject
          </Button>
        )}
      </div>

      {(adding || editing) && (
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-3 space-y-2">
          <Input label={editing ? "Rename subject" : "Subject name"} placeholder="e.g. Indian Polity" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          <Textarea label="Description (optional)" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" onClick={submit}><Check size={15} /> {editing ? "Save" : "Create"}</Button>
            <Button size="sm" variant="ghost" onClick={reset}><X size={15} /> Cancel</Button>
          </div>
        </div>
      )}

      {subjects.length === 0 && !adding ? (
        <EmptyState message="No subjects yet. Create your first subject to start building the practice bank." />
      ) : (
        <div className="space-y-1.5 max-h-[420px] overflow-y-auto">
          {subjects.map((s) => (
            <div
              key={s._id}
              onClick={() => onSelect(s._id)}
              className={cn(
                "group flex items-center gap-2 rounded-xl px-3 py-2.5 cursor-pointer border transition-colors",
                selectedId === s._id ? "border-indigo-300 bg-indigo-50" : "border-transparent hover:bg-slate-50"
              )}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-slate-900 truncate">{s.icon ? `${s.icon} ` : ""}{s.name}</p>
                <p className="text-xs text-slate-400">{s.chapterCount} chapter(s) · {s.questionCount} question(s)</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); startEdit(s); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-white hover:text-indigo-600 opacity-0 group-hover:opacity-100" aria-label="Edit subject">
                <Pencil size={14} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); remove(s); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-white hover:text-red-600 opacity-0 group-hover:opacity-100" aria-label="Delete subject">
                <Trash2 size={14} />
              </button>
              <ChevronRight size={16} className={cn("text-slate-300", selectedId === s._id && "text-indigo-500")} />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─── Chapters ──────────────────────────────────────────────────────────────

function ChaptersPanel({
  subject, chapters, selectedId, onSelect,
}: {
  subject: SubjectRow | null;
  chapters: ChapterRow[] | undefined;
  selectedId: Id<"chapters"> | null;
  onSelect: (id: Id<"chapters">) => void;
}) {
  const createChapter = useMutation(api.practiceBank.createChapter);
  const updateChapter = useMutation(api.practiceBank.updateChapter);
  const deleteChapter = useMutation(api.practiceBank.deleteChapter);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const reset = () => { setAdding(false); setEditing(null); setName(""); setDescription(""); };
  const startEdit = (c: ChapterRow) => { setEditing(c._id); setAdding(false); setName(c.name); setDescription(c.description ?? ""); };

  const submit = async () => {
    if (!subject) return;
    if (!name.trim()) { toast.error("Chapter name is required"); return; }
    try {
      if (editing) {
        await updateChapter({ id: editing as Id<"chapters">, name, description });
        toast.success("Chapter updated");
      } else {
        const id = await createChapter({ subjectId: subject._id, name, description });
        toast.success("Chapter created");
        onSelect(id as Id<"chapters">);
      }
      reset();
    } catch (e) { toast.error((e as Error).message); }
  };

  const remove = async (c: ChapterRow) => {
    if (!confirm(`Delete chapter "${c.name}" and its ${c.questionCount} question(s)? This cannot be undone.`)) return;
    try { await deleteChapter({ id: c._id }); toast.success("Chapter deleted"); }
    catch (e) { toast.error((e as Error).message); }
  };

  if (!subject) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={18} className="text-slate-400" />
          <h3 className="font-semibold text-slate-400">Chapters</h3>
        </div>
        <div className="text-sm text-slate-400 py-8 text-center border border-dashed border-slate-200 rounded-xl">
          ← Select a subject to manage its chapters
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <BookOpen size={18} className="text-indigo-600 shrink-0" />
          <h3 className="font-semibold text-slate-900 truncate">Chapters · <span className="text-indigo-600">{subject.name}</span></h3>
        </div>
        {!adding && !editing && (
          <Button size="sm" onClick={() => { setAdding(true); setName(""); setDescription(""); }}>
            <Plus size={15} /> New Chapter
          </Button>
        )}
      </div>

      {(adding || editing) && (
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-3 space-y-2">
          <Input label={editing ? "Rename chapter" : "Chapter name"} placeholder="e.g. Fundamental Rights" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          <Textarea label="Description (optional)" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" onClick={submit}><Check size={15} /> {editing ? "Save" : "Create"}</Button>
            <Button size="sm" variant="ghost" onClick={reset}><X size={15} /> Cancel</Button>
          </div>
        </div>
      )}

      {chapters === undefined ? (
        <div className="text-sm text-slate-400 py-6 text-center">Loading chapters…</div>
      ) : chapters.length === 0 && !adding ? (
        <EmptyState message="No chapters yet. Add a chapter, then file questions under it." />
      ) : (
        <div className="space-y-1.5 max-h-[420px] overflow-y-auto">
          {chapters.map((c) => (
            <div
              key={c._id}
              onClick={() => onSelect(c._id)}
              className={cn(
                "group flex items-center gap-2 rounded-xl px-3 py-2.5 cursor-pointer border transition-colors",
                selectedId === c._id ? "border-indigo-300 bg-indigo-50" : "border-transparent hover:bg-slate-50"
              )}
            >
              <GripVertical size={14} className="text-slate-300 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-slate-900 truncate">{c.name}</p>
                <p className="text-xs text-slate-400">
                  {c.questionCount} question(s){c.questionCount !== c.publishedCount ? ` · ${c.publishedCount} published` : ""}
                </p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); startEdit(c); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-white hover:text-indigo-600 opacity-0 group-hover:opacity-100" aria-label="Edit chapter">
                <Pencil size={14} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); remove(c); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-white hover:text-red-600 opacity-0 group-hover:opacity-100" aria-label="Delete chapter">
                <Trash2 size={14} />
              </button>
              <ChevronRight size={16} className={cn("text-slate-300", selectedId === c._id && "text-indigo-500")} />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─── Questions ─────────────────────────────────────────────────────────────

function QuestionsPanel({
  subject, chapter, questions,
}: {
  subject: SubjectRow | null;
  chapter: ChapterRow | null;
  questions: PracticeQuestion[] | undefined;
}) {
  const deleteQuestion = useMutation(api.practiceBank.deletePracticeQuestion);
  // This panel is keyed by chapter id in the parent, so it remounts (resetting
  // mode/editing) whenever the selected chapter changes — no cleanup effect.
  const [mode, setMode] = useState<"list" | "add" | "import">("list");
  const [editing, setEditing] = useState<PracticeQuestion | null>(null);

  if (!subject || !chapter) {
    return (
      <Card className="p-8">
        <div className="text-center text-slate-400">
          <FileJson size={28} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">Select a subject and chapter above to add, import and manage its questions.</p>
        </div>
      </Card>
    );
  }

  const remove = async (q: PracticeQuestion) => {
    if (!confirm("Delete this question? This cannot be undone.")) return;
    try { await deleteQuestion({ id: q._id as Id<"practiceQuestions"> }); toast.success("Question deleted"); }
    catch (e) { toast.error((e as Error).message); }
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="min-w-0">
          <p className="text-xs text-slate-400">{subject.name}</p>
          <h3 className="font-semibold text-slate-900 text-lg truncate">{chapter.name}</h3>
        </div>
        {mode === "list" && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setMode("import")}><FileJson size={16} /> Import JSON</Button>
            <Button onClick={() => { setEditing(null); setMode("add"); }}><Plus size={16} /> Add Question</Button>
          </div>
        )}
      </div>

      {mode === "import" && (
        <div className="mb-5">
          <PracticeJsonImport
            chapterId={chapter._id}
            chapterName={chapter.name}
            onClose={() => setMode("list")}
            onDone={() => {}}
          />
        </div>
      )}

      {(mode === "add" || editing) && (
        <div className="border border-indigo-100 rounded-2xl p-5 mb-5 bg-indigo-50/30">
          <h4 className="font-semibold text-slate-900 mb-4">{editing ? "Edit Question" : "Add Question"}</h4>
          <PracticeQuestionForm
            mode={editing ? "edit" : "add"}
            chapterId={chapter._id}
            editTarget={editing ?? undefined}
            onClose={() => { setMode("list"); setEditing(null); }}
          />
        </div>
      )}

      {mode === "list" && (
        questions === undefined ? (
          <div className="text-sm text-slate-400 py-6 text-center">Loading questions…</div>
        ) : questions.length === 0 ? (
          <EmptyState
            message="No questions in this chapter yet."
            action={<Button onClick={() => setMode("add")}><Plus size={16} /> Add First Question</Button>}
          />
        ) : (
          <div className="space-y-2">
            {questions.map((q, i) => {
              const correct = q.options.find((o) => o.id === q.correctOptionId);
              return (
                <div key={q._id} className="group flex items-start gap-3 border border-slate-100 rounded-xl p-3 hover:bg-slate-50">
                  <span className="text-xs font-bold text-slate-400 mt-0.5 w-6 shrink-0">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900">{q.questionText}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-1.5 py-0.5">
                        ✓ {correct?.text ?? q.correctOptionId.toUpperCase()}
                      </span>
                      <Badge color={diffColor[q.difficulty] ?? "slate"}>{q.difficulty}</Badge>
                      <Badge color="blue">{q.language}</Badge>
                      {(q.status ?? "published") === "draft" && <Badge color="amber">Draft</Badge>}
                    </div>
                  </div>
                  <button onClick={() => { setEditing(q); setMode("list"); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-white hover:text-indigo-600" aria-label="Edit question">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => remove(q)} className="p-1.5 rounded-lg text-slate-400 hover:bg-white hover:text-red-600" aria-label="Delete question">
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )
      )}
    </Card>
  );
}

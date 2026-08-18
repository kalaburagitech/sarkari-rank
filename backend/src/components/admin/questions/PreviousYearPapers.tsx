"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { toast } from "sonner";
import {
  Plus,
  Settings2,
  ClipboardCheck,
  Trash2,
  Pencil,
  ArrowLeft,
  CheckCircle2,
  Rocket,
} from "lucide-react";
import {
  Button,
  Card,
  Input,
  Select,
  LoadingState,
  EmptyState,
  TableWrap,
} from "@/components/admin/ui";

const PAPER_LANGUAGES = ["English", "Kannada", "Hindi", "Tamil", "Telugu", "Marathi", "Bengali", "Gujarati", "Malayalam", "Punjabi", "Urdu"];
import {
  Breadcrumbs,
  ActionMenu,
  ConfirmDialog,
  Modal,
  StatusBadge,
} from "@/components/admin/ui-extras";
import { QuestionForm } from "./QuestionForm";
import { QuestionListTable, Row } from "./QuestionListTable";
import { slugify } from "@/lib/utils";

type ExamOpt = { _id: string; name: string };
type SeriesOpt = { _id: string; examId: string; title: string };

type Paper = {
  _id: string;
  title: string;
  year?: number;
  totalQuestions: number;
  isActive: boolean;
  type: string;
};

export function PreviousYearPapers({
  exams,
  seriesList,
}: {
  exams: ExamOpt[];
  seriesList: SeriesOpt[];
}) {
  const [examId, setExamId] = useState("");
  const [paper, setPaper] = useState<Paper | null>(null);
  const [addingQ, setAddingQ] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  // Add / edit paper dialogs
  const [addOpen, setAddOpen] = useState(false);
  const [newYear, setNewYear] = useState("");
  const [newName, setNewName] = useState("");
  const [newLang, setNewLang] = useState("English");
  const [newGroup, setNewGroup] = useState("");
  const [editPaper, setEditPaper] = useState<Paper | null>(null);
  const [deletePaper, setDeletePaper] = useState<Paper | null>(null);

  const createTest = useMutation(api.exams.createTest);
  const updateTest = useMutation(api.exams.updateTest);
  const deleteCascade = useMutation(api.exams.deleteTestCascade);

  const allTests = useQuery(
    api.exams.listTests,
    examId ? { examId: examId as Id<"exams">, includeInactive: true } : "skip"
  );
  const paperQuestions = useQuery(
    api.exams.listQuestionsRich,
    paper ? { testId: paper._id as Id<"tests"> } : "skip"
  ) as Row[] | undefined;

  const examName = exams.find((e) => e._id === examId)?.name ?? "";

  const papers = useMemo<Paper[]>(() => {
    return ((allTests ?? []) as Paper[])
      .filter((t) => t.type === "pyp")
      .sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
  }, [allTests]);

  // Keep the drilled-in paper fresh (question counts, publish state) from the query.
  const livePaper = paper ? papers.find((p) => p._id === paper._id) ?? paper : null;

  const subjectBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    (paperQuestions ?? []).forEach((q) => {
      const s = q.subject || "Uncategorised";
      map.set(s, (map.get(s) ?? 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [paperQuestions]);

  async function handleCreatePaper() {
    if (!newYear.trim() || !newName.trim()) {
      toast.error("Enter a year and a paper name");
      return;
    }
    const group = newGroup.trim() || `${examId}-pyp-${newYear}-${slugify(newName)}`;
    const id = (await createTest({
      examId: examId as Id<"exams">,
      title: newName.trim(),
      slug: `${slugify(newName)}-${newYear}-${slugify(newLang)}-${Date.now()}`,
      description: `${examName} previous year paper (${newYear}) · ${newLang}`,
      type: "pyp",
      year: parseInt(newYear),
      durationMinutes: 60,
      totalMarks: 0,
      negativeMarking: 0.25,
      languages: [newLang],
      language: newLang,
      paperGroup: group,
      isFree: true,
      isPremium: false,
      isActive: false, // starts as Draft
    })) as Id<"tests">;
    toast.success("Paper created as draft — add questions next");
    setAddOpen(false);
    setNewYear("");
    setNewName("");
    setPaper({
      _id: id,
      title: newName.trim(),
      year: parseInt(newYear),
      totalQuestions: 0,
      isActive: false,
      type: "pyp",
    });
    setAddingQ(true);
  }

  async function togglePublish(p: Paper) {
    await updateTest({ id: p._id as Id<"tests">, isActive: !p.isActive });
    toast.success(p.isActive ? "Unpublished (back to draft)" : "Paper published!");
  }

  // ── Step 1: choose an exam ──
  const examPicker = (
    <Card className="p-4 mb-6">
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        Select Exam
      </label>
      <select
        value={examId}
        onChange={(e) => {
          setExamId(e.target.value);
          setPaper(null);
        }}
        className="w-full md:w-96 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 bg-white"
      >
        <option value="">— Choose an exam —</option>
        {exams.map((e) => (
          <option key={e._id} value={e._id}>
            {e.name}
          </option>
        ))}
      </select>
    </Card>
  );

  if (!examId) {
    return (
      <>
        {examPicker}
        <EmptyState message="Choose an exam to manage its previous year papers." />
      </>
    );
  }

  // ── Drill-in: manage one paper ──
  if (livePaper) {
    return (
      <>
        <Breadcrumbs
          items={[
            { label: "Previous Year", onClick: () => setPaper(null) },
            { label: examName, onClick: () => setPaper(null) },
            { label: `${livePaper.title}${livePaper.year ? ` · ${livePaper.year}` : ""}` },
          ]}
        />

        <Card className="p-5 mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-lg">{livePaper.title}</h3>
              <StatusBadge status={livePaper.isActive ? "published" : "draft"} />
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              {examName}
              {livePaper.year ? ` · ${livePaper.year}` : ""} ·{" "}
              {livePaper.totalQuestions} question
              {livePaper.totalQuestions === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => setPaper(null)}>
              <ArrowLeft size={15} /> Back to papers
            </Button>
            <Button variant="secondary" onClick={() => setReviewOpen(true)}>
              <ClipboardCheck size={15} /> Review &amp; Publish
            </Button>
            <Button onClick={() => setAddingQ((v) => !v)}>
              <Plus size={15} /> Add Question
            </Button>
          </div>
        </Card>

        {addingQ && (
          <Card className="p-6 mb-6 border-indigo-100">
            <h3 className="font-semibold text-slate-900 text-lg mb-4">Add Question</h3>
            <QuestionForm
              mode="add"
              exams={exams}
              seriesList={seriesList}
              preset={{
                questionType: "pyp",
                examId,
                testId: livePaper._id,
                containerLabel: `${livePaper.title}${
                  livePaper.year ? ` · ${livePaper.year}` : ""
                }`,
              }}
              onClose={() => setAddingQ(false)}
              onSaved={() => {}}
            />
          </Card>
        )}

        {paperQuestions === undefined ? (
          <LoadingState message="Loading questions…" />
        ) : (
          <QuestionListTable
            rows={paperQuestions}
            exams={exams}
            seriesList={seriesList}
            hideExam
            hideType
            emptyMessage="No questions in this paper yet."
            emptyAction={
              <Button onClick={() => setAddingQ(true)}>
                <Plus size={16} /> Add First Question
              </Button>
            }
          />
        )}

        {/* Review & Publish */}
        <Modal
          open={reviewOpen}
          onOpenChange={setReviewOpen}
          title={`Review — ${livePaper.title}`}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold text-slate-900">
                {livePaper.totalQuestions}
              </div>
              <div className="text-sm text-slate-500">
                total questions
                <div className="mt-1">
                  <StatusBadge status={livePaper.isActive ? "published" : "draft"} />
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">
                Subjects in this paper
              </p>
              {subjectBreakdown.length === 0 ? (
                <p className="text-sm text-slate-400">No questions added yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {subjectBreakdown.map(([subj, count]) => (
                    <div
                      key={subj}
                      className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2"
                    >
                      <span className="text-slate-700">{subj}</span>
                      <span className="font-semibold text-slate-900">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {livePaper.totalQuestions === 0 && (
              <p className="text-sm text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                Add at least one question before publishing this paper.
              </p>
            )}

            <div className="flex gap-3 pt-1">
              {livePaper.isActive ? (
                <Button
                  variant="secondary"
                  onClick={async () => {
                    await togglePublish(livePaper);
                  }}
                >
                  Unpublish
                </Button>
              ) : (
                <Button
                  disabled={livePaper.totalQuestions === 0}
                  onClick={async () => {
                    await togglePublish(livePaper);
                    setReviewOpen(false);
                  }}
                >
                  <Rocket size={15} /> Publish Paper
                </Button>
              )}
              <Button variant="ghost" onClick={() => setReviewOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      </>
    );
  }

  // ── Papers list for the chosen exam ──
  return (
    <>
      {examPicker}

      <Breadcrumbs
        items={[{ label: "Previous Year" }, { label: examName }]}
      />

      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-slate-500">
          {papers.length} paper{papers.length === 1 ? "" : "s"} for {examName}
        </p>
        <Button
          onClick={() => {
            setNewYear("");
            setNewName("");
            setAddOpen(true);
          }}
        >
          <Plus size={16} /> Add Previous Year Paper
        </Button>
      </div>

      {allTests === undefined ? (
        <LoadingState />
      ) : papers.length === 0 ? (
        <EmptyState
          message={`No previous-year papers added for ${examName}.`}
          action={
            <Button onClick={() => setAddOpen(true)}>
              <Plus size={16} /> Add Previous Year Paper
            </Button>
          }
        />
      ) : (
        <TableWrap>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
                <th className="px-4 py-3 w-20">Year</th>
                <th className="px-4 py-3">Paper Name</th>
                <th className="px-4 py-3 w-28">Questions</th>
                <th className="px-4 py-3 w-32">Status</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {papers.map((p) => (
                <tr
                  key={p._id}
                  className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors"
                >
                  <td className="px-4 py-3 font-semibold text-slate-700">
                    {p.year ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setPaper(p)}
                      className="text-slate-800 font-medium hover:text-indigo-600 text-left"
                    >
                      {p.title}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.totalQuestions}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.isActive ? "published" : "draft"} />
                  </td>
                  <td className="px-4 py-3">
                    <ActionMenu
                      items={[
                        {
                          label: "Manage Questions",
                          icon: Settings2,
                          onClick: () => setPaper(p),
                        },
                        {
                          label: p.isActive ? "Unpublish" : "Publish",
                          icon: p.isActive ? CheckCircle2 : Rocket,
                          onClick: () => togglePublish(p),
                        },
                        {
                          label: "Rename / Year",
                          icon: Pencil,
                          onClick: () => {
                            setEditPaper(p);
                            setNewName(p.title);
                            setNewYear(p.year ? String(p.year) : "");
                          },
                        },
                        {
                          label: "Delete",
                          icon: Trash2,
                          danger: true,
                          onClick: () => setDeletePaper(p),
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

      {/* Add paper wizard */}
      <Modal open={addOpen} onOpenChange={setAddOpen} title="Add Previous Year Paper">
        <div className="space-y-4">
          <div className="text-sm text-slate-500">
            Exam: <b className="text-slate-800">{examName}</b>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Year *"
              type="number"
              placeholder="2024"
              value={newYear}
              onChange={(e) => setNewYear(e.target.value)}
            />
            <Input
              label="Paper Name *"
              placeholder={`${examName} 2024`}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <Select label="Language" value={newLang} onChange={(e) => setNewLang(e.target.value)}>
              {PAPER_LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
            </Select>
            <Input
              label="Paper group (optional)"
              placeholder="auto — link language versions"
              value={newGroup}
              onChange={(e) => setNewGroup(e.target.value)}
            />
          </div>
          <p className="text-xs text-slate-500">
            To offer this paper in another language, create it again with the <b>same Paper name + year</b>
            and a different <b>Language</b> (they auto-group so users can switch language).
          </p>
          <p className="text-xs text-slate-400">
            The paper is created as a <b>Draft</b>. Add questions, then Publish it from
            the review screen.
          </p>
          <div className="flex gap-3">
            <Button onClick={handleCreatePaper}>Create &amp; Add Questions</Button>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Rename / year */}
      <Modal
        open={!!editPaper}
        onOpenChange={(o) => !o && setEditPaper(null)}
        title="Edit Paper"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Year"
              type="number"
              value={newYear}
              onChange={(e) => setNewYear(e.target.value)}
            />
            <Input
              label="Paper Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <Button
              onClick={async () => {
                if (!editPaper) return;
                await updateTest({
                  id: editPaper._id as Id<"tests">,
                  title: newName.trim() || editPaper.title,
                  year: newYear ? parseInt(newYear) : undefined,
                });
                toast.success("Paper updated");
                setEditPaper(null);
              }}
            >
              Save
            </Button>
            <Button variant="ghost" onClick={() => setEditPaper(null)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete paper (cascade) */}
      <ConfirmDialog
        open={!!deletePaper}
        onOpenChange={(o) => !o && setDeletePaper(null)}
        title={`Delete "${deletePaper?.title}"?`}
        description={`This permanently deletes the paper and all ${
          deletePaper?.totalQuestions ?? 0
        } of its questions. This cannot be undone.`}
        confirmLabel="Delete Paper"
        danger
        onConfirm={async () => {
          if (!deletePaper) return;
          await deleteCascade({ id: deletePaper._id as Id<"tests"> });
          toast.success("Paper deleted");
          setDeletePaper(null);
        }}
      />
    </>
  );
}

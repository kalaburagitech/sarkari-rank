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
  Textarea,
  LoadingState,
  EmptyState,
  TableWrap,
  Badge,
} from "@/components/admin/ui";
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

type Series = {
  _id: string;
  title: string;
  description: string;
  totalTests: number;
  isActive: boolean;
  price?: number;
};

type TestRow = {
  _id: string;
  title: string;
  totalQuestions: number;
  durationMinutes: number;
  totalMarks: number;
  negativeMarking: number;
  isActive: boolean;
  type: string;
};

export function TestSeriesManager({
  exams,
  seriesList: seriesForForm,
}: {
  exams: ExamOpt[];
  seriesList: SeriesOpt[];
}) {
  const [examId, setExamId] = useState("");
  const [series, setSeries] = useState<Series | null>(null);
  const [test, setTest] = useState<TestRow | null>(null);
  const [addingQ, setAddingQ] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  // series dialog
  const [seriesOpen, setSeriesOpen] = useState(false);
  const [editSeries, setEditSeries] = useState<Series | null>(null);
  const [sTitle, setSTitle] = useState("");
  const [sDesc, setSDesc] = useState("");
  const [sPrice, setSPrice] = useState("0");
  const [deleteSeries, setDeleteSeries] = useState<Series | null>(null);

  // test dialog
  const [testOpen, setTestOpen] = useState(false);
  const [editTestRow, setEditTestRow] = useState<TestRow | null>(null);
  const [tTitle, setTTitle] = useState("");
  const [tDuration, setTDuration] = useState("60");
  const [tMarks, setTMarks] = useState("100");
  const [tNeg, setTNeg] = useState("0.25");
  const [deleteTestRow, setDeleteTestRow] = useState<TestRow | null>(null);

  const createSeries = useMutation(api.exams.createTestSeries);
  const updateSeries = useMutation(api.exams.updateTestSeries);
  const deleteSeriesCascade = useMutation(api.exams.deleteTestSeriesCascade);
  const createTest = useMutation(api.exams.createTest);
  const updateTest = useMutation(api.exams.updateTest);
  const deleteTestCascade = useMutation(api.exams.deleteTestCascade);

  const seriesData = useQuery(
    api.exams.listTestSeries,
    examId ? { examId: examId as Id<"exams">, includeInactive: true } : "skip"
  ) as Series[] | undefined;
  const testsData = useQuery(
    api.exams.listTests,
    series ? { testSeriesId: series._id as Id<"testSeries">, includeInactive: true } : "skip"
  ) as TestRow[] | undefined;
  const testQuestions = useQuery(
    api.exams.listQuestionsRich,
    test ? { testId: test._id as Id<"tests"> } : "skip"
  ) as Row[] | undefined;

  const examName = exams.find((e) => e._id === examId)?.name ?? "";
  const liveSeries = series ? (seriesData ?? []).find((s) => s._id === series._id) ?? series : null;
  const liveTest = test ? (testsData ?? []).find((t) => t._id === test._id) ?? test : null;

  const subjectBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    (testQuestions ?? []).forEach((q) => {
      const s = q.subject || "Uncategorised";
      map.set(s, (map.get(s) ?? 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [testQuestions]);

  async function togglePublishTest(t: TestRow) {
    await updateTest({ id: t._id as Id<"tests">, isActive: !t.isActive });
    toast.success(t.isActive ? "Test unpublished (draft)" : "Test published!");
  }

  const examPicker = (
    <Card className="p-4 mb-6">
      <label className="block text-sm font-medium text-slate-700 mb-1.5">Select Exam</label>
      <select
        value={examId}
        onChange={(e) => {
          setExamId(e.target.value);
          setSeries(null);
          setTest(null);
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
        <EmptyState message="Choose an exam to manage its test series." />
      </>
    );
  }

  // ── Level 3: manage questions inside one test ──
  if (liveSeries && liveTest) {
    return (
      <>
        <Breadcrumbs
          items={[
            { label: "Test Series", onClick: () => { setTest(null); setSeries(null); } },
            { label: examName, onClick: () => { setTest(null); setSeries(null); } },
            { label: liveSeries.title, onClick: () => setTest(null) },
            { label: liveTest.title },
          ]}
        />

        <Card className="p-5 mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-lg">{liveTest.title}</h3>
              <StatusBadge status={liveTest.isActive ? "published" : "draft"} />
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              {liveTest.totalQuestions} Qs · {liveTest.durationMinutes} min ·{" "}
              {liveTest.totalMarks} marks · −{liveTest.negativeMarking}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => setTest(null)}>
              <ArrowLeft size={15} /> Back to tests
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
              seriesList={seriesForForm}
              preset={{
                questionType: "testSeries",
                examId,
                testId: liveTest._id,
                containerLabel: `${liveSeries.title} · ${liveTest.title}`,
              }}
              onClose={() => setAddingQ(false)}
              onSaved={() => {}}
            />
          </Card>
        )}

        {testQuestions === undefined ? (
          <LoadingState message="Loading questions…" />
        ) : (
          <QuestionListTable
            rows={testQuestions}
            exams={exams}
            seriesList={seriesForForm}
            hideExam
            hideType
            emptyMessage="No questions in this test yet."
            emptyAction={
              <Button onClick={() => setAddingQ(true)}>
                <Plus size={16} /> Add First Question
              </Button>
            }
          />
        )}

        <Modal open={reviewOpen} onOpenChange={setReviewOpen} title={`Review — ${liveTest.title}`}>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold text-slate-900">{liveTest.totalQuestions}</div>
              <div className="text-sm text-slate-500">
                questions · {liveTest.durationMinutes} min · {liveTest.totalMarks} marks
                <div className="mt-1">
                  <StatusBadge status={liveTest.isActive ? "published" : "draft"} />
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Subjects in this test</p>
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
            {liveTest.totalQuestions === 0 && (
              <p className="text-sm text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                Add at least one question before publishing this test.
              </p>
            )}
            <div className="flex gap-3 pt-1">
              {liveTest.isActive ? (
                <Button variant="secondary" onClick={() => togglePublishTest(liveTest)}>
                  Unpublish
                </Button>
              ) : (
                <Button
                  disabled={liveTest.totalQuestions === 0}
                  onClick={async () => {
                    await togglePublishTest(liveTest);
                    setReviewOpen(false);
                  }}
                >
                  <Rocket size={15} /> Publish Test
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

  // ── Level 2: tests inside a series ──
  if (liveSeries) {
    return (
      <>
        <Breadcrumbs
          items={[
            { label: "Test Series", onClick: () => setSeries(null) },
            { label: examName, onClick: () => setSeries(null) },
            { label: liveSeries.title },
          ]}
        />

        <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">{liveSeries.title}</h3>
            <p className="text-sm text-slate-500">{liveSeries.description}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setSeries(null)}>
              <ArrowLeft size={15} /> Back
            </Button>
            <Button
              onClick={() => {
                setTTitle(`Test ${(testsData?.length ?? 0) + 1}`);
                setTDuration("60");
                setTMarks("100");
                setTNeg("0.25");
                setEditTestRow(null);
                setTestOpen(true);
              }}
            >
              <Plus size={16} /> Create Test
            </Button>
          </div>
        </div>

        {testsData === undefined ? (
          <LoadingState />
        ) : testsData.length === 0 ? (
          <EmptyState
            message="No tests in this series yet."
            action={
              <Button onClick={() => { setTTitle("Test 1"); setTestOpen(true); }}>
                <Plus size={16} /> Create First Test
              </Button>
            }
          />
        ) : (
          <TableWrap>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
                  <th className="px-4 py-3">Test</th>
                  <th className="px-4 py-3 w-24">Questions</th>
                  <th className="px-4 py-3 w-24">Duration</th>
                  <th className="px-4 py-3 w-20">Marks</th>
                  <th className="px-4 py-3 w-32">Status</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {testsData.map((t) => (
                  <tr key={t._id} className="border-b border-slate-50 hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setTest(t)}
                        className="text-slate-800 font-medium hover:text-indigo-600 text-left"
                      >
                        {t.title}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{t.totalQuestions}</td>
                    <td className="px-4 py-3 text-slate-600">{t.durationMinutes} min</td>
                    <td className="px-4 py-3 text-slate-600">{t.totalMarks}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.isActive ? "published" : "draft"} />
                    </td>
                    <td className="px-4 py-3">
                      <ActionMenu
                        items={[
                          { label: "Manage Questions", icon: Settings2, onClick: () => setTest(t) },
                          {
                            label: t.isActive ? "Unpublish" : "Publish",
                            icon: t.isActive ? CheckCircle2 : Rocket,
                            onClick: () => togglePublishTest(t),
                          },
                          {
                            label: "Edit details",
                            icon: Pencil,
                            onClick: () => {
                              setEditTestRow(t);
                              setTTitle(t.title);
                              setTDuration(String(t.durationMinutes));
                              setTMarks(String(t.totalMarks));
                              setTNeg(String(t.negativeMarking));
                              setTestOpen(true);
                            },
                          },
                          {
                            label: "Delete",
                            icon: Trash2,
                            danger: true,
                            onClick: () => setDeleteTestRow(t),
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

        {/* Create / edit test */}
        <Modal
          open={testOpen}
          onOpenChange={setTestOpen}
          title={editTestRow ? "Edit Test" : "Create Test"}
        >
          <div className="space-y-4">
            <Input label="Test Name *" value={tTitle} onChange={(e) => setTTitle(e.target.value)} />
            <div className="grid grid-cols-3 gap-3">
              <Input label="Duration (min)" type="number" value={tDuration} onChange={(e) => setTDuration(e.target.value)} />
              <Input label="Total Marks" type="number" value={tMarks} onChange={(e) => setTMarks(e.target.value)} />
              <Input label="Negative" type="number" step="0.25" value={tNeg} onChange={(e) => setTNeg(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={async () => {
                  if (!tTitle.trim()) { toast.error("Enter a test name"); return; }
                  if (editTestRow) {
                    await updateTest({
                      id: editTestRow._id as Id<"tests">,
                      title: tTitle.trim(),
                      durationMinutes: parseInt(tDuration) || 60,
                      totalMarks: parseInt(tMarks) || 0,
                      negativeMarking: parseFloat(tNeg) || 0,
                    });
                    toast.success("Test updated");
                  } else {
                    const id = (await createTest({
                      testSeriesId: liveSeries._id as Id<"testSeries">,
                      examId: examId as Id<"exams">,
                      title: tTitle.trim(),
                      slug: `${slugify(tTitle)}-${Date.now()}`,
                      type: "mock",
                      durationMinutes: parseInt(tDuration) || 60,
                      totalMarks: parseInt(tMarks) || 0,
                      negativeMarking: parseFloat(tNeg) || 0,
                      languages: ["English"],
                      isFree: false,
                      isPremium: true,
                      isActive: false,
                    })) as Id<"tests">;
                    toast.success("Test created as draft — add questions next");
                    setTest({
                      _id: id,
                      title: tTitle.trim(),
                      totalQuestions: 0,
                      durationMinutes: parseInt(tDuration) || 60,
                      totalMarks: parseInt(tMarks) || 0,
                      negativeMarking: parseFloat(tNeg) || 0,
                      isActive: false,
                      type: "mock",
                    });
                    setAddingQ(true);
                  }
                  setTestOpen(false);
                }}
              >
                {editTestRow ? "Save" : "Create & Add Questions"}
              </Button>
              <Button variant="ghost" onClick={() => setTestOpen(false)}>Cancel</Button>
            </div>
          </div>
        </Modal>

        <ConfirmDialog
          open={!!deleteTestRow}
          onOpenChange={(o) => !o && setDeleteTestRow(null)}
          title={`Delete "${deleteTestRow?.title}"?`}
          description={`This permanently deletes the test and its ${deleteTestRow?.totalQuestions ?? 0} questions.`}
          confirmLabel="Delete Test"
          danger
          onConfirm={async () => {
            if (!deleteTestRow) return;
            await deleteTestCascade({ id: deleteTestRow._id as Id<"tests"> });
            toast.success("Test deleted");
            setDeleteTestRow(null);
          }}
        />
      </>
    );
  }

  // ── Level 1: series for the chosen exam ──
  return (
    <>
      {examPicker}
      <Breadcrumbs items={[{ label: "Test Series" }, { label: examName }]} />

      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-slate-500">
          {(seriesData?.length ?? 0)} series for {examName}
        </p>
        <Button
          onClick={() => {
            setSTitle("");
            setSDesc("");
            setSPrice("0");
            setEditSeries(null);
            setSeriesOpen(true);
          }}
        >
          <Plus size={16} /> Create Test Series
        </Button>
      </div>

      {seriesData === undefined ? (
        <LoadingState />
      ) : seriesData.length === 0 ? (
        <EmptyState
          message={`No test series for ${examName} yet.`}
          action={
            <Button onClick={() => setSeriesOpen(true)}>
              <Plus size={16} /> Create Test Series
            </Button>
          }
        />
      ) : (
        <TableWrap>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
                <th className="px-4 py-3">Series</th>
                <th className="px-4 py-3 w-24">Tests</th>
                <th className="px-4 py-3 w-24">Price</th>
                <th className="px-4 py-3 w-32">Status</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {seriesData.map((s) => (
                <tr key={s._id} className="border-b border-slate-50 hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSeries(s)}
                      className="text-slate-800 font-medium hover:text-indigo-600 text-left"
                    >
                      {s.title}
                    </button>
                    {s.description && (
                      <p className="text-xs text-slate-400 line-clamp-1">{s.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{s.totalTests}</td>
                  <td className="px-4 py-3">
                    {s.price ? <Badge color="green">₹{s.price}</Badge> : <Badge>Free</Badge>}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.isActive ? "published" : "draft"} />
                  </td>
                  <td className="px-4 py-3">
                    <ActionMenu
                      items={[
                        { label: "Manage Tests", icon: Settings2, onClick: () => setSeries(s) },
                        {
                          label: s.isActive ? "Unpublish" : "Publish",
                          icon: s.isActive ? CheckCircle2 : Rocket,
                          onClick: async () => {
                            await updateSeries({ id: s._id as Id<"testSeries">, isActive: !s.isActive });
                            toast.success(s.isActive ? "Series unpublished" : "Series published!");
                          },
                        },
                        {
                          label: "Edit details",
                          icon: Pencil,
                          onClick: () => {
                            setEditSeries(s);
                            setSTitle(s.title);
                            setSDesc(s.description);
                            setSPrice(String(s.price ?? 0));
                            setSeriesOpen(true);
                          },
                        },
                        {
                          label: "Delete",
                          icon: Trash2,
                          danger: true,
                          onClick: () => setDeleteSeries(s),
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

      {/* Create / edit series */}
      <Modal
        open={seriesOpen}
        onOpenChange={setSeriesOpen}
        title={editSeries ? "Edit Test Series" : "Create Test Series"}
      >
        <div className="space-y-4">
          <div className="text-sm text-slate-500">
            Exam: <b className="text-slate-800">{examName}</b>
          </div>
          <Input label="Series Title *" placeholder="SSC CGL Full Mock Series" value={sTitle} onChange={(e) => setSTitle(e.target.value)} />
          <Textarea label="Description" rows={2} value={sDesc} onChange={(e) => setSDesc(e.target.value)} />
          <Input label="Price (₹) — 0 for free" type="number" value={sPrice} onChange={(e) => setSPrice(e.target.value)} />
          <div className="flex gap-3">
            <Button
              onClick={async () => {
                if (!sTitle.trim()) { toast.error("Enter a series title"); return; }
                const price = parseInt(sPrice) || 0;
                if (editSeries) {
                  await updateSeries({
                    id: editSeries._id as Id<"testSeries">,
                    title: sTitle.trim(),
                    description: sDesc.trim(),
                    price,
                    isFree: price === 0,
                    isPremium: price > 0,
                  });
                  toast.success("Series updated");
                } else {
                  await createSeries({
                    examId: examId as Id<"exams">,
                    title: sTitle.trim(),
                    slug: `${slugify(sTitle)}-${Date.now()}`,
                    description: sDesc.trim(),
                    isFree: price === 0,
                    isPremium: price > 0,
                    price,
                    languages: ["English", "Hindi"],
                    tags: ["Full Length"],
                  });
                  toast.success("Test series created — add tests next");
                }
                setSeriesOpen(false);
              }}
            >
              {editSeries ? "Save" : "Create Series"}
            </Button>
            <Button variant="ghost" onClick={() => setSeriesOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteSeries}
        onOpenChange={(o) => !o && setDeleteSeries(null)}
        title={`Delete "${deleteSeries?.title}"?`}
        description={`This permanently deletes the series, all ${deleteSeries?.totalTests ?? 0} of its tests, and every question in them.`}
        confirmLabel="Delete Series"
        danger
        onConfirm={async () => {
          if (!deleteSeries) return;
          await deleteSeriesCascade({ id: deleteSeries._id as Id<"testSeries"> });
          toast.success("Series deleted");
          setDeleteSeries(null);
        }}
      />
    </>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, usePaginatedQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  Plus,
  FileJson,
  ListChecks,
  BookOpen,
  CalendarClock,
  Layers,
} from "lucide-react";
import { PageHeader, Button, Card, LoadingState } from "@/components/admin/ui";
import {
  Tabs,
  SearchInput,
  Breadcrumbs,
  contentTypeLabel,
} from "@/components/admin/ui-extras";
import { BulkImportQuestions } from "@/components/admin/BulkImportQuestions";
import { QuestionForm, QuestionType } from "./QuestionForm";
import { QuestionListTable, Row } from "./QuestionListTable";
import { PreviousYearPapers } from "./PreviousYearPapers";
import { TestSeriesManager } from "./TestSeriesManager";

type Tab = "all" | "practice" | "pyp" | "series";

const TAB_DEFS: { value: Tab; label: string; icon: React.ElementType }[] = [
  { value: "all", label: "All Questions", icon: ListChecks },
  { value: "practice", label: "Practice", icon: BookOpen },
  { value: "pyp", label: "Previous Year", icon: CalendarClock },
  { value: "series", label: "Test Series", icon: Layers },
];

const TAB_LABEL: Record<Exclude<Tab, "all">, string> = {
  practice: "Practice",
  pyp: "Previous Year",
  series: "Test Series",
};

const TAB_PRESET: Record<Exclude<Tab, "all">, QuestionType> = {
  practice: "practice",
  pyp: "pyp",
  series: "testSeries",
};

const TAB_HELP: Record<Tab, string> = {
  all: "Every question across all exams and content types. Search or filter to narrow down.",
  practice: "Practice questions organised by Subject → Chapter.",
  pyp: "Real questions from past exams, filed by year.",
  series: "Questions inside mock tests within your test series.",
};

export function QuestionManager() {
  const params = useSearchParams();
  const router = useRouter();

  // Tab is derived from the URL (?tab=) so sidebar links + browser back/forward work.
  const rawTab = params.get("tab") as Tab;
  const tab: Tab = ["all", "practice", "pyp", "series"].includes(rawTab)
    ? rawTab
    : "all";
  const setTab = (t: Tab) => router.replace(`/admin/questions?tab=${t}`);

  const [examId, setExamId] = useState("");
  const [search, setSearch] = useState("");
  const [subjectF, setSubjectF] = useState("");
  const [difficultyF, setDifficultyF] = useState("");
  const [statusF, setStatusF] = useState("");

  const [adding, setAdding] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const exams = useQuery(api.exams.listExams, {});
  const seriesList = useQuery(api.exams.listTestSeries, { includeInactive: true });
  // Paginated: reads ~50 questions per page instead of the whole table.
  // Exam/subject/difficulty/status/search are applied client-side over the
  // pages loaded so far — click "Load more" to pull in additional pages.
  const {
    results: rows,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.exams.listQuestionsPaginated,
    {},
    { initialNumItems: 50 }
  ) as unknown as {
    results: Row[];
    status: "LoadingFirstPage" | "CanLoadMore" | "LoadingMore" | "Exhausted";
    loadMore: (n: number) => void;
  };

  const subjects = useMemo(() => {
    const s = new Set<string>();
    (rows ?? []).forEach((r) => r.subject && s.add(r.subject));
    return [...s].sort();
  }, [rows]);

  const filtered = useMemo(() => {
    let list = rows ?? [];
    if (examId) list = list.filter((r) => r.examId === examId);
    if (tab !== "all")
      list = list.filter((r) => contentTypeLabel(r.testType) === TAB_LABEL[tab]);
    if (subjectF) list = list.filter((r) => r.subject === subjectF);
    if (difficultyF) list = list.filter((r) => r.difficulty === difficultyF);
    if (statusF) list = list.filter((r) => (r.status ?? "published") === statusF);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.questionText.toLowerCase().includes(q) ||
          r.options.some((o) => o.text.toLowerCase().includes(q)) ||
          (r.subject ?? "").toLowerCase().includes(q) ||
          (r.topic ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [rows, tab, subjectF, difficultyF, statusF, search]);

  if (exams === undefined) return <LoadingState />;

  const examList = exams.map((e) => ({ _id: e._id, name: e.name }));
  const seriesForForm = (seriesList ?? []).map((s) => ({
    _id: s._id,
    examId: s.examId,
    title: s.title,
  }));

  const addPreset =
    tab === "all"
      ? undefined
      : { questionType: TAB_PRESET[tab], examId: examId || undefined };

  return (
    <div>
      <PageHeader
        title="Question Management"
        description="Add and manage every question — Practice, Previous Year & Test Series"
        action={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowImport((v) => !v);
                setAdding(false);
              }}
            >
              <FileJson size={16} /> Import JSON
            </Button>
            {tab !== "pyp" && tab !== "series" && (
              <Button
                onClick={() => {
                  setAdding((v) => !v);
                  setShowImport(false);
                }}
              >
                <Plus size={16} /> Add Question
              </Button>
            )}
          </div>
        }
      />

      <Tabs tabs={TAB_DEFS} value={tab} onChange={setTab} />

      <Breadcrumbs
        items={[
          { label: "Questions", onClick: () => setTab("all") },
          { label: TAB_DEFS.find((t) => t.value === tab)!.label },
        ]}
      />
      <p className="text-sm text-slate-500 -mt-2 mb-5">{TAB_HELP[tab]}</p>

      {showImport && (
        <BulkImportQuestions
          mode={tab === "practice" ? "practice" : "generic"}
          onClose={() => setShowImport(false)}
          onDone={() => {}}
        />
      )}

      {/* Previous Year & Test Series have their own container-level workflows */}
      {tab === "pyp" ? (
        <PreviousYearPapers exams={examList} seriesList={seriesForForm} />
      ) : tab === "series" ? (
        <TestSeriesManager exams={examList} seriesList={seriesForForm} />
      ) : (
        <>
          {adding && (
            <Card className="p-6 mb-6 border-indigo-100">
              <h3 className="font-semibold text-slate-900 text-lg mb-4">Add Question</h3>
              <QuestionForm
                mode="add"
                exams={examList}
                seriesList={seriesForForm}
                preset={addPreset}
                onClose={() => setAdding(false)}
                onSaved={() => {}}
              />
            </Card>
          )}

          {/* Filter bar */}
          <Card className="p-4 mb-5">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="md:col-span-2">
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Search questions, options, subject…"
                />
              </div>
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
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={difficultyF}
                  onChange={(e) => setDifficultyF(e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 bg-white"
                >
                  <option value="">Difficulty</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
                <select
                  value={statusF}
                  onChange={(e) => setStatusF(e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 bg-white"
                >
                  <option value="">Status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>
          </Card>

          {status === "LoadingFirstPage" ? (
            <LoadingState message="Loading questions…" />
          ) : (
            <>
              <QuestionListTable
                rows={filtered}
                exams={examList}
                seriesList={seriesForForm}
                emptyMessage={
                  rows.length === 0
                    ? "No questions added yet."
                    : "No questions match your filters (in the loaded pages — Load more to search deeper)."
                }
                emptyAction={
                  <Button onClick={() => setAdding(true)}>
                    <Plus size={16} /> Add{" "}
                    {tab === "all"
                      ? "First"
                      : TAB_LABEL[tab as Exclude<Tab, "all">]}{" "}
                    Question
                  </Button>
                }
              />
              <div className="flex items-center justify-center gap-4 mt-4">
                <span className="text-xs text-slate-400">
                  Loaded {rows.length} question{rows.length === 1 ? "" : "s"}
                  {status !== "Exhausted" ? " · filters apply to loaded pages" : ""}
                </span>
                {status === "CanLoadMore" && (
                  <Button variant="secondary" onClick={() => loadMore(50)}>
                    Load 50 more
                  </Button>
                )}
                {status === "LoadingMore" && (
                  <span className="text-xs text-slate-400">Loading…</span>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

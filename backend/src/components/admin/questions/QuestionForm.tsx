"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { toast } from "sonner";
import { BookOpen, CalendarClock, Layers, AlertCircle, Plus, X } from "lucide-react";
import { Button, Input, Textarea, Select } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

export type QuestionType = "practice" | "pyp" | "testSeries";

type Exam = { _id: string; name: string };
type Series = { _id: string; examId: string; title: string };

type Opt = { id: string; text: string };
type Diff = "easy" | "medium" | "hard";

export type EditTarget = {
  _id: string;
  questionText: string;
  options: Opt[];
  correctOptionId: string;
  explanation?: string;
  subject?: string;
  topic?: string;
  difficulty: Diff;
  marks: number;
  negativeMarks: number;
  language?: string;
  status?: string;
  testType?: string;
  examName?: string;
  year?: number;
};

const TYPE_CHOICES: {
  value: QuestionType;
  label: string;
  desc: string;
  icon: React.ElementType;
}[] = [
  {
    value: "practice",
    label: "Practice Questions",
    desc: "Organised by Subject → Chapter for everyday practice.",
    icon: BookOpen,
  },
  {
    value: "pyp",
    label: "Previous Year Paper",
    desc: "Real questions from a past exam, filed by year.",
    icon: CalendarClock,
  },
  {
    value: "testSeries",
    label: "Test Series",
    desc: "A question inside a mock test within a test series.",
    icon: Layers,
  },
];

// Positional letter ids. Options can be 2–6; ids are assigned by position and
// NOT renumbered on removal, so `correctOptionId` stays valid for surviving rows.
const OPTION_IDS = ["a", "b", "c", "d", "e", "f"];
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;

const emptyOptions = (): Opt[] =>
  OPTION_IDS.slice(0, 4).map((id) => ({ id, text: "" }));

const LANGUAGES = [
  "English",
  "Hindi",
  "Kannada",
  "Tamil",
  "Telugu",
  "Marathi",
  "Bengali",
  "Gujarati",
  "Malayalam",
  "Punjabi",
  "Urdu",
];

export function QuestionForm({
  mode,
  exams,
  seriesList,
  preset,
  editTarget,
  onClose,
  onSaved,
}: {
  mode: "add" | "edit";
  exams: Exam[];
  seriesList: Series[];
  preset?: {
    questionType?: QuestionType;
    examId?: string;
    subject?: string;
    testId?: string;
    containerLabel?: string;
  };
  editTarget?: EditTarget;
  onClose: () => void;
  onSaved: () => void;
}) {
  const addQuestion = useMutation(api.exams.addQuestion);
  const updateQuestion = useMutation(api.exams.updateQuestion);

  // Locked context: adding straight into a known container (a Previous Year
  // paper or a series test) — hide the type/exam/year pickers.
  const locked = mode === "add" && !!preset?.testId;

  // ── Context ──
  const [questionType, setQuestionType] = useState<QuestionType | "">(
    preset?.questionType ?? ""
  );
  const [examId, setExamId] = useState(preset?.examId ?? "");
  const [subject, setSubject] = useState(preset?.subject ?? editTarget?.subject ?? "");
  const [chapter, setChapter] = useState(editTarget?.topic ?? "");
  const [year, setYear] = useState<string>(editTarget?.year ? String(editTarget.year) : "");
  const [paperName, setPaperName] = useState("");
  const [seriesId, setSeriesId] = useState("");
  const [testName, setTestName] = useState("");

  // ── Question payload ──
  const [questionText, setQuestionText] = useState(editTarget?.questionText ?? "");
  const [options, setOptions] = useState<Opt[]>(editTarget?.options ?? emptyOptions());
  const [correctOptionId, setCorrectOptionId] = useState(
    editTarget?.correctOptionId ?? "a"
  );
  const [explanation, setExplanation] = useState(editTarget?.explanation ?? "");
  const [difficulty, setDifficulty] = useState<Diff>(editTarget?.difficulty ?? "medium");
  const [marks, setMarks] = useState(editTarget?.marks ?? 1);
  const [negativeMarks, setNegativeMarks] = useState(editTarget?.negativeMarks ?? 0.25);
  const [language, setLanguage] = useState(editTarget?.language ?? "English");

  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const filteredSeries = seriesList.filter((s) => !examId || s.examId === examId);

  const setOpt = (idx: number, text: string) => {
    const next = [...options];
    next[idx] = { ...next[idx], text };
    setOptions(next);
  };

  const addOption = () => {
    if (options.length >= MAX_OPTIONS) return;
    setOptions([...options, { id: OPTION_IDS[options.length], text: "" }]);
  };

  const removeOption = (idx: number) => {
    if (options.length <= MIN_OPTIONS) return;
    const removed = options[idx];
    const next = options.filter((_, i) => i !== idx);
    setOptions(next);
    // If the option marked correct was removed, fall back to the first remaining.
    if (correctOptionId === removed.id) setCorrectOptionId(next[0].id);
  };

  function validate(): string[] {
    const e: string[] = [];
    if (mode === "add" && !locked) {
      if (!questionType) e.push("Choose what you are adding (Practice / Previous Year / Test Series).");
      if (!examId) e.push("Please select an Exam.");
      if (questionType === "practice" && !subject.trim())
        e.push("Subject is required for Practice questions.");
      if (questionType === "pyp") {
        if (!year.trim()) e.push("Year is required for a Previous Year paper.");
        if (!paperName.trim()) e.push("Paper name is required for a Previous Year paper.");
      }
      if (questionType === "testSeries") {
        if (!seriesId) e.push("Please select a Test Series.");
        if (!testName.trim()) e.push("Test name is required for a Test Series question.");
      }
    }
    if (!questionText.trim()) e.push("Question text is required.");
    if (options.length < MIN_OPTIONS) e.push("Add at least two answer options.");
    options.forEach((o) => {
      if (!o.text.trim()) e.push(`Option ${o.id.toUpperCase()} cannot be empty.`);
    });
    if (!correctOptionId) e.push("Please select the correct answer.");
    return e;
  }

  async function save(status: "draft" | "published", addAnother = false) {
    const e = validate();
    setErrors(e);
    if (e.length) {
      toast.error(e[0]);
      return;
    }
    setSaving(true);
    try {
      if (mode === "edit" && editTarget) {
        await updateQuestion({
          id: editTarget._id as Id<"questions">,
          questionText: questionText.trim(),
          options: options.map((o) => ({ id: o.id, text: o.text.trim() })),
          correctOptionId,
          explanation: explanation.trim() || undefined,
          subject: subject.trim() || undefined,
          topic: chapter.trim() || undefined,
          difficulty,
          marks,
          negativeMarks,
          language,
          status,
        });
        toast.success("Question updated");
        onSaved();
        onClose();
        return;
      }

      await addQuestion({
        questionType: (questionType || "practice") as QuestionType,
        examId: examId as Id<"exams">,
        testId: preset?.testId ? (preset.testId as Id<"tests">) : undefined,
        subject: subject.trim() || undefined,
        topic: chapter.trim() || undefined,
        year: year ? parseInt(year) : undefined,
        paperName: paperName.trim() || undefined,
        testSeriesId: seriesId ? (seriesId as Id<"testSeries">) : undefined,
        testName: testName.trim() || undefined,
        questionText: questionText.trim(),
        options: options.map((o) => ({ id: o.id, text: o.text.trim() })),
        correctOptionId,
        explanation: explanation.trim() || undefined,
        difficulty,
        marks,
        negativeMarks,
        language,
        status,
      });
      toast.success(status === "draft" ? "Saved as draft" : "Question saved");
      onSaved();

      if (addAnother) {
        // Retain context, clear only the question body.
        setQuestionText("");
        setOptions(emptyOptions());
        setCorrectOptionId("a");
        setExplanation("");
        setErrors([]);
      } else {
        onClose();
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const inputInvalid = (bad: boolean) =>
    bad ? "border-red-300 bg-red-50" : "";

  return (
    <div className="space-y-5">
      {mode === "edit" && editTarget && (
        <div className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
          Editing a <b>{editTarget.testType ?? "question"}</b> in{" "}
          <b>{editTarget.examName ?? "—"}</b>
          {editTarget.year ? ` · ${editTarget.year}` : ""}. Content type and exam
          can&apos;t be changed here — use Duplicate to move a copy elsewhere.
        </div>
      )}

      {/* Locked-context banner (adding into a specific paper / series test) */}
      {locked && preset?.containerLabel && (
        <div className="text-sm bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2 text-indigo-800">
          Adding to <b>{preset.containerLabel}</b>
        </div>
      )}

      {/* Step 1 — What are you adding? */}
      {mode === "add" && !locked && (
        <div>
          <p className="text-sm font-semibold text-slate-800 mb-2">
            What are you adding?
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {TYPE_CHOICES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setQuestionType(c.value)}
                className={cn(
                  "text-left rounded-xl border p-3 transition-all",
                  questionType === c.value
                    ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100"
                    : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                )}
              >
                <c.icon
                  size={18}
                  className={
                    questionType === c.value ? "text-indigo-600" : "text-slate-400"
                  }
                />
                <p className="font-semibold text-sm text-slate-900 mt-1.5">{c.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{c.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2 — Context (progressive: only relevant fields) */}
      {(mode === "edit" || questionType) && (
        <div className="rounded-xl border border-slate-100 p-4 bg-white space-y-3">
          <p className="text-xs font-bold text-indigo-500 uppercase tracking-wide">
            Where does it belong?
          </p>
          {mode === "add" && !locked && (
            <Select
              label="Exam *"
              value={examId}
              onChange={(e) => {
                setExamId(e.target.value);
                setSeriesId("");
              }}
              className={inputInvalid(errors.some((x) => x.includes("Exam")))}
            >
              <option value="">Select Exam</option>
              {exams.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.name}
                </option>
              ))}
            </Select>
          )}

          {(mode === "edit" || questionType === "practice" || locked) && (
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={mode === "add" && !locked ? "Subject *" : "Subject"}
                placeholder="e.g. General Knowledge"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className={inputInvalid(errors.some((x) => x.includes("Subject")))}
              />
              <Input
                label="Chapter / Topic"
                placeholder="e.g. Indian History"
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
              />
            </div>
          )}

          {mode === "add" && !locked && questionType === "pyp" && (
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Year *"
                type="number"
                placeholder="2024"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className={inputInvalid(errors.some((x) => x.includes("Year")))}
              />
              <Input
                label="Paper Name *"
                placeholder="SSC CGL 2024"
                value={paperName}
                onChange={(e) => setPaperName(e.target.value)}
                className={inputInvalid(errors.some((x) => x.includes("Paper")))}
              />
            </div>
          )}

          {mode === "add" && !locked && questionType === "testSeries" && (
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Test Series *"
                value={seriesId}
                onChange={(e) => setSeriesId(e.target.value)}
                className={inputInvalid(errors.some((x) => x.includes("Test Series")))}
              >
                <option value="">Select Series</option>
                {filteredSeries.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.title}
                  </option>
                ))}
              </Select>
              <Input
                label="Test Name *"
                placeholder="Test Series 1"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                className={inputInvalid(errors.some((x) => x.includes("Test name")))}
              />
              {examId && filteredSeries.length === 0 && (
                <p className="col-span-2 text-xs text-amber-600">
                  No test series exist for this exam yet. Create one in Test Series first.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 3 — Question body */}
      {(mode === "edit" || questionType) && (
        <>
          <Textarea
            label="Question Text *"
            rows={3}
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            className={inputInvalid(errors.some((x) => x.includes("Question text")))}
          />

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">
              Answer Options — select the correct one{" "}
              <span className="text-slate-400 font-normal">({MIN_OPTIONS}–{MAX_OPTIONS} options)</span>
            </p>
            {options.map((opt, idx) => (
              <div key={opt.id} className="flex items-center gap-3">
                <input
                  type="radio"
                  name="correct"
                  className="accent-indigo-600 w-4 h-4 shrink-0"
                  checked={correctOptionId === opt.id}
                  onChange={() => setCorrectOptionId(opt.id)}
                />
                <span className="font-bold text-sm w-5 text-slate-600 shrink-0">
                  {opt.id.toUpperCase()}.
                </span>
                <Input
                  placeholder={`Option ${opt.id.toUpperCase()}`}
                  value={opt.text}
                  onChange={(e) => setOpt(idx, e.target.value)}
                  className={cn(
                    "flex-1",
                    inputInvalid(
                      errors.some((x) => x.includes(`Option ${opt.id.toUpperCase()}`))
                    ),
                    correctOptionId === opt.id && "border-emerald-300 bg-emerald-50"
                  )}
                />
                <button
                  type="button"
                  onClick={() => removeOption(idx)}
                  disabled={options.length <= MIN_OPTIONS}
                  aria-label={`Remove option ${opt.id.toUpperCase()}`}
                  className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            {options.length < MAX_OPTIONS && (
              <Button variant="ghost" size="sm" onClick={addOption}>
                <Plus size={15} /> Add Option
              </Button>
            )}
          </div>

          <Textarea
            label="Explanation (shown after the test)"
            rows={8}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            className="min-h-[180px] leading-relaxed resize-y"
          />

          <div className="grid grid-cols-4 gap-3">
            <Select
              label="Difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Diff)}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </Select>
            <Input
              label="Marks"
              type="number"
              value={marks}
              onChange={(e) => setMarks(parseFloat(e.target.value) || 0)}
            />
            <Input
              label="Negative"
              type="number"
              step="0.25"
              value={negativeMarks}
              onChange={(e) => setNegativeMarks(parseFloat(e.target.value) || 0)}
            />
            <Select
              label="Language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </Select>
          </div>

          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">
              <div className="flex items-center gap-2 font-semibold mb-1">
                <AlertCircle size={15} /> Please fix {errors.length} issue
                {errors.length > 1 ? "s" : ""}:
              </div>
              <ul className="list-disc ml-6 space-y-0.5">
                {errors.slice(0, 6).map((er, i) => (
                  <li key={i}>{er}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-1">
            <Button onClick={() => save("published")} disabled={saving}>
              {saving ? "Saving..." : mode === "edit" ? "Save Changes" : "Save Question"}
            </Button>
            {mode === "add" && (
              <Button
                variant="secondary"
                onClick={() => save("published", true)}
                disabled={saving}
              >
                Save &amp; Add Another
              </Button>
            )}
            <Button variant="ghost" onClick={() => save("draft")} disabled={saving}>
              Save Draft
            </Button>
            <Button variant="ghost" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

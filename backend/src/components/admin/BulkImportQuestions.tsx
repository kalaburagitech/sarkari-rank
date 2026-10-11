"use client";

import { useMemo, useRef, useState } from "react";
import { api } from "@convex/_generated/api";
import { useOnce, useAdminMutation } from "@/lib/admin-data";
import { Id } from "@convex/_generated/dataModel";
import { toast } from "sonner";
import { UploadCloud, FileJson, CheckCircle2, AlertTriangle, X, Copy } from "lucide-react";
import { Button, Input, Textarea, Select, Card } from "@/components/admin/ui";
import { parseQuestionsJson, ParsedQuestion, Diff } from "@/lib/question-import";


// Minimal sample — only these 3 fields are required. Everything else
// (subject, difficulty, marks, negative marks, language) comes from the
// "Defaults" you set above, so you never have to repeat them per question.
const SAMPLE_JSON = `[
  {
    "question": "Who is known as the Father of the Indian Constitution?",
    "options": ["Mahatma Gandhi", "Dr. B.R. Ambedkar", "Jawaharlal Nehru", "Sardar Patel"],
    "answer": "B"
  },
  {
    "question": "What is the capital of India?",
    "options": ["Mumbai", "New Delhi", "Kolkata", "Chennai"],
    "answer": "B",
    "explanation": "New Delhi has been the capital since 1911."
  }
]`;

// Full example (all optional fields) — shown only in the format reference.
const FULL_SAMPLE_JSON = `[
  {
    "question": "Who is known as the Father of the Indian Constitution?",
    "options": ["Mahatma Gandhi", "Dr. B.R. Ambedkar", "Jawaharlal Nehru", "Sardar Patel"],
    "answer": "B",
    "explanation": "Dr. B.R. Ambedkar chaired the Drafting Committee.",
    "subject": "Indian Polity",
    "difficulty": "easy",
    "marks": 1,
    "negativeMarks": 0.25,
    "questionKn": "ಭಾರತೀಯ ಸಂವಿಧಾನದ ಪಿತಾಮಹ ಎಂದು ಯಾರನ್ನು ಕರೆಯುತ್ತಾರೆ?",
    "optionsKn": ["ಮಹಾತ್ಮ ಗಾಂಧಿ", "ಡಾ. ಬಿ.ಆರ್. ಅಂಬೇಡ್ಕರ್", "ಜವಾಹರಲಾಲ್ ನೆಹರು", "ಸರ್ದಾರ್ ಪಟೇಲ್"],
    "explanationKn": "ಡಾ. ಬಿ.ಆರ್. ಅಂಬೇಡ್ಕರ್ ಕರಡು ಸಮಿತಿಯ ಅಧ್ಯಕ್ಷರಾಗಿದ್ದರು."
  }
]`;

type NormalizedQ = Omit<ParsedQuestion, "year" | "message"> & { order: number };

function slugify(text: string): string {
  return (
    text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim() ||
    `test-${Date.now()}`
  );
}

export function BulkImportQuestions({
  onClose,
  onDone,
  mode = "generic",
}: {
  onClose: () => void;
  onDone: () => void;
  // "practice" hides the Category / test picker and files questions into the
  // exam's auto-managed practice bank by Subject → Chapter instead.
  mode?: "generic" | "practice";
}) {
  const isPractice = mode === "practice";
  const categories = useOnce(api.exams.listCategories, {});
  const exams = useOnce(api.exams.listExams, {});
  const tests = useOnce(api.exams.listTests, {});
  const createTest = useAdminMutation(api.exams.createTest);
  const bulkCreate = useAdminMutation(api.exams.bulkCreateQuestions);
  const bulkCreatePractice = useAdminMutation(api.exams.bulkCreatePracticeQuestions);
  const fileRef = useRef<HTMLInputElement>(null);

  const [categoryId, setCategoryId] = useState("");
  const [examId, setExamId] = useState("");
  const [chapter, setChapter] = useState("");
  // No separate "target test" mode: picking an existing test appends to it,
  // leaving it empty creates the paper from the title below.
  const [testId, setTestId] = useState("");
  const [newTest, setNewTest] = useState({ title: "", type: "mock", durationMinutes: 60, isFree: true, paperGroup: "" });
  const [def, setDef] = useState({ subject: "", language: "English", marks: 1, negativeMarks: 0.25, difficulty: "medium" as Diff });
  const [raw, setRaw] = useState("");
  const [preview, setPreview] = useState<{ ok: NormalizedQ[]; errors: string[] } | null>(null);
  const [importing, setImporting] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);

  const filteredExams = useMemo(
    () => (exams ?? []).filter((e) => !categoryId || e.categoryId === categoryId),
    [exams, categoryId]
  );
  const filteredTests = useMemo(
    () => (tests ?? []).filter((t) => !examId || t.examId === examId),
    [tests, examId]
  );
  const selectedTest = tests?.find((t) => t._id === testId);

  const parse = (): { ok: NormalizedQ[]; errors: string[] } => {
    const res = parseQuestionsJson(raw, def);
    // Practice imports append server-side (order is recomputed in the mutation);
    // for a specific existing test we continue after its current questions.
    const startOrder = !isPractice && testId ? selectedTest?.totalQuestions ?? 0 : 0;
    return {
      errors: res.errors,
      // year/message are Practice-Bank-only fields; the test validators reject them.
      ok: res.ok.map(({ year: _y, message: _m, ...q }, i) => ({
        ...q,
        subject: q.subject ?? (def.subject.trim() || undefined),
        topic: q.topic ?? (chapter.trim() || undefined),
        order: startOrder + i + 1,
      })),
    };
  };

  const handleValidate = () => {
    const result = parse();
    setPreview(result);
    if (result.ok.length) toast.success(`${result.ok.length} valid question(s) parsed`);
    if (result.errors.length) toast.error(`${result.errors.length} issue(s) found`);
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => { setRaw(String(reader.result ?? "")); setPreview(null); };
    reader.readAsText(file);
    // Suggest the paper name from the file name ("KAS-Prelims-2024.json" →
    // "KAS Prelims 2024") so an import needs no extra typing.
    if (!testId && !newTest.title.trim()) {
      const suggested = file.name.replace(/\.json$/i, "").replace(/[-_]+/g, " ").trim();
      if (suggested) setNewTest((t) => ({ ...t, title: suggested }));
    }
  };

  const readyContext = isPractice
    ? !!examId
    : examId && (testId || newTest.title.trim());

  const handleImport = async () => {
    if (!readyContext) {
      toast.error(
        isPractice
          ? "Select an exam"
          : "Select an exam, then pick a test or enter a title for the new one"
      );
      return;
    }
    const result = preview ?? parse();
    if (!result.ok.length) { toast.error("Nothing valid to import. Validate first."); return; }
    setImporting(true);
    try {
      if (isPractice) {
        await bulkCreatePractice({
          examId: examId as Id<"exams">,
          subject: def.subject.trim() || "General",
          topic: chapter.trim() || undefined,
          language: def.language,
          negativeMarks: def.negativeMarks,
          questions: result.ok,
        });
        const n = result.ok.length;
        toast.success(`✅ Imported ${n} practice question(s) into ${def.subject.trim() || "General"}${chapter.trim() ? ` › ${chapter.trim()}` : ""}! Paste another batch below.`);
        setRaw("");
        setPreview(null);
        setSessionCount((c) => c + n);
        onDone();
        setImporting(false);
        return;
      }
      let targetTestId = testId as Id<"tests">;
      if (!testId) {
        const totalMarks = result.ok.reduce((s, q) => s + q.marks, 0);
        targetTestId = (await createTest({
          examId: examId as Id<"exams">,
          title: newTest.title.trim(),
          slug: slugify(newTest.title),
          description: `${newTest.title.trim()} — imported via admin`,
          type: newTest.type as "mock" | "live" | "chapter" | "subject" | "pyp" | "daily" | "practice",
          durationMinutes: Number(newTest.durationMinutes) || 60,
          totalMarks,
          negativeMarking: def.negativeMarks,
          languages: [def.language],
          language: def.language,
          paperGroup: newTest.paperGroup.trim() || undefined,
          isFree: newTest.isFree,
          isPremium: !newTest.isFree,
        })) as Id<"tests">;
      }
      await bulkCreate({ testId: targetTestId, questions: result.ok });
      const n = result.ok.length;
      toast.success(`✅ Imported ${n} questions${!testId ? ` into new test "${newTest.title}"` : ""}! You can paste another batch below.`);
      // Keep the panel open so more batches can be added to the SAME test.
      if (!testId) {
        setTestId(targetTestId);
        setNewTest({ ...newTest, title: "" });
      }
      setRaw("");
      setPreview(null);
      setSessionCount((c) => c + n);
      onDone();
    } catch (err) {
      toast.error((err as Error).message);
    }
    setImporting(false);
  };

  return (
    <Card className="p-6 mb-6 border-indigo-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileJson className="text-indigo-600" size={20} />
          <h3 className="font-semibold text-slate-900 text-lg">Bulk Import Questions (JSON)</h3>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><X size={18} /></button>
      </div>

      {/* Step 1: target context */}
      {isPractice ? (
        <>
          <p className="text-xs font-bold text-indigo-500 uppercase tracking-wide mb-2">Step 1 · Exam, Subject &amp; Chapter</p>
          <p className="text-xs text-slate-500 mb-2">
            Practice questions are filed by <b>Subject → Chapter</b> into the exam&apos;s practice
            bank — no test to pick. Set the subject &amp; chapter once here (each question may still
            override them with its own <code>subject</code> / <code>chapter</code> field).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <Select label="Exam *" value={examId} onChange={(e) => setExamId(e.target.value)}>
              <option value="">— Select exam —</option>
              {(exams ?? []).map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}
            </Select>
            <Input label="Subject" value={def.subject} onChange={(e) => setDef({ ...def, subject: e.target.value })} placeholder="e.g. Indian Polity" />
            <Input label="Chapter / Topic" value={chapter} onChange={(e) => setChapter(e.target.value)} placeholder="e.g. Fundamental Rights" />
          </div>
        </>
      ) : (
      <>
      <p className="text-xs font-bold text-indigo-500 uppercase tracking-wide mb-2">Step 1 · Where do these questions belong?</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <Select label="Category" value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setExamId(""); setTestId(""); }}>
          <option value="">All categories</option>
          {categories?.map((c) => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}
        </Select>
        <Select label="Exam *" value={examId} onChange={(e) => { setExamId(e.target.value); setTestId(""); }}>
          <option value="">— Select exam —</option>
          {filteredExams.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}
        </Select>
        <Select label="Existing test (optional)" value={testId} onChange={(e) => setTestId(e.target.value)}>
          <option value="">— none: create a new test —</option>
          {filteredTests.map((t) => <option key={t._id} value={t._id}>{t.title} ({t.totalQuestions} Qs)</option>)}
        </Select>
      </div>

      {testId ? (
        <div>
          {selectedTest && (
            <p className="text-xs text-slate-500">
              <b>{selectedTest.title}</b> currently has <b className="text-indigo-600">{selectedTest.totalQuestions}</b> question(s). New questions are <b>appended</b> after them — safe to import in multiple batches.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2"><Input label="New test title *" placeholder="e.g. KAS Prelims 2024 GS Paper-1" value={newTest.title} onChange={(e) => setNewTest({ ...newTest, title: e.target.value })} /></div>
          <Select label="Type" value={newTest.type} onChange={(e) => setNewTest({ ...newTest, type: e.target.value })}>
            {["mock", "pyp", "subject", "chapter", "practice", "live", "daily"].map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
          <Input label="Duration (min)" type="number" value={newTest.durationMinutes} onChange={(e) => setNewTest({ ...newTest, durationMinutes: parseInt(e.target.value) || 60 })} />
          <div className="md:col-span-2">
            <Input label="Paper group (optional — set the SAME value on each language version to group them)" placeholder="e.g. ssc-cgl-2024-p1" value={newTest.paperGroup} onChange={(e) => setNewTest({ ...newTest, paperGroup: e.target.value })} />
          </div>
          <p className="md:col-span-4 text-xs text-slate-500">
            The paper&apos;s language comes from <b>Language</b> in Step 2. To add another language,
            import again with the same Paper group and a different Language.
          </p>
        </div>
      )}
      </>
      )}

      {/* Step 2: defaults */}
      <p className="text-xs font-bold text-indigo-500 uppercase tracking-wide mt-5 mb-1">Step 2 · Default values (optional)</p>
      <p className="text-xs text-slate-500 mb-2">
        Set {isPractice ? "Language, " : "Subject, "}Difficulty, Marks &amp; Negative <b>once</b> here — they apply to every imported
        question automatically. You do <b>not</b> need to repeat them in the JSON (add them per-question only
        if you want to override these defaults).
      </p>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-1">
        {!isPractice && (
          <Input label="Subject" value={def.subject} onChange={(e) => setDef({ ...def, subject: e.target.value })} placeholder="e.g. Karnataka GK" />
        )}
        <Select label="Language" value={def.language} onChange={(e) => setDef({ ...def, language: e.target.value })}>
          {["English", "Kannada", "Hindi"].map((l) => <option key={l} value={l}>{l}</option>)}
        </Select>
        <Select label="Difficulty" value={def.difficulty} onChange={(e) => setDef({ ...def, difficulty: e.target.value as Diff })}>
          <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
        </Select>
        <Input label="Marks" type="number" value={def.marks} onChange={(e) => setDef({ ...def, marks: parseFloat(e.target.value) || 1 })} />
        <Input label="Negative" type="number" step="0.25" value={def.negativeMarks} onChange={(e) => setDef({ ...def, negativeMarks: parseFloat(e.target.value) || 0 })} />
      </div>

      {/* Step 3: JSON */}
      <div className="flex items-center justify-between mt-5 mb-1">
        <p className="text-xs font-bold text-indigo-500 uppercase tracking-wide">Step 3 · Paste JSON or upload a .json file</p>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => { navigator.clipboard?.writeText(SAMPLE_JSON); toast.success("Sample copied"); }}><Copy size={14} /> Copy sample</Button>
          <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}><UploadCloud size={14} /> Upload file</Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
        </div>
      </div>
      <p className="text-xs text-slate-500 mb-2">
        Each question needs only <b>question</b>, <b>options</b> and <b>answer</b>. Subject, difficulty, marks &amp;
        negative marks are taken from Step 2 above.
      </p>
      <Textarea rows={9} value={raw} onChange={(e) => { setRaw(e.target.value); setPreview(null); }}
        placeholder={SAMPLE_JSON} className="font-mono text-xs" />

      {/* Preview */}
      {preview && (
        <div className="mt-3 space-y-2">
          {preview.ok.length > 0 && (
            <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5 text-sm">
              <CheckCircle2 size={16} /> {preview.ok.length} question(s) ready to import.
            </div>
          )}
          {preview.errors.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 text-sm text-amber-800">
              <div className="flex items-center gap-2 font-semibold mb-1"><AlertTriangle size={16} /> {preview.errors.length} issue(s):</div>
              <ul className="list-disc ml-6 space-y-0.5 max-h-32 overflow-y-auto">
                {preview.errors.slice(0, 20).map((er, i) => <li key={i}>{er}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 mt-4 items-center">
        <Button variant="secondary" onClick={handleValidate} disabled={!raw.trim()}>Validate &amp; Preview</Button>
        <Button onClick={handleImport} disabled={importing || !readyContext || !raw.trim()}>
          {importing ? "Importing..." : `Import ${preview?.ok.length ? preview.ok.length + " " : ""}Questions`}
        </Button>
        {sessionCount > 0 && (
          <span className="text-xs text-emerald-600 font-semibold ml-auto flex items-center gap-1">
            <CheckCircle2 size={14} /> Added {sessionCount} question(s) this session — paste the next batch to keep adding
          </span>
        )}
      </div>

      <details className="mt-4 text-xs text-slate-500">
        <summary className="cursor-pointer font-semibold text-slate-600">JSON format reference (with all optional fields)</summary>
        <pre className="mt-2 bg-slate-900 text-slate-100 rounded-xl p-4 overflow-x-auto">{FULL_SAMPLE_JSON}</pre>
        <ul className="list-disc ml-5 mt-2 space-y-1">
          <li><b>question</b> <span className="text-red-500 font-semibold">(required)</span> — the question text. Aliases: questionText, q.</li>
          <li><b>options</b> <span className="text-red-500 font-semibold">(required)</span> — array of 2–6 strings (or objects with id/text). Aliases: opts, choices.</li>
          <li><b>answer</b> <span className="text-red-500 font-semibold">(required)</span> — the correct option as a letter (A/B/C/D), a number (1-based), or the exact option text.</li>
          <li><b>explanation</b>, <b>subject</b>, <b>difficulty</b> (easy/medium/hard), <b>marks</b>, <b>negativeMarks</b>, <b>topic</b> — <b className="text-emerald-600">optional</b>; leave them out and they use the Step-2 defaults above.</li>
          <li><b>questionKn</b>, <b>optionsKn</b>, <b>explanationKn</b> — optional Kannada translations for bilingual tests.</li>
          <li><b>image</b> — optional image URL for the question (then the question text may be empty). Options can be objects: <code>{"{"}&quot;text&quot;: &quot;&quot;, &quot;image&quot;: &quot;https://…&quot;{"}"}</code>.</li>
          <li><b>passage</b> — optional comprehension passage. For a group, use <code>{"{"}&quot;passage&quot;: &quot;…&quot;, &quot;questions&quot;: [ … ]{"}"}</code> and every question inside gets it.</li>
          <li>Formatting in any text: <code>**bold**</code>, lines starting <code>- </code>, <code>1. </code>, <code>a) </code> for lists.</li>
        </ul>
      </details>
    </Card>
  );
}

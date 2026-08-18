"use client";

import { useMemo, useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { toast } from "sonner";
import { UploadCloud, FileJson, CheckCircle2, AlertTriangle, X, Copy } from "lucide-react";
import { Button, Input, Textarea, Select, Card } from "@/components/admin/ui";

const OPT_IDS = ["a", "b", "c", "d", "e", "f"];

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

type Diff = "easy" | "medium" | "hard";

type NormalizedQ = {
  questionText: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  explanation?: string;
  questionTextKn?: string;
  optionsKn?: { id: string; text: string }[];
  explanationKn?: string;
  subject?: string;
  topic?: string;
  difficulty: Diff;
  marks: number;
  negativeMarks: number;
  order: number;
  language: string;
};

function slugify(text: string): string {
  return (
    text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim() ||
    `test-${Date.now()}`
  );
}

// Pick first defined field from a list of possible key names
function pick<T = unknown>(obj: Record<string, unknown>, keys: string[]): T | undefined {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k] as T;
  }
  return undefined;
}

function normalizeOptions(rawOpts: unknown): { id: string; text: string }[] {
  if (!Array.isArray(rawOpts)) return [];
  return rawOpts.map((o, i) => {
    const id = OPT_IDS[i] ?? String(i);
    if (typeof o === "string") return { id, text: o.trim() };
    if (o && typeof o === "object") {
      const oo = o as Record<string, unknown>;
      return { id: (oo.id as string) ?? id, text: String(oo.text ?? oo.value ?? "").trim() };
    }
    return { id, text: String(o) };
  });
}

// Resolve the answer into an option id. Accepts letter (A-D), number (1-based or 0-based), or exact text.
function resolveAnswer(rawAns: unknown, options: { id: string; text: string }[]): string | null {
  if (rawAns === undefined || rawAns === null) return null;
  const s = String(rawAns).trim();
  if (!s) return null;
  // single letter
  if (/^[a-zA-Z]$/.test(s)) {
    const idx = s.toLowerCase().charCodeAt(0) - 97;
    if (options[idx]) return options[idx].id;
  }
  // numeric (1-based preferred, fall back to 0-based)
  if (/^\d+$/.test(s)) {
    const n = parseInt(s, 10);
    if (options[n - 1]) return options[n - 1].id;
    if (options[n]) return options[n].id;
  }
  // match option id directly
  const byId = options.find((o) => o.id.toLowerCase() === s.toLowerCase());
  if (byId) return byId.id;
  // match option text
  const byText = options.find((o) => o.text.toLowerCase() === s.toLowerCase());
  if (byText) return byText.id;
  return null;
}

export function BulkImportQuestions({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const categories = useQuery(api.exams.listCategories, {});
  const exams = useQuery(api.exams.listExams, {});
  const tests = useQuery(api.exams.listTests, {});
  const createTest = useMutation(api.exams.createTest);
  const bulkCreate = useMutation(api.exams.bulkCreateQuestions);
  const fileRef = useRef<HTMLInputElement>(null);

  const [categoryId, setCategoryId] = useState("");
  const [examId, setExamId] = useState("");
  const [testMode, setTestMode] = useState<"existing" | "new">("existing");
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
    const errors: string[] = [];
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      return { ok: [], errors: [`Invalid JSON: ${(e as Error).message}`] };
    }
    const arr: unknown[] = Array.isArray(data)
      ? data
      : Array.isArray((data as Record<string, unknown>)?.questions)
        ? ((data as Record<string, unknown>).questions as unknown[])
        : [];
    if (arr.length === 0) return { ok: [], errors: ["No questions found. Provide a JSON array (or an object with a \"questions\" array)."] };

    const startOrder = testMode === "existing" ? selectedTest?.totalQuestions ?? 0 : 0;
    const ok: NormalizedQ[] = [];
    arr.forEach((item, i) => {
      const n = i + 1;
      if (!item || typeof item !== "object") { errors.push(`Q${n}: not an object`); return; }
      const q = item as Record<string, unknown>;
      const text = String(pick<string>(q, ["question", "questionText", "q", "text"]) ?? "").trim();
      if (!text) { errors.push(`Q${n}: missing "question"`); return; }
      const options = normalizeOptions(pick(q, ["options", "opts", "choices"]));
      if (options.length < 2) { errors.push(`Q${n}: needs at least 2 options`); return; }
      if (options.some((o) => !o.text)) { errors.push(`Q${n}: an option is empty`); return; }
      const correctOptionId = resolveAnswer(pick(q, ["answer", "correct", "correctOption", "correctAnswer", "ans"]), options);
      if (!correctOptionId) { errors.push(`Q${n}: "answer" does not match any option`); return; }

      const rawDiff = String(pick<string>(q, ["difficulty", "diff", "level"]) ?? def.difficulty).toLowerCase();
      const difficulty: Diff = rawDiff === "easy" || rawDiff === "hard" ? (rawDiff as Diff) : "medium";

      const optsKnRaw = pick(q, ["optionsKn", "opts_kn", "kannadaOptions"]);
      const optionsKn = optsKnRaw ? normalizeOptions(optsKnRaw).map((o, idx) => ({ id: options[idx]?.id ?? o.id, text: o.text })) : undefined;

      ok.push({
        questionText: text,
        options,
        correctOptionId,
        explanation: (pick<string>(q, ["explanation", "exp", "solution"]) ?? "").toString().trim() || undefined,
        questionTextKn: (pick<string>(q, ["questionKn", "questionTextKn", "qKn"]) ?? "").toString().trim() || undefined,
        optionsKn: optionsKn && optionsKn.length ? optionsKn : undefined,
        explanationKn: (pick<string>(q, ["explanationKn", "expKn"]) ?? "").toString().trim() || undefined,
        subject: (pick<string>(q, ["subject", "sub"]) ?? def.subject).toString().trim() || undefined,
        topic: (pick<string>(q, ["topic"]) ?? "").toString().trim() || undefined,
        difficulty,
        marks: Number(pick(q, ["marks", "mark"]) ?? def.marks) || def.marks,
        negativeMarks: Number(pick(q, ["negativeMarks", "negative", "neg"]) ?? def.negativeMarks),
        order: startOrder + ok.length + 1,
        language: (pick<string>(q, ["language", "lang"]) ?? def.language).toString(),
      });
    });
    return { ok, errors };
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
  };

  const readyContext = examId && (testMode === "existing" ? testId : newTest.title.trim());

  const handleImport = async () => {
    if (!readyContext) { toast.error("Select an exam and a test (or enter a new test title)"); return; }
    const result = preview ?? parse();
    if (!result.ok.length) { toast.error("Nothing valid to import. Validate first."); return; }
    setImporting(true);
    try {
      let targetTestId = testId as Id<"tests">;
      if (testMode === "new") {
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
      toast.success(`✅ Imported ${n} questions${testMode === "new" ? ` into new test "${newTest.title}"` : ""}! You can paste another batch below.`);
      // Keep the panel open so more batches can be added to the SAME test.
      if (testMode === "new") {
        setTestMode("existing");
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
        <Select label="Target test" value={testMode} onChange={(e) => setTestMode(e.target.value as "existing" | "new")}>
          <option value="existing">Add to existing test</option>
          <option value="new">Create a new test</option>
        </Select>
      </div>

      {testMode === "existing" ? (
        <div>
          <Select label="Existing test *" value={testId} onChange={(e) => setTestId(e.target.value)}>
            <option value="">— Select test —</option>
            {filteredTests.map((t) => <option key={t._id} value={t._id}>{t.title} ({t.totalQuestions} Qs)</option>)}
          </Select>
          {selectedTest && (
            <p className="text-xs text-slate-500 mt-1.5">
              <b>{selectedTest.title}</b> currently has <b className="text-indigo-600">{selectedTest.totalQuestions}</b> question(s). New questions are <b>appended</b> after them — safe to import in multiple batches.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2"><Input label="New test title *" value={newTest.title} onChange={(e) => setNewTest({ ...newTest, title: e.target.value })} placeholder="e.g. FDA Mock Test 2" /></div>
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

      {/* Step 2: defaults */}
      <p className="text-xs font-bold text-indigo-500 uppercase tracking-wide mt-5 mb-1">Step 2 · Default values (optional)</p>
      <p className="text-xs text-slate-500 mb-2">
        Set Subject, Difficulty, Marks &amp; Negative <b>once</b> here — they apply to every imported
        question automatically. You do <b>not</b> need to repeat them in the JSON (add them per-question only
        if you want to override these defaults).
      </p>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-1">
        <Input label="Subject" value={def.subject} onChange={(e) => setDef({ ...def, subject: e.target.value })} placeholder="e.g. Karnataka GK" />
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
        </ul>
      </details>
    </Card>
  );
}

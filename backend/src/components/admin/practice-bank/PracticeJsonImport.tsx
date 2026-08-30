"use client";

import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { toast } from "sonner";
import { UploadCloud, CheckCircle2, AlertTriangle, Copy, X } from "lucide-react";
import { Button, Input, Select, Textarea, Card } from "@/components/admin/ui";
import { parseQuestionsJson, ParsedQuestion, Diff } from "@/lib/question-import";

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

export function PracticeJsonImport({
  chapterId,
  chapterName,
  onClose,
  onDone,
}: {
  chapterId: string;
  chapterName: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const bulkImport = useMutation(api.practiceBank.bulkImportPracticeQuestions);
  const fileRef = useRef<HTMLInputElement>(null);

  const [def, setDef] = useState({
    language: "English",
    marks: 1,
    negativeMarks: 0.25,
    difficulty: "medium" as Diff,
  });
  const [raw, setRaw] = useState("");
  const [preview, setPreview] = useState<{ ok: ParsedQuestion[]; errors: string[] } | null>(null);
  const [importing, setImporting] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);

  const handleValidate = () => {
    const result = parseQuestionsJson(raw, def);
    setPreview(result);
    if (result.ok.length) toast.success(`${result.ok.length} valid question(s) parsed`);
    if (result.errors.length) toast.error(`${result.errors.length} issue(s) found`);
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setRaw(String(reader.result ?? ""));
      setPreview(null);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    const result = preview ?? parseQuestionsJson(raw, def);
    if (!result.ok.length) {
      toast.error("Nothing valid to import. Validate first.");
      return;
    }
    setImporting(true);
    try {
      await bulkImport({
        chapterId: chapterId as Id<"chapters">,
        questions: result.ok.map((q) => ({
          questionText: q.questionText,
          options: q.options,
          correctOptionId: q.correctOptionId,
          explanation: q.explanation,
          questionTextKn: q.questionTextKn,
          optionsKn: q.optionsKn,
          explanationKn: q.explanationKn,
          difficulty: q.difficulty,
          marks: q.marks,
          negativeMarks: q.negativeMarks,
          language: q.language,
          year: q.year,
          message: q.message,
        })),
      });
      const n = result.ok.length;
      toast.success(`✅ Imported ${n} question(s) into ${chapterName}! Paste another batch below.`);
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
    <Card className="p-6 border-indigo-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-900">
          Import JSON → <span className="text-indigo-600">{chapterName}</span>
        </h3>
        <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
          <X size={18} />
        </button>
      </div>

      <p className="text-xs font-bold text-indigo-500 uppercase tracking-wide mb-1">Default values (optional)</p>
      <p className="text-xs text-slate-500 mb-2">
        Applied to every imported question unless the JSON overrides them per-question.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Select label="Language" value={def.language} onChange={(e) => setDef({ ...def, language: e.target.value })}>
          {["English", "Kannada", "Hindi"].map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </Select>
        <Select label="Difficulty" value={def.difficulty} onChange={(e) => setDef({ ...def, difficulty: e.target.value as Diff })}>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </Select>
        <Input label="Marks" type="number" value={def.marks} onChange={(e) => setDef({ ...def, marks: parseFloat(e.target.value) || 1 })} />
        <Input label="Negative" type="number" step="0.25" value={def.negativeMarks} onChange={(e) => setDef({ ...def, negativeMarks: parseFloat(e.target.value) || 0 })} />
      </div>

      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-bold text-indigo-500 uppercase tracking-wide">Paste JSON or upload a .json file</p>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => { navigator.clipboard?.writeText(SAMPLE_JSON); toast.success("Sample copied"); }}>
            <Copy size={14} /> Copy sample
          </Button>
          <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
            <UploadCloud size={14} /> Upload file
          </Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
        </div>
      </div>
      <p className="text-xs text-slate-500 mb-2">
        Each question needs only <b>question</b>, <b>options</b> and <b>answer</b>. Everything else uses the defaults above.
        Optional per-question: <b>message</b> (exam name) and <b>year</b> — when both are set they show in the app as
        &ldquo;Exam: &lt;message&gt; (&lt;year&gt;)&rdquo;.
      </p>
      <Textarea rows={9} value={raw} onChange={(e) => { setRaw(e.target.value); setPreview(null); }}
        placeholder={SAMPLE_JSON} className="font-mono text-xs" />

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
        <Button onClick={handleImport} disabled={importing || !raw.trim()}>
          {importing ? "Importing..." : `Import ${preview?.ok.length ? preview.ok.length + " " : ""}Questions`}
        </Button>
        {sessionCount > 0 && (
          <span className="text-xs text-emerald-600 font-semibold ml-auto flex items-center gap-1">
            <CheckCircle2 size={14} /> Added {sessionCount} this session
          </span>
        )}
      </div>
    </Card>
  );
}

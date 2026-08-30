"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { toast } from "sonner";
import { AlertCircle, Plus, X } from "lucide-react";
import { Button, Input, Textarea, Select } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

type Opt = { id: string; text: string };
type Diff = "easy" | "medium" | "hard";

export type PracticeQuestion = {
  _id: string;
  questionText: string;
  options: Opt[];
  correctOptionId: string;
  explanation?: string;
  difficulty: Diff;
  marks: number;
  negativeMarks: number;
  language: string;
  status?: string;
};

const OPTION_IDS = ["a", "b", "c", "d", "e", "f"];
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;
const emptyOptions = (): Opt[] => OPTION_IDS.slice(0, 4).map((id) => ({ id, text: "" }));

const LANGUAGES = ["English", "Hindi", "Kannada", "Tamil", "Telugu", "Marathi", "Bengali", "Gujarati", "Malayalam", "Punjabi", "Urdu"];

export function PracticeQuestionForm({
  mode,
  chapterId,
  editTarget,
  onClose,
}: {
  mode: "add" | "edit";
  chapterId: string;
  editTarget?: PracticeQuestion;
  onClose: () => void;
}) {
  const addQuestion = useMutation(api.practiceBank.addPracticeQuestion);
  const updateQuestion = useMutation(api.practiceBank.updatePracticeQuestion);

  const [questionText, setQuestionText] = useState(editTarget?.questionText ?? "");
  const [options, setOptions] = useState<Opt[]>(editTarget?.options ?? emptyOptions());
  const [correctOptionId, setCorrectOptionId] = useState(editTarget?.correctOptionId ?? "a");
  const [explanation, setExplanation] = useState(editTarget?.explanation ?? "");
  const [difficulty, setDifficulty] = useState<Diff>(editTarget?.difficulty ?? "medium");
  const [marks, setMarks] = useState(editTarget?.marks ?? 1);
  const [negativeMarks, setNegativeMarks] = useState(editTarget?.negativeMarks ?? 0.25);
  const [language, setLanguage] = useState(editTarget?.language ?? "English");
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

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
    if (correctOptionId === removed.id) setCorrectOptionId(next[0].id);
  };

  function validate(): string[] {
    const e: string[] = [];
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
      const payload = {
        questionText: questionText.trim(),
        options: options.map((o) => ({ id: o.id, text: o.text.trim() })),
        correctOptionId,
        explanation: explanation.trim() || undefined,
        difficulty,
        marks,
        negativeMarks,
        language,
        status,
      };
      if (mode === "edit" && editTarget) {
        await updateQuestion({ id: editTarget._id as Id<"practiceQuestions">, ...payload });
        toast.success("Question updated");
        onClose();
        return;
      }
      await addQuestion({ chapterId: chapterId as Id<"chapters">, ...payload });
      toast.success(status === "draft" ? "Saved as draft" : "Question added");
      if (addAnother) {
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

  const invalid = (bad: boolean) => (bad ? "border-red-300 bg-red-50" : "");

  return (
    <div className="space-y-4">
      <Textarea
        label="Question Text *"
        rows={3}
        value={questionText}
        onChange={(e) => setQuestionText(e.target.value)}
        className={invalid(errors.some((x) => x.includes("Question text")))}
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
              name="pb-correct"
              className="accent-indigo-600 w-4 h-4 shrink-0"
              checked={correctOptionId === opt.id}
              onChange={() => setCorrectOptionId(opt.id)}
            />
            <span className="font-bold text-sm w-5 text-slate-600 shrink-0">{opt.id.toUpperCase()}.</span>
            <Input
              placeholder={`Option ${opt.id.toUpperCase()}`}
              value={opt.text}
              onChange={(e) => setOpt(idx, e.target.value)}
              className={cn(
                "flex-1",
                invalid(errors.some((x) => x.includes(`Option ${opt.id.toUpperCase()}`))),
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
        label="Explanation (shown after answering)"
        rows={8}
        value={explanation}
        onChange={(e) => setExplanation(e.target.value)}
        className="min-h-[180px] leading-relaxed resize-y"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Select label="Difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value as Diff)}>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </Select>
        <Input label="Marks" type="number" value={marks} onChange={(e) => setMarks(parseFloat(e.target.value) || 0)} />
        <Input label="Negative" type="number" step="0.25" value={negativeMarks} onChange={(e) => setNegativeMarks(parseFloat(e.target.value) || 0)} />
        <Select label="Language" value={language} onChange={(e) => setLanguage(e.target.value)}>
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </Select>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">
          <div className="flex items-center gap-2 font-semibold mb-1">
            <AlertCircle size={15} /> Please fix {errors.length} issue{errors.length > 1 ? "s" : ""}:
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
          {saving ? "Saving..." : mode === "edit" ? "Save Changes" : "Add Question"}
        </Button>
        {mode === "add" && (
          <Button variant="secondary" onClick={() => save("published", true)} disabled={saving}>
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
    </div>
  );
}

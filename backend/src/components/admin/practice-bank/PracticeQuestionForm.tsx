"use client";

import { useState } from "react";
import { api } from "@convex/_generated/api";
import { useOnce, useAdminMutation } from "@/lib/admin-data";
import { Id } from "@convex/_generated/dataModel";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { Button, Input, Select } from "@/components/admin/ui";
import {
  QuestionBodyEditor,
  bodyFrom,
  bodyPayload,
  nextInPassage,
  validateBody,
  type QuestionBody,
} from "@/components/admin/questions/QuestionBodyEditor";

type Opt = { id: string; text: string; image?: string };
type Diff = "easy" | "medium" | "hard";

export type PracticeQuestion = {
  _id: string;
  questionText: string;
  questionImage?: string;
  passage?: string;
  options: Opt[];
  correctOptionId: string;
  explanation?: string;
  difficulty: Diff;
  marks: number;
  negativeMarks: number;
  language: string;
  year?: number;
  message?: string;
  status?: string;
};

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
  const addQuestion = useAdminMutation(api.practiceBank.addPracticeQuestion);
  const updateQuestion = useAdminMutation(api.practiceBank.updatePracticeQuestion);

  const [body, setBody] = useState<QuestionBody>(() => bodyFrom(editTarget));
  const [difficulty, setDifficulty] = useState<Diff>(editTarget?.difficulty ?? "medium");
  const [marks, setMarks] = useState(editTarget?.marks ?? 1);
  const [negativeMarks, setNegativeMarks] = useState(editTarget?.negativeMarks ?? 0.25);
  const [language, setLanguage] = useState(editTarget?.language ?? "English");
  const [message, setMessage] = useState(editTarget?.message ?? "");
  const [year, setYear] = useState<string>(editTarget?.year != null ? String(editTarget.year) : "");
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const validate = () => validateBody(body);

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
        ...bodyPayload(body, mode),
        difficulty,
        marks,
        negativeMarks,
        language,
        message: message.trim() || undefined,
        year: year.trim() ? parseInt(year, 10) : undefined,
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
        setBody(nextInPassage(body));
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

  return (
    <div className="space-y-4">
      <QuestionBodyEditor value={body} onChange={setBody} errors={errors} radioName="pb-correct" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <Input
            label="Asked in — exam name (optional)"
            placeholder="e.g. UPSC Civil Services Prelims"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <Input
          label="Year (optional)"
          type="number"
          placeholder="e.g. 2023"
          value={year}
          onChange={(e) => setYear(e.target.value)}
        />
      </div>
      <p className="-mt-1 text-xs text-slate-400">
        When both exam name &amp; year are filled, the app shows &ldquo;Exam: {message || "<exam>"}
        {year ? ` (${year})` : " (<year>)"}&rdquo; above the question.
      </p>

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

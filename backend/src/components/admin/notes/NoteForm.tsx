"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { Button, Input, Textarea, Select } from "@/components/admin/ui";
import { slugify } from "@/lib/utils";

type ExamOpt = { _id: string; name: string };

export type NoteTarget = {
  _id: string;
  examId: string;
  title: string;
  content: string;
  summary?: string;
  subject?: string;
  topic?: string;
  isPremium: boolean;
  isActive: boolean;
};

export function NoteForm({
  mode,
  exams,
  preset,
  editTarget,
  onClose,
}: {
  mode: "add" | "edit";
  exams: ExamOpt[];
  preset?: { examId?: string; subject?: string; topic?: string };
  editTarget?: NoteTarget;
  onClose: () => void;
}) {
  const createNote = useMutation(api.content.createStudyNote);
  const updateNote = useMutation(api.content.updateStudyNote);

  const [examId, setExamId] = useState(editTarget?.examId ?? preset?.examId ?? "");
  const [subject, setSubject] = useState(editTarget?.subject ?? preset?.subject ?? "");
  const [chapter, setChapter] = useState(editTarget?.topic ?? preset?.topic ?? "");
  const [title, setTitle] = useState(editTarget?.title ?? "");
  const [summary, setSummary] = useState(editTarget?.summary ?? "");
  const [content, setContent] = useState(editTarget?.content ?? "");
  const [isPremium, setIsPremium] = useState(editTarget?.isPremium ?? false);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function validate() {
    const e: string[] = [];
    if (!examId) e.push("Please select an Exam.");
    if (!title.trim()) e.push("Title is required.");
    if (!content.trim()) e.push("Content is required.");
    return e;
  }

  const invalid = (bad: boolean) => (bad ? "border-red-300 bg-red-50" : "");

  async function save(publish: boolean, addAnother = false) {
    const e = validate();
    setErrors(e);
    if (e.length) {
      toast.error(e[0]);
      return;
    }
    setSaving(true);
    try {
      if (mode === "edit" && editTarget) {
        await updateNote({
          id: editTarget._id as Id<"studyNotes">,
          title: title.trim(),
          content: content.trim(),
          summary: summary.trim() || undefined,
          subject: subject.trim() || undefined,
          topic: chapter.trim() || undefined,
          isPremium,
          isActive: publish,
        });
        toast.success("Note updated");
        onClose();
        return;
      }
      await createNote({
        examId: examId as Id<"exams">,
        title: title.trim(),
        slug: `${slugify(title)}-${Date.now()}`,
        content: content.trim(),
        summary: summary.trim() || undefined,
        subject: subject.trim() || undefined,
        topic: chapter.trim() || undefined,
        isPremium,
        isActive: publish,
      });
      toast.success(publish ? "Note published" : "Saved as draft");
      if (addAnother) {
        // Keep exam/subject/chapter, clear the note body.
        setTitle("");
        setSummary("");
        setContent("");
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Select
          label="Exam *"
          value={examId}
          onChange={(e) => setExamId(e.target.value)}
          className={invalid(errors.some((x) => x.includes("Exam")))}
        >
          <option value="">Select Exam</option>
          {exams.map((e) => (
            <option key={e._id} value={e._id}>
              {e.name}
            </option>
          ))}
        </Select>
        <Input
          label="Subject"
          placeholder="e.g. General Knowledge"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <Input
          label="Chapter / Topic"
          placeholder="e.g. Indian History"
          value={chapter}
          onChange={(e) => setChapter(e.target.value)}
        />
      </div>

      <Input
        label="Title *"
        placeholder="Ancient India — Key Points"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className={invalid(errors.some((x) => x.includes("Title")))}
      />
      <Input
        label="Summary (short one-liner shown in lists)"
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
      />
      <Textarea
        label="Content *"
        rows={10}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className={invalid(errors.some((x) => x.includes("Content")))}
      />

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          className="accent-indigo-600 w-4 h-4"
          checked={isPremium}
          onChange={(e) => setIsPremium(e.target.checked)}
        />
        Premium only
      </label>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">
          <div className="flex items-center gap-2 font-semibold mb-1">
            <AlertCircle size={15} /> Please fix {errors.length} issue
            {errors.length > 1 ? "s" : ""}:
          </div>
          <ul className="list-disc ml-6 space-y-0.5">
            {errors.map((er, i) => (
              <li key={i}>{er}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-3 pt-1">
        <Button onClick={() => save(true)} disabled={saving}>
          {saving ? "Saving..." : mode === "edit" ? "Save & Publish" : "Publish Note"}
        </Button>
        {mode === "add" && (
          <Button variant="secondary" onClick={() => save(true, true)} disabled={saving}>
            Save &amp; Add Another
          </Button>
        )}
        <Button variant="ghost" onClick={() => save(false)} disabled={saving}>
          Save Draft
        </Button>
        <Button variant="ghost" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

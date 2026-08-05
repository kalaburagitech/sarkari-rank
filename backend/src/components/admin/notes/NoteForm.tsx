"use client";

import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { toast } from "sonner";
import { AlertCircle, Bold, Italic, Heading2, Heading3, List, ListOrdered, Quote, Eye, Pencil } from "lucide-react";
import { Button, Input, Select } from "@/components/admin/ui";
import { markdownToHtml } from "@/lib/markdown";
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
  const [preview, setPreview] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Wrap the current selection with markdown markers (bold/italic/code…).
  function wrap(before: string, after: string, placeholder: string) {
    const ta = contentRef.current;
    if (!ta) {
      setContent(content + before + placeholder + after);
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const sel = content.slice(start, end) || placeholder;
    const next = content.slice(0, start) + before + sel + after + content.slice(end);
    setContent(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + before.length + sel.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  // Prefix the current line (headings, lists, quotes).
  function linePrefix(prefix: string) {
    const ta = contentRef.current;
    if (!ta) {
      setContent(content + (content && !content.endsWith("\n") ? "\n" : "") + prefix);
      return;
    }
    const start = ta.selectionStart;
    const lineStart = content.lastIndexOf("\n", start - 1) + 1;
    const next = content.slice(0, lineStart) + prefix + content.slice(lineStart);
    setContent(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + prefix.length;
      ta.setSelectionRange(pos, pos);
    });
  }

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
      {/* Rich content editor (Markdown) */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-medium text-slate-700">Content * <span className="text-slate-400 font-normal">· formatting supported</span></label>
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            <button type="button" onClick={() => setPreview(false)}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold ${!preview ? "bg-indigo-600 text-white" : "bg-white text-slate-600"}`}>
              <Pencil size={13} /> Write
            </button>
            <button type="button" onClick={() => setPreview(true)}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold ${preview ? "bg-indigo-600 text-white" : "bg-white text-slate-600"}`}>
              <Eye size={13} /> Preview
            </button>
          </div>
        </div>

        {!preview && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            <button type="button" title="Heading" onClick={() => linePrefix("## ")} className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-indigo-600"><Heading2 size={15} /></button>
            <button type="button" title="Subheading" onClick={() => linePrefix("### ")} className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-indigo-600"><Heading3 size={15} /></button>
            <button type="button" title="Bold" onClick={() => wrap("**", "**", "bold text")} className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-indigo-600"><Bold size={15} /></button>
            <button type="button" title="Italic" onClick={() => wrap("*", "*", "italic text")} className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-indigo-600"><Italic size={15} /></button>
            <button type="button" title="Bullet list" onClick={() => linePrefix("- ")} className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-indigo-600"><List size={15} /></button>
            <button type="button" title="Numbered list" onClick={() => linePrefix("1. ")} className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-indigo-600"><ListOrdered size={15} /></button>
            <button type="button" title="Quote" onClick={() => linePrefix("> ")} className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-indigo-600"><Quote size={15} /></button>
          </div>
        )}

        {preview ? (
          <div
            className={`md-preview border rounded-xl px-5 py-4 bg-white min-h-[220px] max-h-[420px] overflow-y-auto ${errors.some((x) => x.includes("Content")) ? "border-red-300" : "border-slate-200"}`}
            dangerouslySetInnerHTML={{ __html: content.trim() ? markdownToHtml(content) : '<p style="color:#94a3b8">Nothing to preview yet — switch to Write and start typing.</p>' }}
          />
        ) : (
          <textarea
            ref={contentRef}
            rows={14}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={"Write the note here.\n\n## Section heading\nExplain the topic in clear points.\n\n- Key point one\n- Key point two\n\n> Important: exam tip goes here.\n\nUse **bold** for keywords."}
            className={`w-full border rounded-xl px-4 py-3 text-sm text-slate-900 bg-white font-mono leading-6 resize-y ${errors.some((x) => x.includes("Content")) ? "border-red-300 bg-red-50" : "border-slate-200"}`}
          />
        )}
        <p className="text-xs text-slate-400 mt-1">
          Supports Markdown: <b># Heading</b>, <b>**bold**</b>, <b>*italic*</b>, <b>- lists</b>, <b>&gt; quotes</b>. Students read it as a formatted document and can download a PDF.
        </p>
      </div>

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

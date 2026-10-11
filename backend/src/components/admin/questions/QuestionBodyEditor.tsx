"use client";

// The question itself — passage, text, image, options, explanation. Shared by
// the exam question form and the Practice Bank form so both get the same
// formatting, image and passage support.

import { useState } from "react";
import { Plus, X, BookText, ChevronDown } from "lucide-react";
import { Button, Input } from "@/components/admin/ui";
import { RichTextarea, ImageField } from "@/components/admin/RichEditor";
import { cn } from "@/lib/utils";

export type BodyOpt = { id: string; text: string; image?: string };

export type QuestionBody = {
  passage: string;
  questionText: string;
  questionImage: string;
  options: BodyOpt[];
  correctOptionId: string;
  explanation: string;
};

// Positional letter ids. Options can be 2–6; ids are assigned by position and
// NOT renumbered on removal, so `correctOptionId` stays valid for surviving rows.
const OPTION_IDS = ["a", "b", "c", "d", "e", "f"];
export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 6;

export const emptyOptions = (): BodyOpt[] => OPTION_IDS.slice(0, 4).map((id) => ({ id, text: "" }));

export function bodyFrom(q?: {
  passage?: string;
  questionText?: string;
  questionImage?: string;
  options?: BodyOpt[];
  correctOptionId?: string;
  explanation?: string;
}): QuestionBody {
  return {
    passage: q?.passage ?? "",
    questionText: q?.questionText ?? "",
    questionImage: q?.questionImage ?? "",
    options: q?.options?.map((o) => ({ id: o.id, text: o.text, image: o.image })) ?? emptyOptions(),
    correctOptionId: q?.correctOptionId ?? "a",
    explanation: q?.explanation ?? "",
  };
}

/** Clears the question but keeps the passage, for "Save & Add Another". */
export const nextInPassage = (b: QuestionBody): QuestionBody => ({ ...bodyFrom(), passage: b.passage });

// Only what a student genuinely needs: something to read and answerable options.
export function validateBody(b: QuestionBody): string[] {
  const e: string[] = [];
  if (!b.questionText.trim() && !b.questionImage) e.push("Add the question text or a question image.");
  if (b.options.length < MIN_OPTIONS) e.push("Add at least two answer options.");
  b.options.forEach((o) => {
    if (!o.text.trim() && !o.image) e.push(`Option ${o.id.toUpperCase()} needs text or an image.`);
  });
  if (!b.options.some((o) => o.id === b.correctOptionId)) e.push("Please select the correct answer.");
  return e;
}

/**
 * Mutation payload. On edit, cleared optional fields are sent as "" so the
 * server removes them; on add they are simply left out.
 */
export function bodyPayload(b: QuestionBody, mode: "add" | "edit") {
  const opt = (s: string) => (s.trim() ? s.trim() : mode === "edit" ? "" : undefined);
  return {
    passage: opt(b.passage),
    questionText: b.questionText.trim(),
    questionImage: b.questionImage ? b.questionImage : mode === "edit" ? "" : undefined,
    options: b.options.map((o) => ({ id: o.id, text: o.text.trim(), ...(o.image ? { image: o.image } : {}) })),
    correctOptionId: b.correctOptionId,
    explanation: opt(b.explanation),
  };
}

export function QuestionBodyEditor({
  value,
  onChange,
  errors,
  radioName,
}: {
  value: QuestionBody;
  onChange: (b: QuestionBody) => void;
  errors: string[];
  radioName: string;
}) {
  const [showPassage, setShowPassage] = useState(!!value.passage);
  const set = (patch: Partial<QuestionBody>) => onChange({ ...value, ...patch });
  const has = (s: string) => errors.some((x) => x.includes(s));

  const setOpt = (idx: number, patch: Partial<BodyOpt>) =>
    set({ options: value.options.map((o, i) => (i === idx ? { ...o, ...patch } : o)) });

  const addOption = () => {
    if (value.options.length >= MAX_OPTIONS) return;
    const used = new Set(value.options.map((o) => o.id));
    const id = OPTION_IDS.find((x) => !used.has(x))!;
    set({ options: [...value.options, { id, text: "" }] });
  };

  const removeOption = (idx: number) => {
    if (value.options.length <= MIN_OPTIONS) return;
    const removed = value.options[idx];
    const options = value.options.filter((_, i) => i !== idx);
    set({
      options,
      // If the option marked correct was removed, fall back to the first remaining.
      correctOptionId: value.correctOptionId === removed.id ? options[0].id : value.correctOptionId,
    });
  };

  const passageOpen = showPassage || !!value.passage;

  return (
    <div className="space-y-4">
      {/* Passage / common data — optional, shared by a group of questions */}
      <div className={cn("rounded-xl border", passageOpen ? "border-amber-200 bg-amber-50/40" : "border-dashed border-slate-200")}>
        <button
          type="button"
          onClick={() => setShowPassage((s) => !s)}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
        >
          <BookText size={16} className={passageOpen ? "text-amber-600" : "text-slate-400"} />
          <span className="text-sm font-semibold text-slate-700">
            Passage / common data <span className="font-normal text-slate-400">(optional — for comprehension, data interpretation, puzzles)</span>
          </span>
          <ChevronDown size={16} className={cn("ml-auto text-slate-400 transition-transform", passageOpen && "rotate-180")} />
        </button>
        {passageOpen && (
          <div className="px-3 pb-3">
            <RichTextarea
              value={value.passage}
              onChange={(passage) => set({ passage })}
              rows={5}
              placeholder="Read the passage below and answer the questions that follow…"
              hint={<>Write it once, then use <b>Save &amp; Add Another</b> — the passage stays for the next 5–6 questions. Students see it above each question.</>}
            />
          </div>
        )}
      </div>

      <RichTextarea
        label={<>Question <span className="font-normal text-slate-400">(text, image, or both)</span></>}
        value={value.questionText}
        onChange={(questionText) => set({ questionText })}
        rows={3}
        placeholder="e.g. How many circles are there in the figure below?"
        invalid={has("question text")}
      />

      <ImageField
        label="Question image (optional)"
        value={value.questionImage}
        onChange={(questionImage) => set({ questionImage })}
      />

      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">
          Answer options — select the correct one{" "}
          <span className="text-slate-400 font-normal">({MIN_OPTIONS}–{MAX_OPTIONS} options · text or image)</span>
        </p>
        {value.options.map((opt, idx) => {
          const L = opt.id.toUpperCase();
          return (
            <div key={opt.id} className="flex items-center gap-2.5">
              <input
                type="radio"
                name={radioName}
                aria-label={`Mark option ${L} correct`}
                className="accent-indigo-600 w-4 h-4 shrink-0"
                checked={value.correctOptionId === opt.id}
                onChange={() => set({ correctOptionId: opt.id })}
              />
              <span className="font-bold text-sm w-5 text-slate-600 shrink-0">{L}.</span>
              <div className="flex-1 min-w-0">
              <Input
                placeholder={opt.image ? `Option ${L} (optional caption)` : `Option ${L}`}
                value={opt.text}
                onChange={(e) => setOpt(idx, { text: e.target.value })}
                onKeyDown={(e) => {
                  // Same shortcut as the big editors, for bold words inside an option.
                  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
                    e.preventDefault();
                    const t = e.currentTarget;
                    const [s, en] = [t.selectionStart ?? 0, t.selectionEnd ?? 0];
                    if (s === en) return;
                    const v = t.value;
                    const sel = v.slice(s, en);
                    const next = /^\*\*.+\*\*$/.test(sel) ? sel.slice(2, -2) : `**${sel}**`;
                    setOpt(idx, { text: v.slice(0, s) + next + v.slice(en) });
                  }
                }}
                className={cn(
                  has(`Option ${L}`) && "border-red-300 bg-red-50",
                  value.correctOptionId === opt.id && "border-emerald-300 bg-emerald-50"
                )}
              />
              </div>
              <ImageField compact value={opt.image} onChange={(image) => setOpt(idx, { image: image || undefined })} />
              <button
                type="button"
                onClick={() => removeOption(idx)}
                disabled={value.options.length <= MIN_OPTIONS}
                aria-label={`Remove option ${L}`}
                className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
        {value.options.length < MAX_OPTIONS && (
          <Button variant="ghost" size="sm" onClick={addOption}>
            <Plus size={15} /> Add Option
          </Button>
        )}
      </div>

      <RichTextarea
        label="Explanation (shown after answering)"
        value={value.explanation}
        onChange={(explanation) => set({ explanation })}
        rows={6}
        placeholder="Optional. Use lists, bold and images to explain the solution step by step."
      />
    </div>
  );
}

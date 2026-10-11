"use client";

// Formatting-aware textarea + image pickers for the question editors.
// Text is stored in the small markup described in lib/rich.ts.

import { useRef, useState } from "react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { adminHttp } from "@/lib/admin-data";
import { htmlToRich, hasRichMarkup, richToHtml } from "@/lib/rich";
import { toast } from "sonner";
import { Bold, List, ListOrdered, ImagePlus, Loader2, X, CaseLower, CaseUpper, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Image upload ──────────────────────────────────────────────────────────

const MAX_SIDE = 1600;

// Shrinks big photos / converts SVG (the app can't draw SVG) before upload so
// students don't download 5 MB screenshots on mobile data.
async function prepareImage(blob: Blob): Promise<Blob> {
  if (blob.type === "image/gif") return blob;
  const small = blob.size < 400_000 && blob.type !== "image/svg+xml";
  const bmp = await createImageBitmap(blob).catch(() => null);
  if (!bmp) return blob;
  if (small && Math.max(bmp.width, bmp.height) <= MAX_SIDE) return blob;
  const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  const g = canvas.getContext("2d")!;
  g.fillStyle = "#fff"; // transparent figures stay readable in dark mode
  g.fillRect(0, 0, canvas.width, canvas.height);
  g.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return await new Promise<Blob>((res) => canvas.toBlob((b) => res(b ?? blob), "image/webp", 0.88));
}

/** Uploads an image to Convex storage and returns its public URL. */
export async function uploadImage(blob: Blob): Promise<string> {
  if (!blob.type.startsWith("image/")) throw new Error("Please choose an image file");
  if (blob.size > 15 * 1024 * 1024) throw new Error("Image is larger than 15 MB");
  const file = await prepareImage(blob);
  const uploadUrl = await adminHttp.mutation(api.content.generateNoteUploadUrl, {});
  const res = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.storageId) throw new Error("Image upload failed");
  const url = await adminHttp.query(api.content.getStorageUrl, { storageId: json.storageId as Id<"_storage"> });
  if (!url) throw new Error("Image upload failed");
  return url;
}

// Re-hosts a pasted image (Google Docs / web links expire); keeps the original
// link only if it can't be fetched.
async function rehost(src: string): Promise<string | null> {
  try {
    const blob = await (await fetch(src)).blob();
    return await uploadImage(blob);
  } catch {
    return src.startsWith("http") ? src : null;
  }
}

function imageFiles(list: FileList | null | undefined): File[] {
  return Array.from(list ?? []).filter((f) => f.type.startsWith("image/"));
}

// ─── Text editing helpers (keep the browser's undo stack) ─────────────────

function replaceRange(ta: HTMLTextAreaElement, start: number, end: number, text: string, selStart?: number, selEnd?: number) {
  ta.focus();
  ta.setSelectionRange(start, end);
  const ok = text ? document.execCommand("insertText", false, text) : document.execCommand("delete");
  if (!ok) {
    ta.setRangeText(text, start, end, "end");
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  }
  if (selStart !== undefined) ta.setSelectionRange(selStart, selEnd ?? selStart);
}

function toggleBold(ta: HTMLTextAreaElement) {
  const v = ta.value;
  let s = ta.selectionStart;
  let e = ta.selectionEnd;
  // Double-click often grabs a trailing space — keep it outside the markers.
  while (s < e && /\s/.test(v[s])) s++;
  while (e > s && /\s/.test(v[e - 1])) e--;
  if (s === e) {
    replaceRange(ta, s, e, "****", s + 2);
    return;
  }
  if (v.slice(s - 2, s) === "**" && v.slice(e, e + 2) === "**") {
    replaceRange(ta, s - 2, e + 2, v.slice(s, e), s - 2, e - 2);
    return;
  }
  const sel = v.slice(s, e);
  if (/^\*\*[\s\S]+\*\*$/.test(sel)) {
    const inner = sel.slice(2, -2);
    replaceRange(ta, s, e, inner, s, s + inner.length);
    return;
  }
  // Bold can't cross a line break in the markup — wrap each line.
  const wrapped = sel
    .split("\n")
    .map((l) => (l.trim() ? l.replace(/^(\s*)(.*?)(\s*)$/, "$1**$2**$3") : l))
    .join("\n");
  replaceRange(ta, s, e, wrapped, s, s + wrapped.length);
}

type ListKind = "bullet" | "number" | "lower" | "upper";
const MARKER = /^(\s*)([-*•]|\((?:\d{1,3}|[a-zA-Z]|[ivxIVX]{1,4})\)|(?:\d{1,3}|[a-zA-Z]|[ivxIVX]{1,4})[.)])\s+/;

function markerFor(kind: ListKind, i: number) {
  if (kind === "bullet") return "-";
  if (kind === "number") return `${i + 1}.`;
  const c = String.fromCharCode(97 + (i % 26));
  return kind === "lower" ? `${c})` : `${c.toUpperCase()})`;
}

function kindOf(marker: string): ListKind {
  if (/^[-*•]$/.test(marker)) return "bullet";
  if (/\d/.test(marker)) return "number";
  return /[a-z]/.test(marker) ? "lower" : "upper";
}

// Turns the selected lines into a list (or switches list style). Running the
// same style again removes the markers.
function toggleList(ta: HTMLTextAreaElement, kind: ListKind) {
  const v = ta.value;
  const start = v.lastIndexOf("\n", ta.selectionStart - 1) + 1;
  let end = v.indexOf("\n", ta.selectionEnd - (ta.selectionEnd > ta.selectionStart && v[ta.selectionEnd - 1] === "\n" ? 1 : 0));
  if (end === -1) end = v.length;
  const lines = v.slice(start, end).split("\n");
  const filled = lines.filter((l) => l.trim());
  const already = filled.length > 0 && filled.every((l) => {
    const m = l.match(MARKER);
    return m && kindOf(m[2]) === kind;
  });
  let i = 0;
  const next = lines
    .map((l) => {
      if (!l.trim()) return l;
      const m = l.match(MARKER);
      const indent = m ? m[1] : (l.match(/^\s*/)?.[0] ?? "");
      const body = m ? l.slice(m[0].length) : l.trimStart();
      return already ? `${indent}${body}` : `${indent}${markerFor(kind, i++)} ${body}`;
    })
    .join("\n");
  replaceRange(ta, start, end, next, start, start + next.length);
}

const TOOLS: { icon: React.ElementType; title: string; action: ListKind | "bold" | "image" }[] = [
  { icon: Bold, title: "Bold (Ctrl+B)", action: "bold" },
  { icon: List, title: "Bullet list (Ctrl+Shift+8)", action: "bullet" },
  { icon: ListOrdered, title: "Numbered list 1, 2, 3 (Ctrl+Shift+7)", action: "number" },
  { icon: CaseLower, title: "Alphabet list a, b, c", action: "lower" },
  { icon: CaseUpper, title: "Alphabet list A, B, C", action: "upper" },
  { icon: ImagePlus, title: "Insert image (or paste / drop one)", action: "image" },
];

// ─── RichTextarea ──────────────────────────────────────────────────────────

export function RichTextarea({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
  invalid,
  hint,
  className,
}: {
  label?: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  invalid?: boolean;
  hint?: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  const insertAtCaret = (text: string) => {
    const ta = ref.current!;
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    const before = ta.value.slice(0, s);
    // Images must sit on their own line to render.
    const pre = text.startsWith("![") && before && !before.endsWith("\n") ? "\n" : "";
    replaceRange(ta, s, e, pre + text);
  };

  const insertImages = async (files: File[]) => {
    if (!files.length) return;
    setBusy(true);
    const t = toast.loading(`Uploading ${files.length} image${files.length > 1 ? "s" : ""}…`);
    try {
      for (const f of files) insertAtCaret(`![image](${await uploadImage(f)})\n`);
      toast.success("Image added", { id: t });
    } catch (err) {
      toast.error((err as Error).message, { id: t });
    } finally {
      setBusy(false);
    }
  };

  const onPaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const files = imageFiles(e.clipboardData.files);
    const html = e.clipboardData.getData("text/html");
    const rich = html ? htmlToRich(html) : null;
    if (rich) {
      e.preventDefault();
      let text = rich.text;
      if (rich.images.length) {
        setBusy(true);
        const t = toast.loading("Copying pasted images…");
        for (const src of rich.images) {
          const url = await rehost(src);
          text = text.replace(`![image](${src})`, url ? `![image](${url})` : "");
        }
        toast.dismiss(t);
        setBusy(false);
      }
      insertAtCaret(text);
      return;
    }
    if (files.length) {
      e.preventDefault();
      await insertImages(files);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === "b") {
      e.preventDefault();
      toggleBold(e.currentTarget);
    } else if (e.shiftKey && (k === "8" || k === "*")) {
      e.preventDefault();
      toggleList(e.currentTarget, "bullet");
    } else if (e.shiftKey && (k === "7" || k === "&")) {
      e.preventDefault();
      toggleList(e.currentTarget, "number");
    }
  };

  const runTool = (action: ListKind | "bold" | "image") => {
    const ta = ref.current;
    if (!ta) return;
    if (action === "bold") toggleBold(ta);
    else if (action === "image") fileRef.current?.click();
    else toggleList(ta, action);
  };

  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>}
      <div
        className={cn(
          "rounded-xl border bg-white transition-all focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300",
          invalid ? "border-red-300 bg-red-50" : "border-slate-200",
          dragging && "ring-2 ring-indigo-300 border-indigo-400"
        )}
        onDragOver={(e) => {
          if (Array.from(e.dataTransfer.items).some((i) => i.type.startsWith("image/"))) {
            e.preventDefault();
            setDragging(true);
          }
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          const files = imageFiles(e.dataTransfer.files);
          setDragging(false);
          if (files.length) {
            e.preventDefault();
            void insertImages(files);
          }
        }}
      >
        <div className="flex items-center gap-0.5 px-1.5 py-1 border-b border-slate-100">
          {TOOLS.map((t) => (
            <button
              key={t.title}
              type="button"
              title={t.title}
              aria-label={t.title}
              onMouseDown={(e) => e.preventDefault()} // keep the textarea selection
              onClick={() => runTool(t.action)}
              disabled={busy}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-indigo-700 disabled:opacity-40"
            >
              <t.icon size={16} />
            </button>
          ))}
          {busy && <Loader2 size={15} className="ml-1 animate-spin text-indigo-500" />}
          <span className="ml-auto pr-1.5 text-[11px] text-slate-400 hidden sm:block">Ctrl+B bold · paste keeps formatting</span>
        </div>
        <textarea
          ref={ref}
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          className="block w-full rounded-b-xl px-4 py-2.5 text-sm text-slate-900 bg-transparent resize-y outline-none leading-relaxed"
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            void insertImages(imageFiles(e.target.files));
            e.target.value = "";
          }}
        />
      </div>
      {hasRichMarkup(value) && (
        <div className="mt-1.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Preview — as students see it</p>
          <div className="text-sm text-slate-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: richToHtml(value) }} />
        </div>
      )}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

// ─── Image field (question image / option image) ──────────────────────────

export function ImageField({
  value,
  onChange,
  label,
  compact,
}: {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  compact?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const take = async (files: File[]) => {
    if (!files[0]) return;
    setBusy(true);
    try {
      onChange(await uploadImage(files[0]));
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const input = (
    <input
      ref={fileRef}
      type="file"
      accept="image/*"
      hidden
      onChange={(e) => {
        void take(imageFiles(e.target.files));
        e.target.value = "";
      }}
    />
  );

  if (compact) {
    return value ? (
      <div className="relative shrink-0 group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value} alt="" className="h-10 w-14 object-contain rounded-lg border border-slate-200 bg-white" />
        <button type="button" onClick={() => onChange("")} aria-label="Remove image"
          className="absolute -top-1.5 -right-1.5 bg-white border border-slate-200 rounded-full p-0.5 text-slate-500 hover:text-red-600 shadow-sm">
          <X size={11} />
        </button>
      </div>
    ) : (
      <button type="button" title="Add image to this option" aria-label="Add image to this option"
        onClick={() => fileRef.current?.click()} disabled={busy}
        className="p-2 rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors shrink-0">
        {busy ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
        {input}
      </button>
    );
  }

  return (
    <div>
      {label && <p className="text-sm font-medium text-slate-700 mb-1.5">{label}</p>}
      {value ? (
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="max-h-48 max-w-full sm:max-w-sm object-contain rounded-xl border border-slate-200 bg-white" />
          <div className="flex flex-col gap-1.5">
            <button type="button" onClick={() => fileRef.current?.click()} className="text-xs font-semibold text-indigo-600 hover:underline">Replace</button>
            <button type="button" onClick={() => onChange("")} className="text-xs font-semibold text-red-600 hover:underline">Remove</button>
          </div>
          {input}
        </div>
      ) : (
        <div
          tabIndex={0}
          role="button"
          onClick={() => fileRef.current?.click()}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileRef.current?.click()}
          onPaste={(e) => {
            const f = imageFiles(e.clipboardData.files);
            if (f.length) { e.preventDefault(); void take(f); }
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); void take(imageFiles(e.dataTransfer.files)); }}
          className="flex items-center gap-3 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/40 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        >
          {busy ? <Loader2 size={18} className="animate-spin text-indigo-500" /> : <Upload size={18} className="text-slate-400" />}
          <span>{busy ? "Uploading…" : <>Click, drop, or <b>paste</b> an image (diagram, figure, puzzle…)</>}</span>
          {input}
        </div>
      )}
    </div>
  );
}

/** Read-only render of rich text (admin previews). */
export function RichView({ text, className }: { text?: string; className?: string }) {
  if (!text) return null;
  return <div className={cn("leading-relaxed", className)} dangerouslySetInnerHTML={{ __html: richToHtml(text) }} />;
}

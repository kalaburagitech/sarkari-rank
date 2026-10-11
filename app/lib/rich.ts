// Rich text for questions, options, passages and explanations.
//
// Stored as plain text with a tiny markup, so old questions stay valid and JSON
// imports keep working:
//   **bold**                       bold (Ctrl+B in the admin editor)
//   - item  /  • item              bullet list
//   1. item  1) item  (1) item     numbered list
//   a. item  a) item  (a) item     alphabetical list (A. / (A) for capitals)
//   i. item  (iv) item             roman list
//   ![alt](https://…)              image on its own line
//
// MIRROR of backend/src/lib/rich.ts (parser half) — keep the two identical.

export type RichBlock =
  | { kind: "p"; text: string }
  | { kind: "li"; marker: string; text: string; indent: number }
  | { kind: "img"; url: string; alt: string }
  | { kind: "gap" };

const IMG = /^\s*!\[([^\]]*)\]\((\S+?)\)\s*$/;
const BULLET = /^(\s*)[-*•]\s+(.*)$/;
// digits, a single letter, or a roman numeral, as "x." "x)" or "(x)"
const ORDERED = /^(\s*)(\((?:\d{1,3}|[a-zA-Z]|[ivxIVX]{1,4})\)|(?:\d{1,3}|[a-zA-Z]|[ivxIVX]{1,4})[.)])\s+(.*)$/;

function listItem(line: string): { marker: string; text: string; indent: number; letter: boolean } | null {
  const b = line.match(BULLET);
  if (b) return { marker: "•", text: b[2], indent: Math.floor(b[1].length / 2), letter: false };
  const o = line.match(ORDERED);
  if (o) return { marker: o[2], text: o[3], indent: Math.floor(o[1].length / 2), letter: !/\d/.test(o[2]) };
  return null;
}

// ─── Inline statement lists ───────────────────────────────────────────────
// Exam questions often arrive as one paragraph: "Consider: (a) … (b) … (c) …".
// Split such runs onto their own lines so they render as a list. Only
// sequential markers count — (a)(b)(c), (A)(B), (i)(ii)(iii) or (1)(2)(3) —
// and every statement must be substantial, so answer options like
// "(a) and (b) only" stay on one line.

const ROMAN_SEQ = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"];
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const MIN_STATEMENT = 12; // characters (code points) per split-out statement

function sequenceFor(first: string): string[] | null {
  if (first === "i") return ROMAN_SEQ;
  if (first === "I") return ROMAN_SEQ.map((x) => x.toUpperCase());
  if (first === "a") return LOWER.split("");
  if (first === "A") return LOWER.toUpperCase().split("");
  if (first === "1") return Array.from({ length: 30 }, (_, k) => String(k + 1));
  return null;
}

export function splitInlineList(line: string): string[] | null {
  // "(x)" or "x)" markers at line start or after whitespace / punctuation.
  const re = /(^|[\s:;,.!?\u2014\u2013-])(\(?([a-zA-Z]|[ivxIVX]{2,4}|\d{1,2})\))(?=\s)/g;
  const marks: { at: number; label: string; text: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) marks.push({ at: m.index + m[1].length, label: m[3], text: m[2] });
  if (marks.length < 2) return null;
  for (let s0 = 0; s0 < marks.length - 1; s0++) {
    const seq = sequenceFor(marks[s0].label);
    if (!seq) continue;
    const chain = [marks[s0]];
    for (let j = s0 + 1, k = 1; j < marks.length && k < seq.length; j++) {
      if (marks[j].label === seq[k]) {
        chain.push(marks[j]);
        k++;
      }
    }
    if (chain.length < 2) continue;
    const bodies = chain.map((c, n) => {
      const end = n + 1 < chain.length ? chain[n + 1].at : line.length;
      return line.slice(c.at + c.text.length, end).trim();
    });
    if (!bodies.every((b) => [...b].length >= MIN_STATEMENT)) continue;
    // A closing question after the last statement ("… 1950. Which is correct?")
    // goes on its own line.
    let tail = "";
    const last = bodies[bodies.length - 1].match(/^(.*[.!।])\s+([^.!?।]+\?)$/);
    if (last && [...last[1]].length >= MIN_STATEMENT) {
      bodies[bodies.length - 1] = last[1];
      tail = last[2].trim();
    }
    const prefix = line.slice(0, chain[0].at).trim();
    const items = bodies.map((b, n) => `(${chain[n].label}) ${b}`);
    return [...(prefix ? [prefix] : []), ...items, ...(tail ? [tail] : [])];
  }
  return null;
}

export function parseRich(src: string): RichBlock[] {
  const lines = (src ?? "").replace(/\r\n?/g, "\n").replace(/ /g, " ").split("\n")
    .flatMap((l) => (IMG.test(l) ? [l] : splitInlineList(l) ?? [l]));
  const items = lines.map(listItem);
  const out: RichBlock[] = [];
  lines.forEach((raw, i) => {
    const line = raw.trimEnd();
    if (!line.trim()) {
      if (out.length && out[out.length - 1].kind !== "gap") out.push({ kind: "gap" });
      return;
    }
    const img = line.match(IMG);
    if (img) return void out.push({ kind: "img", alt: img[1], url: img[2] });
    const it = items[i];
    // "A. P. J. Abdul Kalam…" is a sentence, not a list: letter/roman markers
    // only count when a neighbouring line is a list item too.
    if (it && (!it.letter || items[i - 1] || items[i + 1]))
      return void out.push({ kind: "li", marker: it.marker, text: it.text, indent: it.indent });
    out.push({ kind: "p", text: line.trim() });
  });
  if (out[out.length - 1]?.kind === "gap") out.pop();
  return out;
}

/** Split a line into plain / bold runs on **…**. */
export function parseInline(text: string): { bold: boolean; text: string }[] {
  return text
    .split(/(\*\*[^*\n]+?\*\*)/g)
    .filter(Boolean)
    .map((t) =>
      t.length > 4 && t.startsWith("**") && t.endsWith("**")
        ? { bold: true, text: t.slice(2, -2) }
        : { bold: false, text: t }
    );
}

/** One-line plain text for tables, toasts and search ("[image]" for images). */
export function richToPlain(src: string): string {
  return (src ?? "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "[image]")
    .replace(/\*\*([^*\n]+?)\*\*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/** Every image a question uses — prefetched when a test opens so it works offline. */
export function questionImageUrls(q: {
  questionImage?: string;
  passage?: string;
  questionText?: string;
  explanation?: string;
  options?: { text: string; image?: string }[];
}): string[] {
  const inText = [q.passage, q.questionText, q.explanation, ...(q.options ?? []).map((o) => o.text)]
    .flatMap((t) => Array.from((t ?? "").matchAll(/!\[[^\]]*\]\((\S+?)\)/g), (m) => m[1]));
  return [q.questionImage, ...(q.options ?? []).map((o) => o.image), ...inText].filter(
    (u): u is string => !!u && /^https?:/.test(u)
  );
}

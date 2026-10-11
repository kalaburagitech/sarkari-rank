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
// MIRRORED in app/lib/rich.ts — keep the two parsers identical.

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

export function parseRich(src: string): RichBlock[] {
  const lines = (src ?? "").replace(/\r\n?/g, "\n").replace(/ /g, " ").split("\n");
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

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const inlineHtml = (t: string) =>
  parseInline(t).map((r) => (r.bold ? `<strong>${esc(r.text)}</strong>` : esc(r.text))).join("");

/** HTML preview for the admin (same layout rules as the app renderer). */
export function richToHtml(src: string): string {
  return parseRich(src)
    .map((b) => {
      if (b.kind === "gap") return '<div style="height:8px"></div>';
      if (b.kind === "img")
        return /^(https?:|data:image\/)/.test(b.url)
          ? `<img src="${esc(b.url)}" alt="${esc(b.alt)}" style="max-width:100%;max-height:320px;border-radius:8px;margin:6px 0;display:block" />`
          : "";
      if (b.kind === "li")
        return `<div style="display:flex;gap:6px;margin-left:${b.indent * 18}px"><span style="min-width:22px;font-weight:600;color:#475569">${esc(b.marker)}</span><span>${inlineHtml(b.text)}</span></div>`;
      return `<div>${inlineHtml(b.text)}</div>`;
    })
    .join("");
}

/** True when the text uses any markup worth previewing. */
export function hasRichMarkup(src: string): boolean {
  return parseRich(src).some((b) => b.kind !== "p" && b.kind !== "gap") || /\*\*[^*\n]+?\*\*/.test(src ?? "");
}

// ─── HTML clipboard → rich text ────────────────────────────────────────────
// Keeps bold, lists, line breaks and images when pasting from Word, Google
// Docs or a web page. Returns null when the HTML carries no formatting worth
// keeping, so the browser's normal plain-text paste runs instead.

const ROMAN = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x", "xi", "xii"];

function olMarker(type: string, n: number): string {
  if (type === "a") return `${String.fromCharCode(96 + ((n - 1) % 26) + 1)}.`;
  if (type === "A") return `${String.fromCharCode(64 + ((n - 1) % 26) + 1)}.`;
  if (type === "i") return `${ROMAN[n - 1] ?? n}.`;
  if (type === "I") return `${(ROMAN[n - 1] ?? String(n)).toUpperCase()}.`;
  return `${n}.`;
}

function listType(el: Element): string {
  const t = el.getAttribute("type");
  if (t) return t;
  const style = (el.getAttribute("style") ?? "").toLowerCase();
  if (style.includes("lower-alpha") || style.includes("lower-latin")) return "a";
  if (style.includes("upper-alpha") || style.includes("upper-latin")) return "A";
  if (style.includes("lower-roman")) return "i";
  if (style.includes("upper-roman")) return "I";
  return "1";
}

function isBold(el: HTMLElement, inherited: boolean): boolean {
  const w = el.style?.fontWeight;
  if (w) return w === "bold" || w === "bolder" || parseInt(w, 10) >= 600;
  if (/^(B|STRONG|H[1-6]|TH)$/.test(el.tagName)) return true;
  return inherited;
}

const BLOCK = /^(P|DIV|H[1-6]|TR|BLOCKQUOTE|SECTION|ARTICLE|HEADER|FOOTER|TABLE|TBODY|PRE)$/;

export function htmlToRich(html: string): { text: string; images: string[] } | null {
  const doc = new DOMParser().parseFromString(html, "text/html");
  let formatted = false;
  const images: string[] = [];

  const walk = (node: Node, bold: boolean, depth: number): string => {
    if (node.nodeType === Node.TEXT_NODE) return (node.textContent ?? "").replace(/[\t\n\r ]+/g, " ");
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const el = node as HTMLElement;
    const tag = el.tagName;
    if (/^(SCRIPT|STYLE|HEAD|META|TITLE)$/.test(tag) || el.style?.display === "none") return "";
    if (tag === "BR") return "\n";
    if (tag === "IMG") {
      const src = el.getAttribute("src") ?? "";
      if (!/^(https?:|data:image\/)/.test(src)) return "";
      formatted = true;
      images.push(src);
      return `\n![image](${src})\n`;
    }
    if (tag === "UL" || tag === "OL") {
      formatted = true;
      const type = listType(el);
      let n = parseInt(el.getAttribute("start") ?? "1", 10) || 1;
      const lines = Array.from(el.children)
        .filter((c) => c.tagName === "LI")
        .map((li) => {
          const marker = tag === "UL" ? "-" : olMarker(type, n++);
          const body = Array.from(li.childNodes).map((c) => walk(c, bold, depth + 1)).join("");
          const [first, ...rest] = body.split("\n").map((l) => l.trim()).filter(Boolean);
          return [`${"  ".repeat(depth)}${marker} ${first ?? ""}`, ...rest.map((r) => (/^\s*([-*•]|\S{1,4}[.)])\s/.test(r) ? `${"  ".repeat(depth + 1)}${r.trimStart()}` : r))].join("\n");
        });
      return `\n${lines.join("\n")}\n`;
    }
    const b = isBold(el, bold);
    let inner = Array.from(el.childNodes).map((c) => walk(c, b, depth)).join("");
    if (b && !bold && inner.trim()) {
      formatted = true;
      // Bold can't span lines in the markup — wrap each line on its own.
      inner = inner
        .split("\n")
        .map((l) => {
          const m = l.match(/^(\s*)(.*?)(\s*)$/)!;
          return m[2] ? `${m[1]}**${m[2]}**${m[3]}` : l;
        })
        .join("\n");
    }
    if (tag === "TD" || tag === "TH") return `${inner.trim()}\t`;
    if (tag === "LI") return inner;
    if (BLOCK.test(tag)) return `\n${inner}\n`;
    return inner;
  };

  let text = walk(doc.body, false, 0)
    .split("\n")
    .map((l) => l.replace(/\s+$/, "").replace(/^(\s*)[·▪◦§o]\s+/, "$1- "))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    // Word/Docs put each list item in its own paragraph — keep items together.
    .replace(/^(\s*(?:[-*•]|\(?\w{1,4}[.)])\s.*)\n\n(?=\s*(?:[-*•]|\(?\w{1,4}[.)])\s)/gm, "$1\n")
    .trim();
  // Word writes list numbers as plain text ("1.", "a)") — already valid markup.
  if (!formatted && /^\s*([-*•]|\(?\w{1,4}[.)])\s/m.test(text) && text.includes("\n")) formatted = true;
  if (!formatted) return null;
  text = text.replace(/\*\*\s*\*\*/g, "");
  return { text, images };
}

// Converts a study note (markdown) into a professionally-styled HTML document
// for expo-print → PDF export. Kept dependency-free.

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inlineMd(s: string): string {
  return escapeHtml(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/_([^_]+)_/g, "<em>$1</em>");
}

function markdownToHtml(md: string): string {
  const lines = (md ?? "").replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flush = () => {
    if (!list) return;
    const tag = list.ordered ? "ol" : "ul";
    out.push(`<${tag}>${list.items.map((i) => `<li>${inlineMd(i)}</li>`).join("")}</${tag}>`);
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+\.\s+(.*)$/);
    if (bullet) {
      if (!list || list.ordered) { flush(); list = { ordered: false, items: [] }; }
      list.items.push(bullet[1]);
      continue;
    }
    if (numbered) {
      if (!list || !list.ordered) { flush(); list = { ordered: true, items: [] }; }
      list.items.push(numbered[1]);
      continue;
    }
    flush();

    if (line.trim() === "") continue;
    if (/^#{1,6}\s+/.test(line)) {
      const level = Math.min(line.match(/^#+/)![0].length, 6);
      out.push(`<h${level}>${inlineMd(line.replace(/^#+\s+/, ""))}</h${level}>`);
      continue;
    }
    if (/^>\s?/.test(line)) {
      out.push(`<blockquote>${inlineMd(line.replace(/^>\s?/, ""))}</blockquote>`);
      continue;
    }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      out.push("<hr/>");
      continue;
    }
    out.push(`<p>${inlineMd(line)}</p>`);
  }
  flush();
  return out.join("\n");
}

export function buildNoteHtml(note: {
  title: string;
  subject?: string;
  topic?: string;
  examName?: string;
  content: string;
}): string {
  const crumb = [note.examName, note.subject, note.topic].filter(Boolean).join("  ›  ");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>
  @page { margin: 40px 44px; }
  * { box-sizing: border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #1e293b; line-height: 1.65; font-size: 15px; }
  .brand { font-family: -apple-system, Helvetica, Arial, sans-serif; font-size: 12px; letter-spacing: .5px; color: #6366F1; font-weight: 700; text-transform: uppercase; }
  .crumb { font-family: -apple-system, Helvetica, Arial, sans-serif; font-size: 12px; color: #64748b; margin-top: 4px; }
  h1.title { font-size: 26px; margin: 10px 0 4px; color: #0f172a; line-height: 1.25; }
  .rule { height: 3px; width: 56px; background: #6366F1; border-radius: 3px; margin: 14px 0 22px; }
  h1 { font-size: 21px; margin: 22px 0 8px; color: #0f172a; }
  h2 { font-size: 18px; margin: 20px 0 8px; color: #0f172a; }
  h3 { font-size: 16px; margin: 16px 0 6px; color: #0f172a; }
  p { margin: 0 0 12px; }
  ul, ol { margin: 0 0 14px; padding-left: 22px; }
  li { margin-bottom: 6px; }
  blockquote { margin: 0 0 14px; padding: 8px 14px; border-left: 3px solid #6366F1; background: #f1f5f9; border-radius: 6px; color: #475569; font-style: italic; }
  code { font-family: 'SF Mono', Menlo, monospace; background: #eef2ff; color: #4338ca; padding: 1px 5px; border-radius: 4px; font-size: 13px; }
  a { color: #4f46e5; }
  hr { border: none; border-top: 1px solid #e2e8f0; margin: 20px 0; }
  .footer { font-family: -apple-system, Helvetica, Arial, sans-serif; margin-top: 34px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; }
</style></head>
<body>
  <div class="brand">SarkariRank · Study Notes</div>
  ${crumb ? `<div class="crumb">${escapeHtml(crumb)}</div>` : ""}
  <h1 class="title">${escapeHtml(note.title)}</h1>
  <div class="rule"></div>
  ${markdownToHtml(note.content)}
  <div class="footer">Generated from SarkariRank for educational use. Verify official information on the respective official government websites. SarkariRank is not a government entity.</div>
</body></html>`;
}

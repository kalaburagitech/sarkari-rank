import { action, internalAction, internalMutation } from "./_generated/server";
import type { ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// ─────────────────────────────────────────────────────────────
// Current Affairs auto-feed (free, keyless — Google News India RSS)
// A daily cron (convex/crons.ts) calls fetchCurrentAffairs, which pulls
// a few category buckets, parses the RSS, dedupes by slug, and inserts
// into the `currentAffairs` table. Admins can still edit/delete items.
// `fetch` works in the default Convex runtime — no "use node" needed.
// ─────────────────────────────────────────────────────────────

const BUCKETS: { category: string; query: string }[] = [
  { category: "National", query: "india current affairs government" },
  { category: "Economy", query: "india economy business RBI finance" },
  { category: "Science", query: "india science technology ISRO research" },
  { category: "Sports", query: "india sports" },
  { category: "International", query: "world international affairs" },
  { category: "Environment", query: "india environment climate" },
];

const PER_BUCKET = 6;

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&amp;/g, "&");
}

function stripTags(s: string): string {
  // Decode entities FIRST so entity-encoded tags (&lt;a&gt;) become real tags,
  // then strip all tags, then decode any remaining entities.
  const decoded = decodeEntities(s);
  const noTags = decoded.replace(/<[^>]*>/g, " ");
  return decodeEntities(noTags).replace(/\s+/g, " ").trim();
}

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 80)
      .replace(/^-|-$/g, "") || `news-${Math.abs(hashCode(text))}`
  );
}

function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i);
  return h;
}

function tag(block: string, name: string): string | null {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? m[1] : null;
}

type ParsedItem = {
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  date: number;
};

function parseFeed(xml: string, category: string): ParsedItem[] {
  const items: ParsedItem[] = [];
  const blocks = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? [];
  for (const block of blocks.slice(0, PER_BUCKET)) {
    const rawTitle = tag(block, "title");
    if (!rawTitle) continue;
    let title = stripTags(rawTitle);
    // Google News titles are "Headline - Source"; keep headline only.
    const dash = title.lastIndexOf(" - ");
    if (dash > 30) title = title.slice(0, dash).trim();
    if (!title) continue;

    const rawDesc = tag(block, "description") ?? "";
    let desc = stripTags(rawDesc);
    // Google News descriptions repeat the headline then the source — drop the
    // duplicated headline so the summary reads as a clean source/snippet.
    if (desc.toLowerCase().startsWith(title.toLowerCase())) {
      desc = desc.slice(title.length).replace(/^[\s\-–—·|]+/, "").trim();
    }
    const pub = tag(block, "pubDate");
    const date = pub ? new Date(pub).getTime() || Date.now() : Date.now();

    items.push({
      title,
      slug: slugify(title),
      summary: desc ? `${desc.slice(0, 200)}`.trim() : `${category} · India`,
      content: desc || title,
      category,
      date,
    });
  }
  return items;
}

// Dedupe-and-insert a single item (skips if the slug already exists).
export const insertAffair = internalMutation({
  args: {
    title: v.string(),
    slug: v.string(),
    summary: v.string(),
    content: v.string(),
    category: v.string(),
    date: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("currentAffairs")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (existing) return false;
    await ctx.db.insert("currentAffairs", {
      title: args.title,
      slug: args.slug,
      content: args.content,
      summary: args.summary,
      category: args.category,
      date: args.date,
      isActive: true,
      createdAt: Date.now(),
    });
    return true;
  },
});

async function runFetch(
  ctx: ActionCtx
): Promise<{ inserted: number; scanned: number }> {
  let inserted = 0;
  let scanned = 0;
  const seen = new Set<string>();
  for (const bucket of BUCKETS) {
    try {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(
        bucket.query
      )}&hl=en-IN&gl=IN&ceid=IN:en`;
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (SarkariRank news bot)" },
      });
      if (!res.ok) continue;
      const xml = await res.text();
      for (const item of parseFeed(xml, bucket.category)) {
        if (seen.has(item.slug)) continue;
        seen.add(item.slug);
        scanned++;
        const ok = await ctx.runMutation(internal.news.insertAffair, item);
        if (ok) inserted++;
      }
    } catch {
      // Skip a failing bucket; keep going.
    }
  }
  return { inserted, scanned };
}

// Called by the daily cron (internal).
export const fetchCurrentAffairs = internalAction({
  args: {},
  handler: async (ctx) => {
    return await runFetch(ctx);
  },
});

// Public on-demand refresh (admin button / app pull-to-refresh).
export const refreshCurrentAffairs = action({
  args: {},
  handler: async (ctx) => {
    return await runFetch(ctx);
  },
});

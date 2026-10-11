// Shared JSON → question parser used by the bulk importers. Accepts a forgiving
// range of field names and answer formats so admins can paste JSON from many
// sources without reshaping it.

const OPT_IDS = ["a", "b", "c", "d", "e", "f"];

export type Diff = "easy" | "medium" | "hard";

type Opt = { id: string; text: string; image?: string };

export type ParsedQuestion = {
  questionText: string;
  questionImage?: string;
  passage?: string;
  passageKn?: string;
  options: Opt[];
  correctOptionId: string;
  explanation?: string;
  questionTextKn?: string;
  optionsKn?: { id: string; text: string }[];
  explanationKn?: string;
  subject?: string;
  topic?: string;
  year?: number;
  message?: string;
  difficulty: Diff;
  marks: number;
  negativeMarks: number;
  language: string;
};

export type ImportDefaults = {
  language: string;
  marks: number;
  negativeMarks: number;
  difficulty: Diff;
};

// Pick the first defined, non-empty value across a list of possible key names.
function pick<T = unknown>(
  obj: Record<string, unknown>,
  keys: string[]
): T | undefined {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "")
      return obj[k] as T;
  }
  return undefined;
}

function normalizeOptions(rawOpts: unknown): Opt[] {
  if (!Array.isArray(rawOpts)) return [];
  return rawOpts.map((o, i) => {
    const id = OPT_IDS[i] ?? String(i);
    if (typeof o === "string") return { id, text: o.trim() };
    if (o && typeof o === "object") {
      const oo = o as Record<string, unknown>;
      const image = pick<string>(oo, ["image", "img", "imageUrl"]);
      return {
        id: (oo.id as string) ?? id,
        text: String(oo.text ?? oo.value ?? "").trim(),
        ...(image ? { image: String(image).trim() } : {}),
      };
    }
    return { id, text: String(o) };
  });
}

// Resolve the answer into an option id. Accepts a letter (A-F), a number
// (1-based or 0-based), an option id, or the exact option text.
function resolveAnswer(
  rawAns: unknown,
  options: Opt[]
): string | null {
  if (rawAns === undefined || rawAns === null) return null;
  const s = String(rawAns).trim();
  if (!s) return null;
  if (/^[a-zA-Z]$/.test(s)) {
    const idx = s.toLowerCase().charCodeAt(0) - 97;
    if (options[idx]) return options[idx].id;
  }
  if (/^\d+$/.test(s)) {
    const n = parseInt(s, 10);
    if (options[n - 1]) return options[n - 1].id;
    if (options[n]) return options[n].id;
  }
  const byId = options.find((o) => o.id.toLowerCase() === s.toLowerCase());
  if (byId) return byId.id;
  const byText = options.find((o) => o.text.toLowerCase() === s.toLowerCase());
  if (byText) return byText.id;
  return null;
}

export function parseQuestionsJson(
  raw: string,
  def: ImportDefaults
): { ok: ParsedQuestion[]; errors: string[] } {
  const errors: string[] = [];
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    return { ok: [], errors: [`Invalid JSON: ${(e as Error).message}`] };
  }
  const arr: unknown[] = Array.isArray(data)
    ? data
    : Array.isArray((data as Record<string, unknown>)?.questions)
      ? ((data as Record<string, unknown>).questions as unknown[])
      : [];
  if (arr.length === 0)
    return {
      ok: [],
      errors: [
        'No questions found. Provide a JSON array (or an object with a "questions" array).',
      ],
    };

  // Passage groups: { "passage": "...", "questions": [ ... ] } expands into
  // its questions, each carrying the passage.
  const flat: unknown[] = arr.flatMap((item) => {
    const g = item as Record<string, unknown>;
    if (g && typeof g === "object" && Array.isArray(g.questions)) {
      const passage = pick(g, ["passage", "paragraph", "comprehension"]);
      const passageKn = pick(g, ["passageKn", "paragraphKn"]);
      return (g.questions as unknown[]).map((q) =>
        q && typeof q === "object" ? { passage, passageKn, ...(q as object) } : q
      );
    }
    return [item];
  });

  const ok: ParsedQuestion[] = [];
  flat.forEach((item, i) => {
    const n = i + 1;
    if (!item || typeof item !== "object") {
      errors.push(`Q${n}: not an object`);
      return;
    }
    const q = item as Record<string, unknown>;
    const text = String(
      pick<string>(q, ["question", "questionText", "q", "text"]) ?? ""
    ).trim();
    const questionImage = pick<string>(q, ["image", "questionImage", "img", "imageUrl"]);
    if (!text && !questionImage) {
      errors.push(`Q${n}: missing "question" (text or image)`);
      return;
    }
    const options = normalizeOptions(pick(q, ["options", "opts", "choices"]));
    if (options.length < 2) {
      errors.push(`Q${n}: needs at least 2 options`);
      return;
    }
    if (options.some((o) => !o.text && !o.image)) {
      errors.push(`Q${n}: an option is empty`);
      return;
    }
    const correctOptionId = resolveAnswer(
      pick(q, ["answer", "correct", "correctOption", "correctAnswer", "ans"]),
      options
    );
    if (!correctOptionId) {
      errors.push(`Q${n}: "answer" does not match any option`);
      return;
    }

    const rawDiff = String(
      pick<string>(q, ["difficulty", "diff", "level"]) ?? def.difficulty
    ).toLowerCase();
    const difficulty: Diff =
      rawDiff === "easy" || rawDiff === "hard" ? (rawDiff as Diff) : "medium";

    const optsKnRaw = pick(q, ["optionsKn", "opts_kn", "kannadaOptions"]);
    const optionsKn = optsKnRaw
      ? normalizeOptions(optsKnRaw).map((o, idx) => ({
          id: options[idx]?.id ?? o.id,
          text: o.text,
        }))
      : undefined;

    const str = (keys: string[]) =>
      (pick<string>(q, keys) ?? "").toString().trim() || undefined;
    ok.push({
      questionText: text,
      questionImage: questionImage ? String(questionImage).trim() : undefined,
      passage: str(["passage", "paragraph", "comprehension"]),
      passageKn: str(["passageKn", "paragraphKn"]),
      subject: str(["subject", "sub"]),
      options,
      correctOptionId,
      explanation:
        (pick<string>(q, ["explanation", "exp", "solution"]) ?? "")
          .toString()
          .trim() || undefined,
      questionTextKn:
        (pick<string>(q, ["questionKn", "questionTextKn", "qKn"]) ?? "")
          .toString()
          .trim() || undefined,
      optionsKn: optionsKn && optionsKn.length ? optionsKn : undefined,
      explanationKn:
        (pick<string>(q, ["explanationKn", "expKn"]) ?? "").toString().trim() ||
        undefined,
      topic:
        (pick<string>(q, ["topic", "chapter"]) ?? "").toString().trim() ||
        undefined,
      year: (() => {
        const y = pick(q, ["year", "examYear"]);
        const n = y === undefined ? NaN : parseInt(String(y), 10);
        return Number.isFinite(n) ? n : undefined;
      })(),
      message:
        (pick<string>(q, ["message", "exam", "examName", "askedIn"]) ?? "")
          .toString()
          .trim() || undefined,
      difficulty,
      marks: Number(pick(q, ["marks", "mark"]) ?? def.marks) || def.marks,
      negativeMarks: Number(
        pick(q, ["negativeMarks", "negative", "neg"]) ?? def.negativeMarks
      ),
      language: (pick<string>(q, ["language", "lang"]) ?? def.language).toString(),
    });
  });
  return { ok, errors };
}

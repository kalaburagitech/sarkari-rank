// Pure scoring used by the test runner — no React, no storage, no network, so
// it can be exercised directly: `node --experimental-strip-types lib/grade.ts`.
export type LocalAnswer = {
  questionId: string;
  selectedOptionId?: string;
  isCorrect: boolean;
  timeSpentSeconds: number;
};

type Question = {
  _id: string;
  correctOptionId?: string;
  marks: number;
  negativeMarks: number;
};

/** Grade on the device using the cached answer key. */
export function grade(
  questions: Question[],
  selected: Record<string, string>,
  timePerQuestion: Record<string, number> = {}
) {
  let score = 0;
  let correct = 0;
  const answers: LocalAnswer[] = questions.map((q) => {
    const chosen = selected[q._id];
    const isCorrect = !!chosen && q.correctOptionId === chosen;
    if (chosen) {
      if (isCorrect) {
        score += q.marks;
        correct++;
      } else {
        score -= q.negativeMarks;
      }
    }
    return {
      questionId: q._id,
      selectedOptionId: chosen,
      isCorrect,
      timeSpentSeconds: timePerQuestion[q._id] ?? 0,
    };
  });
  const answered = answers.filter((a) => a.selectedOptionId).length;
  return {
    answers,
    score: Math.max(0, score),
    correct,
    answered,
    accuracy: answered > 0 ? (correct / answered) * 100 : 0,
  };
}

// ─── Self-check ──────────────────────────────────────────────
if (process.argv[1]?.endsWith("grade.ts")) {
  const assert = (cond: boolean, msg: string) => {
    if (!cond) throw new Error("FAIL: " + msg);
  };
  const qs = [
    { _id: "a", correctOptionId: "1", marks: 2, negativeMarks: 0.5 },
    { _id: "b", correctOptionId: "2", marks: 2, negativeMarks: 0.5 },
    { _id: "c", correctOptionId: "3", marks: 2, negativeMarks: 0.5 },
  ];
  const r = grade(qs, { a: "1", b: "1" });
  assert(r.score === 1.5, `score 2 - 0.5 = 1.5, got ${r.score}`);
  assert(r.correct === 1, "one correct");
  assert(r.answered === 2, "two answered, one skipped");
  assert(Math.round(r.accuracy) === 50, `accuracy 50%, got ${r.accuracy}`);
  assert(r.answers[2].selectedOptionId === undefined, "skipped answer stays blank");
  assert(!r.answers[2].isCorrect, "skipped is not correct");

  // Negative marking must never push a score below zero.
  const zero = grade(qs, { a: "9", b: "9", c: "9" });
  assert(zero.score === 0, `floor at 0, got ${zero.score}`);
  assert(zero.accuracy === 0, "0% when nothing is right");

  // Nothing attempted → no score, no divide-by-zero.
  const blank = grade(qs, {});
  assert(blank.score === 0 && blank.accuracy === 0 && blank.answered === 0, "blank attempt");

  console.log("grade(): all checks passed");
}

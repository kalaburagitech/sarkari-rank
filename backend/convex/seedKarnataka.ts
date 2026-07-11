/**
 * Karnataka-first catalog seed — ADDITIVE and IDEMPOTENT.
 *
 * Adds Karnataka conducting bodies (KPSC, KEA, KSP, KPTCL/ESCOMs, Forest, KSRTC,
 * Teaching, Cooperative, Health/BBMP) + their exams (with real patterns/syllabi) +
 * bilingual (English + Kannada) practice questions and tests.
 *
 * - Existing national categories (SSC/Banking/...) are KEPT; their `order` is bumped
 *   to 100+ and tagged region:"national" so Karnataka bodies sort on top.
 * - Safe to re-run: everything is keyed by slug and skipped if it already exists.
 *
 * Content is genuine, syllabus-accurate practice material with explanations — not a
 * copy of copyrighted past papers — and is fully editable from the admin dashboard.
 */
import { mutation } from "./_generated/server";
import { v } from "convex/values";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

type Diff = "easy" | "medium" | "hard";

/** Bilingual question shape used only inside this seed. */
type Q = {
  q: string;
  qKn: string;
  opts: [string, string, string, string];
  optsKn: [string, string, string, string];
  ans: "a" | "b" | "c" | "d";
  sub: string;
  topic?: string;
  diff: Diff;
  exp: string;
  expKn: string;
};

const OPT_IDS = ["a", "b", "c", "d"] as const;

// ─────────────────────────────────────────────────────────────────────────────
// BILINGUAL QUESTION BANK (by subject)
// ─────────────────────────────────────────────────────────────────────────────

const KARNATAKA_GK: Q[] = [
  {
    q: "When was the state of Karnataka renamed from 'Mysore State' to 'Karnataka'?",
    qKn: "'ಮೈಸೂರು ರಾಜ್ಯ'ವನ್ನು 'ಕರ್ನಾಟಕ' ಎಂದು ಯಾವಾಗ ಮರುನಾಮಕರಣ ಮಾಡಲಾಯಿತು?",
    opts: ["1 November 1956", "1 November 1973", "15 August 1947", "1 November 1965"],
    optsKn: ["1 ನವೆಂಬರ್ 1956", "1 ನವೆಂಬರ್ 1973", "15 ಆಗಸ್ಟ್ 1947", "1 ನವೆಂಬರ್ 1965"],
    ans: "b",
    sub: "Karnataka GK",
    topic: "Statehood",
    diff: "medium",
    exp: "Mysore State was renamed Karnataka on 1 November 1973. The unified state was formed on 1 November 1956 (celebrated as Kannada Rajyotsava).",
    expKn: "ಮೈಸೂರು ರಾಜ್ಯವನ್ನು 1 ನವೆಂಬರ್ 1973 ರಂದು ಕರ್ನಾಟಕ ಎಂದು ಮರುನಾಮಕರಣ ಮಾಡಲಾಯಿತು. ಏಕೀಕೃತ ರಾಜ್ಯವು 1 ನವೆಂಬರ್ 1956 ರಂದು ರಚನೆಯಾಯಿತು (ಕನ್ನಡ ರಾಜ್ಯೋತ್ಸವ).",
  },
  {
    q: "Which is the state animal of Karnataka?",
    qKn: "ಕರ್ನಾಟಕದ ರಾಜ್ಯ ಪ್ರಾಣಿ ಯಾವುದು?",
    opts: ["Tiger", "Indian Elephant", "Lion", "Gaur"],
    optsKn: ["ಹುಲಿ", "ಭಾರತೀಯ ಆನೆ", "ಸಿಂಹ", "ಕಾಡುಕೋಣ"],
    ans: "b",
    sub: "Karnataka GK",
    topic: "State symbols",
    diff: "easy",
    exp: "The Indian Elephant is the state animal of Karnataka. The state bird is the Indian Roller (Neelakantha).",
    expKn: "ಭಾರತೀಯ ಆನೆ ಕರ್ನಾಟಕದ ರಾಜ್ಯ ಪ್ರಾಣಿ. ರಾಜ್ಯ ಪಕ್ಷಿ ನೀಲಕಂಠ (ಇಂಡಿಯನ್ ರೋಲರ್).",
  },
  {
    q: "The Vidhana Soudha, seat of the Karnataka legislature, is located in which city?",
    qKn: "ಕರ್ನಾಟಕ ಶಾಸಕಾಂಗದ ಕೇಂದ್ರವಾದ ವಿಧಾನ ಸೌಧವು ಯಾವ ನಗರದಲ್ಲಿದೆ?",
    opts: ["Mysuru", "Belagavi", "Bengaluru", "Kalaburagi"],
    optsKn: ["ಮೈಸೂರು", "ಬೆಳಗಾವಿ", "ಬೆಂಗಳೂರು", "ಕಲಬುರಗಿ"],
    ans: "c",
    sub: "Karnataka GK",
    topic: "Polity",
    diff: "easy",
    exp: "The Vidhana Soudha in Bengaluru houses the State Legislature. It was built in 1956 under Chief Minister Kengal Hanumanthaiah.",
    expKn: "ಬೆಂಗಳೂರಿನ ವಿಧಾನ ಸೌಧವು ರಾಜ್ಯ ಶಾಸಕಾಂಗವನ್ನು ಹೊಂದಿದೆ. ಇದನ್ನು ಮುಖ್ಯಮಂತ್ರಿ ಕೆಂಗಲ್ ಹನುಮಂತಯ್ಯ ಅವರ ನೇತೃತ್ವದಲ್ಲಿ 1956 ರಲ್ಲಿ ನಿರ್ಮಿಸಲಾಯಿತು.",
  },
  {
    q: "Which river is the longest flowing through Karnataka?",
    qKn: "ಕರ್ನಾಟಕದ ಮೂಲಕ ಹರಿಯುವ ಅತಿ ಉದ್ದದ ನದಿ ಯಾವುದು?",
    opts: ["Kaveri", "Krishna", "Tungabhadra", "Sharavathi"],
    optsKn: ["ಕಾವೇರಿ", "ಕೃಷ್ಣಾ", "ತುಂಗಭದ್ರಾ", "ಶರಾವತಿ"],
    ans: "b",
    sub: "Karnataka GK",
    topic: "Geography",
    diff: "medium",
    exp: "The Krishna is the longest river flowing through Karnataka; the Kaveri is the second longest and culturally most significant.",
    expKn: "ಕರ್ನಾಟಕದ ಮೂಲಕ ಹರಿಯುವ ಅತಿ ಉದ್ದದ ನದಿ ಕೃಷ್ಣಾ; ಕಾವೇರಿ ಎರಡನೆಯದು ಮತ್ತು ಸಾಂಸ್ಕೃತಿಕವಾಗಿ ಮಹತ್ವದ್ದಾಗಿದೆ.",
  },
  {
    q: "Jog Falls, one of India's highest waterfalls, is formed by which river?",
    qKn: "ಭಾರತದ ಅತಿ ಎತ್ತರದ ಜಲಪಾತಗಳಲ್ಲಿ ಒಂದಾದ ಜೋಗ ಜಲಪಾತವು ಯಾವ ನದಿಯಿಂದ ರೂಪುಗೊಂಡಿದೆ?",
    opts: ["Kaveri", "Sharavathi", "Kali", "Kabini"],
    optsKn: ["ಕಾವೇರಿ", "ಶರಾವತಿ", "ಕಾಳಿ", "ಕಬಿನಿ"],
    ans: "b",
    sub: "Karnataka GK",
    topic: "Geography",
    diff: "medium",
    exp: "Jog Falls in Shivamogga district is formed by the Sharavathi River.",
    expKn: "ಶಿವಮೊಗ್ಗ ಜಿಲ್ಲೆಯ ಜೋಗ ಜಲಪಾತವು ಶರಾವತಿ ನದಿಯಿಂದ ರೂಪುಗೊಂಡಿದೆ.",
  },
  {
    q: "Hampi, a UNESCO World Heritage Site, was the capital of which empire?",
    qKn: "ಯುನೆಸ್ಕೋ ವಿಶ್ವ ಪರಂಪರೆ ತಾಣವಾದ ಹಂಪಿಯು ಯಾವ ಸಾಮ್ರಾಜ್ಯದ ರಾಜಧಾನಿಯಾಗಿತ್ತು?",
    opts: ["Hoysala", "Vijayanagara", "Chalukya", "Rashtrakuta"],
    optsKn: ["ಹೊಯ್ಸಳ", "ವಿಜಯನಗರ", "ಚಾಲುಕ್ಯ", "ರಾಷ್ಟ್ರಕೂಟ"],
    ans: "b",
    sub: "Karnataka GK",
    topic: "History",
    diff: "easy",
    exp: "Hampi was the capital of the Vijayanagara Empire, founded by Harihara and Bukka in 1336.",
    expKn: "ಹಂಪಿ ವಿಜಯನಗರ ಸಾಮ್ರಾಜ್ಯದ ರಾಜಧಾನಿಯಾಗಿತ್ತು, ಇದನ್ನು 1336 ರಲ್ಲಿ ಹರಿಹರ ಮತ್ತು ಬುಕ್ಕ ಸ್ಥಾಪಿಸಿದರು.",
  },
  {
    q: "Who is regarded as the 'Aadikavi' (first poet) of Kannada literature?",
    qKn: "ಕನ್ನಡ ಸಾಹಿತ್ಯದ 'ಆದಿಕವಿ' ಎಂದು ಯಾರನ್ನು ಪರಿಗಣಿಸಲಾಗುತ್ತದೆ?",
    opts: ["Pampa", "Ranna", "Kuvempu", "Basavanna"],
    optsKn: ["ಪಂಪ", "ರನ್ನ", "ಕುವೆಂಪು", "ಬಸವಣ್ಣ"],
    ans: "a",
    sub: "Karnataka GK",
    topic: "Literature",
    diff: "medium",
    exp: "Pampa (10th century) is regarded as the Aadikavi of Kannada. Karnataka has won the Jnanpith Award 8 times.",
    expKn: "ಪಂಪ (10ನೇ ಶತಮಾನ) ಕನ್ನಡದ ಆದಿಕವಿ ಎಂದು ಪರಿಗಣಿಸಲ್ಪಟ್ಟಿದ್ದಾರೆ. ಕರ್ನಾಟಕ 8 ಬಾರಿ ಜ್ಞಾನಪೀಠ ಪ್ರಶಸ್ತಿ ಗೆದ್ದಿದೆ.",
  },
  {
    q: "How many districts are there in Karnataka (as of 2024)?",
    qKn: "ಕರ್ನಾಟಕದಲ್ಲಿ ಎಷ್ಟು ಜಿಲ್ಲೆಗಳಿವೆ (2024ರ ಪ್ರಕಾರ)?",
    opts: ["27", "30", "31", "35"],
    optsKn: ["27", "30", "31", "35"],
    ans: "c",
    sub: "Karnataka GK",
    topic: "Administration",
    diff: "medium",
    exp: "Karnataka has 31 districts after Vijayanagara was carved out of Ballari in 2021.",
    expKn: "2021 ರಲ್ಲಿ ಬಳ್ಳಾರಿಯಿಂದ ವಿಜಯನಗರ ಜಿಲ್ಲೆ ರಚನೆಯಾದ ನಂತರ ಕರ್ನಾಟಕದಲ್ಲಿ 31 ಜಿಲ್ಲೆಗಳಿವೆ.",
  },
];

const POLITY: Q[] = [
  {
    q: "Who is known as the Father of the Indian Constitution?",
    qKn: "ಭಾರತೀಯ ಸಂವಿಧಾನದ ಪಿತಾಮಹ ಎಂದು ಯಾರನ್ನು ಕರೆಯಲಾಗುತ್ತದೆ?",
    opts: ["Mahatma Gandhi", "Dr. B.R. Ambedkar", "Jawaharlal Nehru", "Sardar Patel"],
    optsKn: ["ಮಹಾತ್ಮ ಗಾಂಧಿ", "ಡಾ. ಬಿ.ಆರ್. ಅಂಬೇಡ್ಕರ್", "ಜವಾಹರಲಾಲ್ ನೆಹರು", "ಸರ್ದಾರ್ ಪಟೇಲ್"],
    ans: "b",
    sub: "Indian Polity",
    topic: "Constitution",
    diff: "easy",
    exp: "Dr. B.R. Ambedkar chaired the Drafting Committee of the Constitution of India.",
    expKn: "ಡಾ. ಬಿ.ಆರ್. ಅಂಬೇಡ್ಕರ್ ಭಾರತ ಸಂವಿಧಾನದ ಕರಡು ಸಮಿತಿಯ ಅಧ್ಯಕ್ಷರಾಗಿದ್ದರು.",
  },
  {
    q: "Which Article of the Indian Constitution abolishes untouchability?",
    qKn: "ಭಾರತೀಯ ಸಂವಿಧಾನದ ಯಾವ ವಿಧಿಯು ಅಸ್ಪೃಶ್ಯತೆಯನ್ನು ನಿರ್ಮೂಲನೆ ಮಾಡುತ್ತದೆ?",
    opts: ["Article 14", "Article 17", "Article 19", "Article 21"],
    optsKn: ["ವಿಧಿ 14", "ವಿಧಿ 17", "ವಿಧಿ 19", "ವಿಧಿ 21"],
    ans: "b",
    sub: "Indian Polity",
    topic: "Fundamental Rights",
    diff: "medium",
    exp: "Article 17 abolishes untouchability and forbids its practice in any form.",
    expKn: "ವಿಧಿ 17 ಅಸ್ಪೃಶ್ಯತೆಯನ್ನು ನಿರ್ಮೂಲನೆ ಮಾಡುತ್ತದೆ ಮತ್ತು ಅದರ ಆಚರಣೆಯನ್ನು ನಿಷೇಧಿಸುತ್ತದೆ.",
  },
  {
    q: "How many Fundamental Rights are guaranteed by the Indian Constitution?",
    qKn: "ಭಾರತೀಯ ಸಂವಿಧಾನವು ಎಷ್ಟು ಮೂಲಭೂತ ಹಕ್ಕುಗಳನ್ನು ಖಾತರಿಪಡಿಸುತ್ತದೆ?",
    opts: ["Five", "Six", "Seven", "Eight"],
    optsKn: ["ಐದು", "ಆರು", "ಏಳು", "ಎಂಟು"],
    ans: "b",
    sub: "Indian Polity",
    topic: "Fundamental Rights",
    diff: "medium",
    exp: "There are six Fundamental Rights after the Right to Property was removed by the 44th Amendment (1978).",
    expKn: "44ನೇ ತಿದ್ದುಪಡಿ (1978) ಮೂಲಕ ಆಸ್ತಿ ಹಕ್ಕನ್ನು ತೆಗೆದ ನಂತರ ಆರು ಮೂಲಭೂತ ಹಕ್ಕುಗಳಿವೆ.",
  },
  {
    q: "The minimum age to become the President of India is:",
    qKn: "ಭಾರತದ ರಾಷ್ಟ್ರಪತಿಯಾಗಲು ಕನಿಷ್ಠ ವಯಸ್ಸು ಎಷ್ಟು?",
    opts: ["25 years", "30 years", "35 years", "40 years"],
    optsKn: ["25 ವರ್ಷ", "30 ವರ್ಷ", "35 ವರ್ಷ", "40 ವರ್ಷ"],
    ans: "c",
    sub: "Indian Polity",
    topic: "Executive",
    diff: "medium",
    exp: "Article 58 sets the minimum age for the President of India at 35 years.",
    expKn: "ವಿಧಿ 58 ಭಾರತದ ರಾಷ್ಟ್ರಪತಿಗೆ ಕನಿಷ್ಠ ವಯಸ್ಸನ್ನು 35 ವರ್ಷ ಎಂದು ನಿಗದಿಪಡಿಸುತ್ತದೆ.",
  },
  {
    q: "Directive Principles of State Policy are contained in which Part of the Constitution?",
    qKn: "ರಾಜ್ಯ ನೀತಿಯ ನಿರ್ದೇಶಕ ತತ್ವಗಳು ಸಂವಿಧಾನದ ಯಾವ ಭಾಗದಲ್ಲಿವೆ?",
    opts: ["Part III", "Part IV", "Part V", "Part VI"],
    optsKn: ["ಭಾಗ III", "ಭಾಗ IV", "ಭಾಗ V", "ಭಾಗ VI"],
    ans: "b",
    sub: "Indian Polity",
    topic: "DPSP",
    diff: "medium",
    exp: "Part IV (Articles 36-51) contains the Directive Principles of State Policy.",
    expKn: "ಭಾಗ IV (ವಿಧಿ 36-51) ರಾಜ್ಯ ನೀತಿಯ ನಿರ್ದೇಶಕ ತತ್ವಗಳನ್ನು ಒಳಗೊಂಡಿದೆ.",
  },
  {
    q: "Who was the first President of India?",
    qKn: "ಭಾರತದ ಮೊದಲ ರಾಷ್ಟ್ರಪತಿ ಯಾರು?",
    opts: ["Dr. Rajendra Prasad", "Dr. S. Radhakrishnan", "Zakir Hussain", "V.V. Giri"],
    optsKn: ["ಡಾ. ರಾಜೇಂದ್ರ ಪ್ರಸಾದ್", "ಡಾ. ಎಸ್. ರಾಧಾಕೃಷ್ಣನ್", "ಜಾಕಿರ್ ಹುಸೇನ್", "ವಿ.ವಿ. ಗಿರಿ"],
    ans: "a",
    sub: "Indian Polity",
    topic: "Executive",
    diff: "easy",
    exp: "Dr. Rajendra Prasad served as the first President of India (1950-1962).",
    expKn: "ಡಾ. ರಾಜೇಂದ್ರ ಪ್ರಸಾದ್ ಭಾರತದ ಮೊದಲ ರಾಷ್ಟ್ರಪತಿಯಾಗಿ (1950-1962) ಸೇವೆ ಸಲ್ಲಿಸಿದರು.",
  },
  {
    q: "The 42nd Amendment added which words to the Preamble?",
    qKn: "42ನೇ ತಿದ್ದುಪಡಿಯು ಪೀಠಿಕೆಗೆ ಯಾವ ಪದಗಳನ್ನು ಸೇರಿಸಿತು?",
    opts: ["Sovereign, Democratic", "Socialist, Secular", "Republic, Justice", "Liberty, Equality"],
    optsKn: ["ಸಾರ್ವಭೌಮ, ಪ್ರಜಾಪ್ರಭುತ್ವ", "ಸಮಾಜವಾದಿ, ಜಾತ್ಯತೀತ", "ಗಣರಾಜ್ಯ, ನ್ಯಾಯ", "ಸ್ವಾತಂತ್ರ್ಯ, ಸಮಾನತೆ"],
    ans: "b",
    sub: "Indian Polity",
    topic: "Amendments",
    diff: "hard",
    exp: "The 42nd Amendment (1976) added the words 'Socialist', 'Secular' and 'Integrity' to the Preamble.",
    expKn: "42ನೇ ತಿದ್ದುಪಡಿ (1976) ಪೀಠಿಕೆಗೆ 'ಸಮಾಜವಾದಿ', 'ಜಾತ್ಯತೀತ' ಮತ್ತು 'ಸಮಗ್ರತೆ' ಪದಗಳನ್ನು ಸೇರಿಸಿತು.",
  },
];

const PANCHAYAT_RAJ: Q[] = [
  {
    q: "The 73rd Constitutional Amendment Act is related to:",
    qKn: "73ನೇ ಸಾಂವಿಧಾನಿಕ ತಿದ್ದುಪಡಿ ಕಾಯ್ದೆಯು ಯಾವುದಕ್ಕೆ ಸಂಬಂಧಿಸಿದೆ?",
    opts: ["Municipalities", "Panchayati Raj Institutions", "Cooperative Societies", "Union Territories"],
    optsKn: ["ನಗರಸಭೆಗಳು", "ಪಂಚಾಯತ್ ರಾಜ್ ಸಂಸ್ಥೆಗಳು", "ಸಹಕಾರ ಸಂಘಗಳು", "ಕೇಂದ್ರಾಡಳಿತ ಪ್ರದೇಶಗಳು"],
    ans: "b",
    sub: "Panchayat Raj",
    topic: "Local Government",
    diff: "easy",
    exp: "The 73rd Amendment (1992) gave constitutional status to Panchayati Raj Institutions (Part IX).",
    expKn: "73ನೇ ತಿದ್ದುಪಡಿ (1992) ಪಂಚಾಯತ್ ರಾಜ್ ಸಂಸ್ಥೆಗಳಿಗೆ ಸಾಂವಿಧಾನಿಕ ಸ್ಥಾನಮಾನ ನೀಡಿತು (ಭಾಗ IX).",
  },
  {
    q: "The Panchayati Raj system in India was first recommended by which committee?",
    qKn: "ಭಾರತದಲ್ಲಿ ಪಂಚಾಯತ್ ರಾಜ್ ವ್ಯವಸ್ಥೆಯನ್ನು ಮೊದಲು ಶಿಫಾರಸು ಮಾಡಿದ ಸಮಿತಿ ಯಾವುದು?",
    opts: ["Ashok Mehta Committee", "Balwant Rai Mehta Committee", "Sarkaria Commission", "L.M. Singhvi Committee"],
    optsKn: ["ಅಶೋಕ್ ಮೆಹ್ತಾ ಸಮಿತಿ", "ಬಲವಂತ ರಾಯ್ ಮೆಹ್ತಾ ಸಮಿತಿ", "ಸರ್ಕಾರಿಯಾ ಆಯೋಗ", "ಎಲ್.ಎಂ. ಸಿಂಘ್ವಿ ಸಮಿತಿ"],
    ans: "b",
    sub: "Panchayat Raj",
    topic: "Committees",
    diff: "medium",
    exp: "The Balwant Rai Mehta Committee (1957) recommended a three-tier Panchayati Raj system.",
    expKn: "ಬಲವಂತ ರಾಯ್ ಮೆಹ್ತಾ ಸಮಿತಿ (1957) ಮೂರು ಹಂತದ ಪಂಚಾಯತ್ ರಾಜ್ ವ್ಯವಸ್ಥೆಯನ್ನು ಶಿಫಾರಸು ಮಾಡಿತು.",
  },
  {
    q: "Under the Karnataka Panchayat Raj system, the intermediate (block) level body is called:",
    qKn: "ಕರ್ನಾಟಕ ಪಂಚಾಯತ್ ರಾಜ್ ವ್ಯವಸ್ಥೆಯಲ್ಲಿ ಮಧ್ಯಂತರ (ಬ್ಲಾಕ್) ಮಟ್ಟದ ಸಂಸ್ಥೆಯನ್ನು ಏನೆಂದು ಕರೆಯುತ್ತಾರೆ?",
    opts: ["Grama Panchayat", "Taluk Panchayat", "Zilla Panchayat", "Nagara Panchayat"],
    optsKn: ["ಗ್ರಾಮ ಪಂಚಾಯತ್", "ತಾಲೂಕು ಪಂಚಾಯತ್", "ಜಿಲ್ಲಾ ಪಂಚಾಯತ್", "ನಗರ ಪಂಚಾಯತ್"],
    ans: "b",
    sub: "Panchayat Raj",
    topic: "Karnataka PR",
    diff: "medium",
    exp: "Karnataka follows a three-tier system: Grama Panchayat (village), Taluk Panchayat (block) and Zilla Panchayat (district).",
    expKn: "ಕರ್ನಾಟಕವು ಮೂರು ಹಂತದ ವ್ಯವಸ್ಥೆಯನ್ನು ಅನುಸರಿಸುತ್ತದೆ: ಗ್ರಾಮ ಪಂಚಾಯತ್, ತಾಲೂಕು ಪಂಚಾಯತ್ ಮತ್ತು ಜಿಲ್ಲಾ ಪಂಚಾಯತ್.",
  },
  {
    q: "A Panchayat Development Officer (PDO) primarily works at which level?",
    qKn: "ಪಂಚಾಯತ್ ಅಭಿವೃದ್ಧಿ ಅಧಿಕಾರಿ (PDO) ಮುಖ್ಯವಾಗಿ ಯಾವ ಮಟ್ಟದಲ್ಲಿ ಕೆಲಸ ಮಾಡುತ್ತಾರೆ?",
    opts: ["Zilla Panchayat", "Taluk Panchayat", "Grama Panchayat", "State Secretariat"],
    optsKn: ["ಜಿಲ್ಲಾ ಪಂಚಾಯತ್", "ತಾಲೂಕು ಪಂಚಾಯತ್", "ಗ್ರಾಮ ಪಂಚಾಯತ್", "ರಾಜ್ಯ ಸಚಿವಾಲಯ"],
    ans: "c",
    sub: "Panchayat Raj",
    topic: "Karnataka PR",
    diff: "easy",
    exp: "The PDO is the administrative secretary of the Grama Panchayat, implementing rural development schemes.",
    expKn: "PDO ಗ್ರಾಮ ಪಂಚಾಯತ್‌ನ ಆಡಳಿತಾತ್ಮಕ ಕಾರ್ಯದರ್ಶಿಯಾಗಿದ್ದು, ಗ್ರಾಮೀಣ ಅಭಿವೃದ್ಧಿ ಯೋಜನೆಗಳನ್ನು ಅನುಷ್ಠಾನಗೊಳಿಸುತ್ತಾರೆ.",
  },
  {
    q: "MGNREGA guarantees how many days of wage employment per rural household per year?",
    qKn: "MGNREGA ಪ್ರತಿ ಗ್ರಾಮೀಣ ಕುಟುಂಬಕ್ಕೆ ವರ್ಷಕ್ಕೆ ಎಷ್ಟು ದಿನಗಳ ವೇತನ ಉದ್ಯೋಗವನ್ನು ಖಾತರಿಪಡಿಸುತ್ತದೆ?",
    opts: ["50 days", "100 days", "150 days", "200 days"],
    optsKn: ["50 ದಿನಗಳು", "100 ದಿನಗಳು", "150 ದಿನಗಳು", "200 ದಿನಗಳು"],
    ans: "b",
    sub: "Panchayat Raj",
    topic: "Rural Development",
    diff: "easy",
    exp: "MGNREGA (2005) guarantees 100 days of wage employment to every rural household per financial year.",
    expKn: "MGNREGA (2005) ಪ್ರತಿ ಗ್ರಾಮೀಣ ಕುಟುಂಬಕ್ಕೆ ಆರ್ಥಿಕ ವರ್ಷಕ್ಕೆ 100 ದಿನಗಳ ವೇತನ ಉದ್ಯೋಗವನ್ನು ಖಾತರಿಪಡಿಸುತ್ತದೆ.",
  },
  {
    q: "What is the minimum age to contest a Grama Panchayat election in Karnataka?",
    qKn: "ಕರ್ನಾಟಕದಲ್ಲಿ ಗ್ರಾಮ ಪಂಚಾಯತ್ ಚುನಾವಣೆಗೆ ಸ್ಪರ್ಧಿಸಲು ಕನಿಷ್ಠ ವಯಸ್ಸು ಎಷ್ಟು?",
    opts: ["18 years", "21 years", "25 years", "30 years"],
    optsKn: ["18 ವರ್ಷ", "21 ವರ್ಷ", "25 ವರ್ಷ", "30 ವರ್ಷ"],
    ans: "b",
    sub: "Panchayat Raj",
    topic: "Karnataka PR",
    diff: "medium",
    exp: "The minimum age to contest Panchayat elections is 21 years, while the voting age is 18.",
    expKn: "ಪಂಚಾಯತ್ ಚುನಾವಣೆಗೆ ಸ್ಪರ್ಧಿಸಲು ಕನಿಷ್ಠ ವಯಸ್ಸು 21 ವರ್ಷ, ಮತದಾನದ ವಯಸ್ಸು 18 ವರ್ಷ.",
  },
];

const HISTORY: Q[] = [
  {
    q: "The Battle of Talikota (1565) led to the decline of which empire?",
    qKn: "ತಾಳಿಕೋಟೆ ಕದನ (1565) ಯಾವ ಸಾಮ್ರಾಜ್ಯದ ಅವನತಿಗೆ ಕಾರಣವಾಯಿತು?",
    opts: ["Bahmani", "Vijayanagara", "Maratha", "Mysore"],
    optsKn: ["ಬಹಮನಿ", "ವಿಜಯನಗರ", "ಮರಾಠಾ", "ಮೈಸೂರು"],
    ans: "b",
    sub: "History",
    topic: "Medieval India",
    diff: "medium",
    exp: "The Vijayanagara Empire was decisively defeated by the Deccan Sultanates at the Battle of Talikota in 1565.",
    expKn: "1565ರ ತಾಳಿಕೋಟೆ ಕದನದಲ್ಲಿ ಡೆಕ್ಕನ್ ಸುಲ್ತಾನರು ವಿಜಯನಗರ ಸಾಮ್ರಾಜ್ಯವನ್ನು ನಿರ್ಣಾಯಕವಾಗಿ ಸೋಲಿಸಿದರು.",
  },
  {
    q: "Who founded the Mysore Kingdom's modern army and fought the British in four Anglo-Mysore Wars?",
    qKn: "ಮೈಸೂರು ಸಾಮ್ರಾಜ್ಯದ ಆಧುನಿಕ ಸೇನೆಯನ್ನು ಕಟ್ಟಿ, ನಾಲ್ಕು ಆಂಗ್ಲೋ-ಮೈಸೂರು ಯುದ್ಧಗಳಲ್ಲಿ ಬ್ರಿಟಿಷರ ವಿರುದ್ಧ ಹೋರಾಡಿದವರು ಯಾರು?",
    opts: ["Hyder Ali and Tipu Sultan", "Krishnaraja Wodeyar", "Kempe Gowda", "Chikka Devaraja"],
    optsKn: ["ಹೈದರ್ ಅಲಿ ಮತ್ತು ಟಿಪ್ಪು ಸುಲ್ತಾನ್", "ಕೃಷ್ಣರಾಜ ಒಡೆಯರ್", "ಕೆಂಪೇಗೌಡ", "ಚಿಕ್ಕ ದೇವರಾಜ"],
    ans: "a",
    sub: "History",
    topic: "Karnataka History",
    diff: "medium",
    exp: "Hyder Ali and his son Tipu Sultan modernised the Mysore army and fought four Anglo-Mysore Wars; Tipu died in 1799.",
    expKn: "ಹೈದರ್ ಅಲಿ ಮತ್ತು ಅವರ ಮಗ ಟಿಪ್ಪು ಸುಲ್ತಾನ್ ಮೈಸೂರು ಸೇನೆಯನ್ನು ಆಧುನೀಕರಿಸಿ ನಾಲ್ಕು ಆಂಗ್ಲೋ-ಮೈಸೂರು ಯುದ್ಧಗಳಲ್ಲಿ ಹೋರಾಡಿದರು; ಟಿಪ್ಪು 1799ರಲ್ಲಿ ಮಡಿದರು.",
  },
  {
    q: "Who wrote the book 'The Discovery of India'?",
    qKn: "'ದಿ ಡಿಸ್ಕವರಿ ಆಫ್ ಇಂಡಿಯಾ' ಪುಸ್ತಕವನ್ನು ಬರೆದವರು ಯಾರು?",
    opts: ["Mahatma Gandhi", "Jawaharlal Nehru", "Rabindranath Tagore", "Subhash Chandra Bose"],
    optsKn: ["ಮಹಾತ್ಮ ಗಾಂಧಿ", "ಜವಾಹರಲಾಲ್ ನೆಹರು", "ರವೀಂದ್ರನಾಥ ಟ್ಯಾಗೋರ್", "ಸುಭಾಷ್ ಚಂದ್ರ ಬೋಸ್"],
    ans: "b",
    sub: "History",
    topic: "Modern India",
    diff: "easy",
    exp: "Jawaharlal Nehru wrote 'The Discovery of India' during his imprisonment at Ahmednagar Fort (1942-46).",
    expKn: "ಜವಾಹರಲಾಲ್ ನೆಹರು ಅಹಮದ್‌ನಗರ ಕೋಟೆಯಲ್ಲಿ ಸೆರೆವಾಸದ ಸಮಯದಲ್ಲಿ (1942-46) 'ದಿ ಡಿಸ್ಕವರಿ ಆಫ್ ಇಂಡಿಯಾ' ಬರೆದರು.",
  },
  {
    q: "The Indian National Congress was founded in which year?",
    qKn: "ಭಾರತೀಯ ರಾಷ್ಟ್ರೀಯ ಕಾಂಗ್ರೆಸ್ ಯಾವ ವರ್ಷ ಸ್ಥಾಪನೆಯಾಯಿತು?",
    opts: ["1857", "1885", "1905", "1919"],
    optsKn: ["1857", "1885", "1905", "1919"],
    ans: "b",
    sub: "History",
    topic: "Freedom Struggle",
    diff: "easy",
    exp: "The Indian National Congress was founded in 1885 by A.O. Hume.",
    expKn: "ಭಾರತೀಯ ರಾಷ್ಟ್ರೀಯ ಕಾಂಗ್ರೆಸ್ ಅನ್ನು 1885 ರಲ್ಲಿ ಎ.ಒ. ಹ್ಯೂಮ್ ಸ್ಥಾಪಿಸಿದರು.",
  },
  {
    q: "Kempe Gowda, the founder of Bengaluru, was a chieftain under which empire?",
    qKn: "ಬೆಂಗಳೂರಿನ ಸ್ಥಾಪಕ ಕೆಂಪೇಗೌಡ ಯಾವ ಸಾಮ್ರಾಜ್ಯದ ಅಧೀನ ನಾಯಕರಾಗಿದ್ದರು?",
    opts: ["Hoysala", "Vijayanagara", "Bahmani", "Maratha"],
    optsKn: ["ಹೊಯ್ಸಳ", "ವಿಜಯನಗರ", "ಬಹಮನಿ", "ಮರಾಠಾ"],
    ans: "b",
    sub: "History",
    topic: "Karnataka History",
    diff: "medium",
    exp: "Kempe Gowda I, a chieftain (Nada Prabhu) under the Vijayanagara Empire, founded Bengaluru in 1537.",
    expKn: "ವಿಜಯನಗರ ಸಾಮ್ರಾಜ್ಯದ ಅಧೀನ ನಾಡಪ್ರಭು ಕೆಂಪೇಗೌಡ I 1537ರಲ್ಲಿ ಬೆಂಗಳೂರನ್ನು ಸ್ಥಾಪಿಸಿದರು.",
  },
];

const GEOGRAPHY: Q[] = [
  {
    q: "Which is the largest state of India by area?",
    qKn: "ವಿಸ್ತೀರ್ಣದ ದೃಷ್ಟಿಯಿಂದ ಭಾರತದ ಅತಿ ದೊಡ್ಡ ರಾಜ್ಯ ಯಾವುದು?",
    opts: ["Madhya Pradesh", "Rajasthan", "Maharashtra", "Uttar Pradesh"],
    optsKn: ["ಮಧ್ಯಪ್ರದೇಶ", "ರಾಜಸ್ಥಾನ", "ಮಹಾರಾಷ್ಟ್ರ", "ಉತ್ತರ ಪ್ರದೇಶ"],
    ans: "b",
    sub: "Geography",
    topic: "India",
    diff: "easy",
    exp: "Rajasthan is the largest state of India by area (342,239 sq km).",
    expKn: "ವಿಸ್ತೀರ್ಣದ ದೃಷ್ಟಿಯಿಂದ ರಾಜಸ್ಥಾನ ಭಾರತದ ಅತಿ ದೊಡ್ಡ ರಾಜ್ಯ (342,239 ಚ.ಕಿ.ಮೀ).",
  },
  {
    q: "The Western Ghats in Karnataka are locally known as:",
    qKn: "ಕರ್ನಾಟಕದ ಪಶ್ಚಿಮ ಘಟ್ಟಗಳನ್ನು ಸ್ಥಳೀಯವಾಗಿ ಏನೆಂದು ಕರೆಯುತ್ತಾರೆ?",
    opts: ["Malnad", "Bayaluseeme", "Kittur", "Coromandel"],
    optsKn: ["ಮಲೆನಾಡು", "ಬಯಲುಸೀಮೆ", "ಕಿತ್ತೂರು", "ಕೊರೊಮಂಡಲ್"],
    ans: "a",
    sub: "Geography",
    topic: "Karnataka",
    diff: "medium",
    exp: "The hilly Western Ghats region of Karnataka is called Malnad; the plains are Bayaluseeme.",
    expKn: "ಕರ್ನಾಟಕದ ಗುಡ್ಡಗಾಡಿನ ಪಶ್ಚಿಮ ಘಟ್ಟ ಪ್ರದೇಶವನ್ನು ಮಲೆನಾಡು ಎಂದು ಕರೆಯುತ್ತಾರೆ; ಬಯಲು ಪ್ರದೇಶ ಬಯಲುಸೀಮೆ.",
  },
  {
    q: "Which is the highest peak in Karnataka?",
    qKn: "ಕರ್ನಾಟಕದ ಅತಿ ಎತ್ತರದ ಶಿಖರ ಯಾವುದು?",
    opts: ["Kudremukh", "Mullayanagiri", "Baba Budangiri", "Kemmanagundi"],
    optsKn: ["ಕುದುರೆಮುಖ", "ಮುಳ್ಳಯ್ಯನಗಿರಿ", "ಬಾಬಾ ಬುಡನ್‌ಗಿರಿ", "ಕೆಮ್ಮಣ್ಣುಗುಂಡಿ"],
    ans: "b",
    sub: "Geography",
    topic: "Karnataka",
    diff: "medium",
    exp: "Mullayanagiri (1,930 m) in Chikkamagaluru district is the highest peak in Karnataka.",
    expKn: "ಚಿಕ್ಕಮಗಳೂರು ಜಿಲ್ಲೆಯ ಮುಳ್ಳಯ್ಯನಗಿರಿ (1,930 ಮೀ) ಕರ್ನಾಟಕದ ಅತಿ ಎತ್ತರದ ಶಿಖರ.",
  },
  {
    q: "Which state has the longest coastline in India?",
    qKn: "ಭಾರತದಲ್ಲಿ ಅತಿ ಉದ್ದದ ಕರಾವಳಿ ಹೊಂದಿರುವ ರಾಜ್ಯ ಯಾವುದು?",
    opts: ["Tamil Nadu", "Gujarat", "Maharashtra", "Kerala"],
    optsKn: ["ತಮಿಳುನಾಡು", "ಗುಜರಾತ್", "ಮಹಾರಾಷ್ಟ್ರ", "ಕೇರಳ"],
    ans: "b",
    sub: "Geography",
    topic: "India",
    diff: "medium",
    exp: "Gujarat has the longest coastline in India (~1,214 km).",
    expKn: "ಗುಜರಾತ್ ಭಾರತದಲ್ಲಿ ಅತಿ ಉದ್ದದ ಕರಾವಳಿ ಹೊಂದಿದೆ (~1,214 ಕಿ.ಮೀ).",
  },
  {
    q: "The Tungabhadra is a tributary of which major river?",
    qKn: "ತುಂಗಭದ್ರಾ ಯಾವ ಪ್ರಮುಖ ನದಿಯ ಉಪನದಿಯಾಗಿದೆ?",
    opts: ["Kaveri", "Godavari", "Krishna", "Narmada"],
    optsKn: ["ಕಾವೇರಿ", "ಗೋದಾವರಿ", "ಕೃಷ್ಣಾ", "ನರ್ಮದಾ"],
    ans: "c",
    sub: "Geography",
    topic: "Rivers",
    diff: "medium",
    exp: "The Tungabhadra, formed by the Tunga and Bhadra rivers, is a major tributary of the Krishna.",
    expKn: "ತುಂಗಾ ಮತ್ತು ಭದ್ರಾ ನದಿಗಳಿಂದ ರೂಪುಗೊಂಡ ತುಂಗಭದ್ರಾ ಕೃಷ್ಣಾ ನದಿಯ ಪ್ರಮುಖ ಉಪನದಿ.",
  },
];

const SCIENCE: Q[] = [
  {
    q: "The SI unit of electric current is:",
    qKn: "ವಿದ್ಯುತ್ ಪ್ರವಾಹದ SI ಘಟಕ ಯಾವುದು?",
    opts: ["Volt", "Ampere", "Ohm", "Watt"],
    optsKn: ["ವೋಲ್ಟ್", "ಆಂಪಿಯರ್", "ಓಮ್", "ವಾಟ್"],
    ans: "b",
    sub: "General Science",
    topic: "Physics",
    diff: "easy",
    exp: "The ampere (A) is the SI unit of electric current.",
    expKn: "ಆಂಪಿಯರ್ (A) ವಿದ್ಯುತ್ ಪ್ರವಾಹದ SI ಘಟಕ.",
  },
  {
    q: "Which gas is most abundant in the Earth's atmosphere?",
    qKn: "ಭೂಮಿಯ ವಾತಾವರಣದಲ್ಲಿ ಅತಿ ಹೆಚ್ಚು ಇರುವ ಅನಿಲ ಯಾವುದು?",
    opts: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"],
    optsKn: ["ಆಮ್ಲಜನಕ", "ಇಂಗಾಲದ ಡೈಆಕ್ಸೈಡ್", "ಸಾರಜನಕ", "ಜಲಜನಕ"],
    ans: "c",
    sub: "General Science",
    topic: "Chemistry",
    diff: "easy",
    exp: "Nitrogen makes up about 78% of the Earth's atmosphere.",
    expKn: "ಸಾರಜನಕವು ಭೂಮಿಯ ವಾತಾವರಣದ ಸುಮಾರು 78% ರಷ್ಟಿದೆ.",
  },
  {
    q: "Which organelle is called the 'powerhouse of the cell'?",
    qKn: "ಯಾವ ಅಂಗಾಂಶವನ್ನು 'ಕೋಶದ ಶಕ್ತಿ ಕೇಂದ್ರ' ಎಂದು ಕರೆಯುತ್ತಾರೆ?",
    opts: ["Nucleus", "Mitochondria", "Ribosome", "Golgi body"],
    optsKn: ["ನ್ಯೂಕ್ಲಿಯಸ್", "ಮೈಟೊಕಾಂಡ್ರಿಯಾ", "ರೈಬೋಸೋಮ್", "ಗಾಲ್ಗಿ ಕಾಯ"],
    ans: "b",
    sub: "General Science",
    topic: "Biology",
    diff: "easy",
    exp: "Mitochondria produce ATP through cellular respiration, hence the 'powerhouse of the cell'.",
    expKn: "ಮೈಟೊಕಾಂಡ್ರಿಯಾ ಕೋಶೀಯ ಉಸಿರಾಟದ ಮೂಲಕ ATP ಉತ್ಪಾದಿಸುತ್ತದೆ, ಆದ್ದರಿಂದ 'ಕೋಶದ ಶಕ್ತಿ ಕೇಂದ್ರ'.",
  },
  {
    q: "Which vitamin is synthesised by the skin on exposure to sunlight?",
    qKn: "ಸೂರ್ಯನ ಬೆಳಕಿಗೆ ಒಡ್ಡಿದಾಗ ಚರ್ಮದಿಂದ ಯಾವ ವಿಟಮಿನ್ ಉತ್ಪತ್ತಿಯಾಗುತ್ತದೆ?",
    opts: ["Vitamin A", "Vitamin B12", "Vitamin C", "Vitamin D"],
    optsKn: ["ವಿಟಮಿನ್ A", "ವಿಟಮಿನ್ B12", "ವಿಟಮಿನ್ C", "ವಿಟಮಿನ್ D"],
    ans: "d",
    sub: "General Science",
    topic: "Biology",
    diff: "easy",
    exp: "Vitamin D is synthesised in the skin upon exposure to UVB rays from sunlight.",
    expKn: "ಸೂರ್ಯನ UVB ಕಿರಣಗಳಿಗೆ ಒಡ್ಡಿದಾಗ ಚರ್ಮದಲ್ಲಿ ವಿಟಮಿನ್ D ಉತ್ಪತ್ತಿಯಾಗುತ್ತದೆ.",
  },
  {
    q: "Which metal is in liquid state at room temperature?",
    qKn: "ಕೋಣೆಯ ಉಷ್ಣಾಂಶದಲ್ಲಿ ದ್ರವ ಸ್ಥಿತಿಯಲ್ಲಿರುವ ಲೋಹ ಯಾವುದು?",
    opts: ["Sodium", "Mercury", "Iron", "Aluminium"],
    optsKn: ["ಸೋಡಿಯಂ", "ಪಾದರಸ", "ಕಬ್ಬಿಣ", "ಅಲ್ಯೂಮಿನಿಯಂ"],
    ans: "b",
    sub: "General Science",
    topic: "Chemistry",
    diff: "easy",
    exp: "Mercury (Hg) is the only metal that is liquid at room temperature.",
    expKn: "ಪಾದರಸ (Hg) ಕೋಣೆಯ ಉಷ್ಣಾಂಶದಲ್ಲಿ ದ್ರವವಾಗಿರುವ ಏಕೈಕ ಲೋಹ.",
  },
];

const QUANT: Q[] = [
  {
    q: "What is 25% of 480?",
    qKn: "480 ರ 25% ಎಷ್ಟು?",
    opts: ["100", "120", "140", "160"],
    optsKn: ["100", "120", "140", "160"],
    ans: "b",
    sub: "Quantitative Aptitude",
    topic: "Percentage",
    diff: "easy",
    exp: "25% of 480 = 480 × 0.25 = 120.",
    expKn: "480 ರ 25% = 480 × 0.25 = 120.",
  },
  {
    q: "Simple interest on ₹5,000 at 10% per annum for 2 years is:",
    qKn: "₹5,000 ಕ್ಕೆ ವಾರ್ಷಿಕ 10% ದರದಲ್ಲಿ 2 ವರ್ಷಗಳ ಸರಳ ಬಡ್ಡಿ ಎಷ್ಟು?",
    opts: ["₹500", "₹1,000", "₹1,500", "₹2,000"],
    optsKn: ["₹500", "₹1,000", "₹1,500", "₹2,000"],
    ans: "b",
    sub: "Quantitative Aptitude",
    topic: "Interest",
    diff: "medium",
    exp: "SI = P×R×T/100 = 5000×10×2/100 = ₹1,000.",
    expKn: "ಸರಳ ಬಡ್ಡಿ = P×R×T/100 = 5000×10×2/100 = ₹1,000.",
  },
  {
    q: "If a train travels 120 km in 2 hours, its speed is:",
    qKn: "ರೈಲು 2 ಗಂಟೆಗಳಲ್ಲಿ 120 ಕಿ.ಮೀ ಚಲಿಸಿದರೆ, ಅದರ ವೇಗ ಎಷ್ಟು?",
    opts: ["40 km/h", "50 km/h", "60 km/h", "80 km/h"],
    optsKn: ["40 ಕಿ.ಮೀ/ಗಂ", "50 ಕಿ.ಮೀ/ಗಂ", "60 ಕಿ.ಮೀ/ಗಂ", "80 ಕಿ.ಮೀ/ಗಂ"],
    ans: "c",
    sub: "Quantitative Aptitude",
    topic: "Speed",
    diff: "easy",
    exp: "Speed = Distance/Time = 120/2 = 60 km/h.",
    expKn: "ವೇಗ = ದೂರ/ಸಮಯ = 120/2 = 60 ಕಿ.ಮೀ/ಗಂ.",
  },
  {
    q: "The average of 10, 20, 30, 40 and 50 is:",
    qKn: "10, 20, 30, 40 ಮತ್ತು 50 ರ ಸರಾಸರಿ ಎಷ್ಟು?",
    opts: ["25", "30", "35", "40"],
    optsKn: ["25", "30", "35", "40"],
    ans: "b",
    sub: "Quantitative Aptitude",
    topic: "Average",
    diff: "easy",
    exp: "Sum = 150, Count = 5, Average = 150/5 = 30.",
    expKn: "ಮೊತ್ತ = 150, ಸಂಖ್ಯೆ = 5, ಸರಾಸರಿ = 150/5 = 30.",
  },
  {
    q: "The LCM of 12 and 18 is:",
    qKn: "12 ಮತ್ತು 18 ರ ಲ.ಸಾ.ಅ (LCM) ಎಷ್ಟು?",
    opts: ["6", "24", "36", "72"],
    optsKn: ["6", "24", "36", "72"],
    ans: "c",
    sub: "Quantitative Aptitude",
    topic: "Number System",
    diff: "easy",
    exp: "LCM(12, 18) = 36.",
    expKn: "ಲ.ಸಾ.ಅ(12, 18) = 36.",
  },
];

const REASONING: Q[] = [
  {
    q: "Find the next number in the series: 2, 6, 12, 20, 30, ?",
    qKn: "ಸರಣಿಯಲ್ಲಿ ಮುಂದಿನ ಸಂಖ್ಯೆಯನ್ನು ಕಂಡುಹಿಡಿಯಿರಿ: 2, 6, 12, 20, 30, ?",
    opts: ["40", "42", "44", "48"],
    optsKn: ["40", "42", "44", "48"],
    ans: "b",
    sub: "Reasoning",
    topic: "Series",
    diff: "medium",
    exp: "Pattern: 1×2, 2×3, 3×4, 4×5, 5×6, 6×7 = 42.",
    expKn: "ಮಾದರಿ: 1×2, 2×3, 3×4, 4×5, 5×6, 6×7 = 42.",
  },
  {
    q: "If CAT is coded as 3-1-20, how is DOG coded (A=1, B=2, ...)?",
    qKn: "CAT ಅನ್ನು 3-1-20 ಎಂದು ಕೋಡ್ ಮಾಡಿದರೆ, DOG ಅನ್ನು ಹೇಗೆ ಕೋಡ್ ಮಾಡಲಾಗುತ್ತದೆ (A=1, B=2, ...)?",
    opts: ["4-15-7", "4-14-7", "3-15-7", "4-15-8"],
    optsKn: ["4-15-7", "4-14-7", "3-15-7", "4-15-8"],
    ans: "a",
    sub: "Reasoning",
    topic: "Coding-Decoding",
    diff: "medium",
    exp: "D=4, O=15, G=7, so DOG = 4-15-7.",
    expKn: "D=4, O=15, G=7, ಆದ್ದರಿಂದ DOG = 4-15-7.",
  },
  {
    q: "Pointing to a photo, a man said, 'She is the daughter of my grandfather's only son.' Who is she to the man?",
    qKn: "ಫೋಟೋ ತೋರಿಸುತ್ತಾ ಒಬ್ಬ ವ್ಯಕ್ತಿ, 'ಅವಳು ನನ್ನ ತಾತನ ಏಕೈಕ ಮಗನ ಮಗಳು' ಎಂದನು. ಅವಳು ಆ ವ್ಯಕ್ತಿಗೆ ಯಾರು?",
    opts: ["Mother", "Sister", "Aunt", "Niece"],
    optsKn: ["ತಾಯಿ", "ಸಹೋದರಿ", "ಚಿಕ್ಕಮ್ಮ", "ಸೊಸೆ/ಅಳಿಯನ ಮಗಳು"],
    ans: "b",
    sub: "Reasoning",
    topic: "Blood Relations",
    diff: "medium",
    exp: "Grandfather's only son is the man's father; his daughter is the man's sister.",
    expKn: "ತಾತನ ಏಕೈಕ ಮಗ ಆ ವ್ಯಕ್ತಿಯ ತಂದೆ; ಅವರ ಮಗಳು ಆ ವ್ಯಕ್ತಿಯ ಸಹೋದರಿ.",
  },
  {
    q: "Find the odd one out: Apple, Mango, Potato, Banana",
    qKn: "ವಿಭಿನ್ನವಾದದ್ದನ್ನು ಕಂಡುಹಿಡಿಯಿರಿ: ಸೇಬು, ಮಾವು, ಆಲೂಗಡ್ಡೆ, ಬಾಳೆಹಣ್ಣು",
    opts: ["Apple", "Mango", "Potato", "Banana"],
    optsKn: ["ಸೇಬು", "ಮಾವು", "ಆಲೂಗಡ್ಡೆ", "ಬಾಳೆಹಣ್ಣು"],
    ans: "c",
    sub: "Reasoning",
    topic: "Classification",
    diff: "easy",
    exp: "Potato is a vegetable (tuber); the others are fruits.",
    expKn: "ಆಲೂಗಡ್ಡೆ ತರಕಾರಿ (ಗೆಡ್ಡೆ); ಉಳಿದವು ಹಣ್ಣುಗಳು.",
  },
  {
    q: "If in a certain code 'MONDAY' is written as 'NPOEBZ', how is 'FRIDAY' written?",
    qKn: "ಒಂದು ಕೋಡ್‌ನಲ್ಲಿ 'MONDAY' ಅನ್ನು 'NPOEBZ' ಎಂದು ಬರೆದರೆ, 'FRIDAY' ಅನ್ನು ಹೇಗೆ ಬರೆಯಲಾಗುತ್ತದೆ?",
    opts: ["GSJEBZ", "GSIEBZ", "GSJFBZ", "GTJEBZ"],
    optsKn: ["GSJEBZ", "GSIEBZ", "GSJFBZ", "GTJEBZ"],
    ans: "a",
    sub: "Reasoning",
    topic: "Coding-Decoding",
    diff: "hard",
    exp: "Each letter is shifted +1: F→G, R→S, I→J, D→E, A→B, Y→Z, giving GSJEBZ.",
    expKn: "ಪ್ರತಿ ಅಕ್ಷರವನ್ನು +1 ಸ್ಥಳಾಂತರಿಸಲಾಗಿದೆ: F→G, R→S, I→J, D→E, A→B, Y→Z, ಆದ್ದರಿಂದ GSJEBZ.",
  },
];

const CURRENT_AFFAIRS: Q[] = [
  {
    q: "Which city hosted the 2024 Summer Olympic Games?",
    qKn: "2024 ರ ಬೇಸಿಗೆ ಒಲಿಂಪಿಕ್ ಕ್ರೀಡಾಕೂಟವನ್ನು ಯಾವ ನಗರ ಆಯೋಜಿಸಿತು?",
    opts: ["Tokyo", "Paris", "Los Angeles", "Beijing"],
    optsKn: ["ಟೋಕಿಯೊ", "ಪ್ಯಾರಿಸ್", "ಲಾಸ್ ಏಂಜಲೀಸ್", "ಬೀಜಿಂಗ್"],
    ans: "b",
    sub: "Current Affairs",
    topic: "Sports",
    diff: "easy",
    exp: "Paris, France hosted the 2024 Summer Olympics.",
    expKn: "ಫ್ರಾನ್ಸ್‌ನ ಪ್ಯಾರಿಸ್ 2024 ರ ಬೇಸಿಗೆ ಒಲಿಂಪಿಕ್ಸ್ ಆಯೋಜಿಸಿತು.",
  },
  {
    q: "Which scheme provides free LPG connections to women from BPL families?",
    qKn: "BPL ಕುಟುಂಬಗಳ ಮಹಿಳೆಯರಿಗೆ ಉಚಿತ LPG ಸಂಪರ್ಕ ನೀಡುವ ಯೋಜನೆ ಯಾವುದು?",
    opts: ["PM-KISAN", "Ujjwala Yojana", "Ayushman Bharat", "MUDRA Yojana"],
    optsKn: ["PM-KISAN", "ಉಜ್ವಲ ಯೋಜನೆ", "ಆಯುಷ್ಮಾನ್ ಭಾರತ್", "ಮುದ್ರಾ ಯೋಜನೆ"],
    ans: "b",
    sub: "Current Affairs",
    topic: "Government Schemes",
    diff: "medium",
    exp: "Pradhan Mantri Ujjwala Yojana provides free LPG connections to women of BPL households.",
    expKn: "ಪ್ರಧಾನ ಮಂತ್ರಿ ಉಜ್ವಲ ಯೋಜನೆ BPL ಕುಟುಂಬಗಳ ಮಹಿಳೆಯರಿಗೆ ಉಚಿತ LPG ಸಂಪರ್ಕ ನೀಡುತ್ತದೆ.",
  },
  {
    q: "NITI Aayog replaced which earlier body?",
    qKn: "NITI ಆಯೋಗವು ಯಾವ ಹಿಂದಿನ ಸಂಸ್ಥೆಯನ್ನು ಬದಲಾಯಿಸಿತು?",
    opts: ["Finance Commission", "Planning Commission", "Election Commission", "UPSC"],
    optsKn: ["ಹಣಕಾಸು ಆಯೋಗ", "ಯೋಜನಾ ಆಯೋಗ", "ಚುನಾವಣಾ ಆಯೋಗ", "UPSC"],
    ans: "b",
    sub: "Current Affairs",
    topic: "Polity/Economy",
    diff: "medium",
    exp: "NITI Aayog replaced the Planning Commission in 2015.",
    expKn: "NITI ಆಯೋಗವು 2015 ರಲ್ಲಿ ಯೋಜನಾ ಆಯೋಗವನ್ನು ಬದಲಾಯಿಸಿತು.",
  },
  {
    q: "The 'Gruha Lakshmi' scheme launched by the Government of Karnataka provides financial assistance to whom?",
    qKn: "ಕರ್ನಾಟಕ ಸರ್ಕಾರ ಜಾರಿಗೆ ತಂದ 'ಗೃಹ ಲಕ್ಷ್ಮಿ' ಯೋಜನೆ ಯಾರಿಗೆ ಆರ್ಥಿಕ ನೆರವು ನೀಡುತ್ತದೆ?",
    opts: ["Farmers", "Woman head of the household", "Students", "Senior citizens"],
    optsKn: ["ರೈತರು", "ಕುಟುಂಬದ ಮಹಿಳಾ ಯಜಮಾನಿ", "ವಿದ್ಯಾರ್ಥಿಗಳು", "ಹಿರಿಯ ನಾಗರಿಕರು"],
    ans: "b",
    sub: "Current Affairs",
    topic: "Karnataka Schemes",
    diff: "medium",
    exp: "The Gruha Lakshmi scheme provides a monthly financial assistance to the woman head of eligible households in Karnataka.",
    expKn: "ಗೃಹ ಲಕ್ಷ್ಮಿ ಯೋಜನೆ ಕರ್ನಾಟಕದ ಅರ್ಹ ಕುಟುಂಬಗಳ ಮಹಿಳಾ ಯಜಮಾನಿಗೆ ಮಾಸಿಕ ಆರ್ಥಿಕ ನೆರವು ನೀಡುತ್ತದೆ.",
  },
];

const KANNADA: Q[] = [
  {
    q: "'ಕೈ' ಪದದ ಬಹುವಚನ ರೂಪ ಯಾವುದು?",
    qKn: "'ಕೈ' ಪದದ ಬಹುವಚನ ರೂಪ ಯಾವುದು?",
    opts: ["ಕೈಗಳು", "ಕೈಯು", "ಕೈಗೆ", "ಕೈಯಲ್ಲಿ"],
    optsKn: ["ಕೈಗಳು", "ಕೈಯು", "ಕೈಗೆ", "ಕೈಯಲ್ಲಿ"],
    ans: "a",
    sub: "Kannada",
    topic: "Grammar",
    diff: "easy",
    exp: "'ಕೈ' ಪದದ ಬಹುವಚನ 'ಕೈಗಳು'. ಬಹುವಚನ ಪ್ರತ್ಯಯ '-ಗಳು'.",
    expKn: "'ಕೈ' ಪದದ ಬಹುವಚನ 'ಕೈಗಳು'. ಬಹುವಚನ ಪ್ರತ್ಯಯ '-ಗಳು'.",
  },
  {
    q: "'ಸೂರ್ಯ' ಪದದ ಸಮಾನಾರ್ಥಕ ಪದ ಯಾವುದು?",
    qKn: "'ಸೂರ್ಯ' ಪದದ ಸಮಾನಾರ್ಥಕ ಪದ ಯಾವುದು?",
    opts: ["ಚಂದ್ರ", "ರವಿ", "ತಾರೆ", "ಮೇಘ"],
    optsKn: ["ಚಂದ್ರ", "ರವಿ", "ತಾರೆ", "ಮೇಘ"],
    ans: "b",
    sub: "Kannada",
    topic: "Vocabulary",
    diff: "easy",
    exp: "'ಸೂರ್ಯ'ನ ಸಮಾನಾರ್ಥಕ ಪದ 'ರವಿ' (ಭಾನು, ಆದಿತ್ಯ ಸಹ).",
    expKn: "'ಸೂರ್ಯ'ನ ಸಮಾನಾರ್ಥಕ ಪದ 'ರವಿ' (ಭಾನು, ಆದಿತ್ಯ ಸಹ).",
  },
  {
    q: "'ನೀರಿನಲ್ಲಿ' ಪದದಲ್ಲಿ ಬಳಸಿರುವ ವಿಭಕ್ತಿ ಪ್ರತ್ಯಯ ಯಾವುದು?",
    qKn: "'ನೀರಿನಲ್ಲಿ' ಪದದಲ್ಲಿ ಬಳಸಿರುವ ವಿಭಕ್ತಿ ಪ್ರತ್ಯಯ ಯಾವುದು?",
    opts: ["-ಅನ್ನು", "-ಇಂದ", "-ಅಲ್ಲಿ", "-ಗೆ"],
    optsKn: ["-ಅನ್ನು", "-ಇಂದ", "-ಅಲ್ಲಿ", "-ಗೆ"],
    ans: "c",
    sub: "Kannada",
    topic: "Grammar",
    diff: "medium",
    exp: "'ನೀರಿನಲ್ಲಿ' — ಸಪ್ತಮಿ ವಿಭಕ್ತಿ '-ಅಲ್ಲಿ' ಪ್ರತ್ಯಯ (ಅಧಿಕರಣ).",
    expKn: "'ನೀರಿನಲ್ಲಿ' — ಸಪ್ತಮಿ ವಿಭಕ್ತಿ '-ಅಲ್ಲಿ' ಪ್ರತ್ಯಯ (ಅಧಿಕರಣ).",
  },
  {
    q: "'ಹಗಲು' ಪದದ ವಿರುದ್ಧಾರ್ಥಕ ಪದ ಯಾವುದು?",
    qKn: "'ಹಗಲು' ಪದದ ವಿರುದ್ಧಾರ್ಥಕ ಪದ ಯಾವುದು?",
    opts: ["ಬೆಳಗು", "ಇರುಳು", "ಸಂಜೆ", "ಮಧ್ಯಾಹ್ನ"],
    optsKn: ["ಬೆಳಗು", "ಇರುಳು", "ಸಂಜೆ", "ಮಧ್ಯಾಹ್ನ"],
    ans: "b",
    sub: "Kannada",
    topic: "Vocabulary",
    diff: "easy",
    exp: "'ಹಗಲು'ವಿನ ವಿರುದ್ಧಾರ್ಥಕ ಪದ 'ಇರುಳು' (ರಾತ್ರಿ).",
    expKn: "'ಹಗಲು'ವಿನ ವಿರುದ್ಧಾರ್ಥಕ ಪದ 'ಇರುಳು' (ರಾತ್ರಿ).",
  },
];

const ENGLISH: Q[] = [
  {
    q: "Choose the synonym of 'Abundant':",
    qKn: "'Abundant' ಪದದ ಸಮಾನಾರ್ಥಕ ಪದವನ್ನು ಆರಿಸಿ:",
    opts: ["Scarce", "Plentiful", "Rare", "Limited"],
    optsKn: ["Scarce (ಕೊರತೆ)", "Plentiful (ಹೇರಳ)", "Rare (ಅಪರೂಪ)", "Limited (ಸೀಮಿತ)"],
    ans: "b",
    sub: "General English",
    topic: "Synonyms",
    diff: "easy",
    exp: "'Abundant' means existing in large quantities; 'plentiful' is its synonym.",
    expKn: "'Abundant' ಎಂದರೆ ಹೇರಳವಾಗಿ ಇರುವುದು; 'plentiful' ಅದರ ಸಮಾನಾರ್ಥಕ.",
  },
  {
    q: "Choose the antonym of 'Benevolent':",
    qKn: "'Benevolent' ಪದದ ವಿರುದ್ಧಾರ್ಥಕ ಪದವನ್ನು ಆರಿಸಿ:",
    opts: ["Kind", "Generous", "Malevolent", "Charitable"],
    optsKn: ["Kind (ದಯಾಳು)", "Generous (ಉದಾರ)", "Malevolent (ದುಷ್ಟ)", "Charitable (ದಾನಶೀಲ)"],
    ans: "c",
    sub: "General English",
    topic: "Antonyms",
    diff: "medium",
    exp: "'Benevolent' means kind and well-meaning; 'malevolent' (wishing harm) is its antonym.",
    expKn: "'Benevolent' ಎಂದರೆ ದಯಾಳು; 'malevolent' (ಹಾನಿ ಬಯಸುವ) ಅದರ ವಿರುದ್ಧಾರ್ಥಕ.",
  },
  {
    q: "Fill in the blank: 'She has been living here ___ 2010.'",
    qKn: "ಖಾಲಿ ಜಾಗ ತುಂಬಿಸಿ: 'She has been living here ___ 2010.'",
    opts: ["for", "since", "from", "by"],
    optsKn: ["for", "since", "from", "by"],
    ans: "b",
    sub: "General English",
    topic: "Grammar",
    diff: "medium",
    exp: "'Since' is used with a point of time (2010); 'for' is used with a duration.",
    expKn: "ನಿರ್ದಿಷ್ಟ ಸಮಯಬಿಂದುವಿನೊಂದಿಗೆ (2010) 'since' ಬಳಸುತ್ತೇವೆ; ಅವಧಿಯೊಂದಿಗೆ 'for'.",
  },
  {
    q: "Identify the correctly spelt word:",
    qKn: "ಸರಿಯಾಗಿ ಬರೆದಿರುವ ಪದವನ್ನು ಗುರುತಿಸಿ:",
    opts: ["Recieve", "Receive", "Receeve", "Receve"],
    optsKn: ["Recieve", "Receive", "Receeve", "Receve"],
    ans: "b",
    sub: "General English",
    topic: "Spelling",
    diff: "easy",
    exp: "The correct spelling is 'Receive' (i before e except after c).",
    expKn: "ಸರಿಯಾದ ಕಾಗುಣಿತ 'Receive' (c ನಂತರ e ಮೊದಲು i).",
  },
];

const BANKING: Q[] = [
  {
    q: "The Reserve Bank of India (RBI) was established in which year?",
    qKn: "ಭಾರತೀಯ ರಿಸರ್ವ್ ಬ್ಯಾಂಕ್ (RBI) ಯಾವ ವರ್ಷ ಸ್ಥಾಪನೆಯಾಯಿತು?",
    opts: ["1935", "1947", "1949", "1969"],
    optsKn: ["1935", "1947", "1949", "1969"],
    ans: "a",
    sub: "Banking Awareness",
    topic: "Banking",
    diff: "medium",
    exp: "The RBI was established on 1 April 1935 under the RBI Act, 1934.",
    expKn: "RBI ಅನ್ನು RBI ಕಾಯ್ದೆ, 1934 ಅಡಿಯಲ್ಲಿ 1 ಏಪ್ರಿಲ್ 1935 ರಂದು ಸ್ಥಾಪಿಸಲಾಯಿತು.",
  },
  {
    q: "What does 'IFSC' stand for in banking?",
    qKn: "ಬ್ಯಾಂಕಿಂಗ್‌ನಲ್ಲಿ 'IFSC' ಎಂದರೆ ಏನು?",
    opts: [
      "Indian Financial System Code",
      "International Fund Security Code",
      "Indian Fund Settlement Code",
      "Integrated Financial Service Code",
    ],
    optsKn: [
      "Indian Financial System Code",
      "International Fund Security Code",
      "Indian Fund Settlement Code",
      "Integrated Financial Service Code",
    ],
    ans: "a",
    sub: "Banking Awareness",
    topic: "Banking",
    diff: "easy",
    exp: "IFSC (Indian Financial System Code) is an 11-character code identifying a bank branch for electronic transfers.",
    expKn: "IFSC (Indian Financial System Code) ಎಲೆಕ್ಟ್ರಾನಿಕ್ ವರ್ಗಾವಣೆಗಾಗಿ ಬ್ಯಾಂಕ್ ಶಾಖೆಯನ್ನು ಗುರುತಿಸುವ 11-ಅಕ್ಷರಗಳ ಕೋಡ್.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// BODIES + EXAMS + TEST DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

type ExamDef = {
  name: string;
  slug: string;
  description: string;
  conductingBody: string;
  officialWebsite: string;
  eligibility: string;
  posts: string[];
  examPattern: string;
  syllabus: string;
};

type BodyDef = {
  name: string;
  slug: string;
  icon: string;
  color: string;
  description: string;
  isPopular: boolean;
  exams: ExamDef[];
};

const KA_BODIES: BodyDef[] = [
  {
    name: "KPSC — Karnataka Public Service Commission",
    slug: "kpsc",
    icon: "🏛️",
    color: "#4F46E5",
    description: "Gazetted & non-gazetted recruitment: KAS, Group C, AE/JE, departmental exams",
    isPopular: true,
    exams: [
      {
        name: "KAS (Gazetted Probationers)",
        slug: "kpsc-kas",
        description: "Karnataka Administrative Service — Group A & B gazetted posts via Prelims, Mains & Interview.",
        conductingBody: "Karnataka Public Service Commission (KPSC)",
        officialWebsite: "kpsc.kar.nic.in",
        eligibility: "Bachelor's degree from a recognised university. Age 21–35 years (relaxation for reserved categories).",
        posts: ["Assistant Commissioner", "Deputy Superintendent of Police (DySP)", "Tahsildar", "Commercial Tax Officer", "Assistant Director"],
        examPattern:
          "3 stages: (1) Prelims — 2 objective papers (Paper I General Studies 200 marks, Paper II 200 marks), qualifying. (2) Mains — descriptive papers (Kannada, English, Essay + 4 GS papers). (3) Personality Test / Interview.",
        syllabus:
          "Indian & Karnataka History, Geography, Indian Polity & Constitution, Economy, General Science & Technology, Current Affairs, Environment, and Karnataka-specific GK.",
      },
      {
        name: "KPSC Group C (Non-Technical)",
        slug: "kpsc-group-c",
        description: "Non-technical Group C posts across state government departments.",
        conductingBody: "Karnataka Public Service Commission (KPSC)",
        officialWebsite: "kpsc.kar.nic.in",
        eligibility: "PUC / Degree depending on post. Age 18–35 years (with relaxations).",
        posts: ["Junior Assistant", "Assistant", "Clerk", "Technical Assistant"],
        examPattern: "Objective written examination (General Knowledge, General Kannada/English, Quantitative Aptitude & Reasoning) followed by document verification.",
        syllabus: "General Knowledge, Karnataka GK, Reasoning, Quantitative Aptitude, General Kannada & English.",
      },
      {
        name: "KPSC Assistant Engineer (AE) / Junior Engineer (JE)",
        slug: "kpsc-ae-je",
        description: "Technical recruitment for Assistant & Junior Engineer posts (Civil / Mechanical / Electrical).",
        conductingBody: "Karnataka Public Service Commission (KPSC)",
        officialWebsite: "kpsc.kar.nic.in",
        eligibility: "Diploma (JE) / Degree (AE) in relevant engineering discipline.",
        posts: ["Assistant Engineer", "Junior Engineer"],
        examPattern: "Objective papers on General Studies + core engineering subject, followed by document verification.",
        syllabus: "General Studies, Karnataka GK, and discipline-specific engineering (Civil/Mechanical/Electrical).",
      },
    ],
  },
  {
    name: "KEA — Karnataka Examinations Authority",
    slug: "kea",
    icon: "📝",
    color: "#0EA5E9",
    description: "FDA, SDA, Village Accountant, PDO, Gram Panchayat Secretary & various posts",
    isPopular: true,
    exams: [
      {
        name: "FDA (First Division Assistant)",
        slug: "kea-fda",
        description: "First Division Assistant — ministerial posts in state government offices.",
        conductingBody: "Karnataka Examinations Authority (KEA)",
        officialWebsite: "cetonline.karnataka.gov.in/kea",
        eligibility: "Bachelor's degree from a recognised university. Age 18–35 years (with relaxations).",
        posts: ["First Division Assistant", "Ministerial staff in state departments"],
        examPattern:
          "3 papers: Paper 1 — Compulsory Kannada (qualifying). Paper 2 — General Kannada / General English (100 marks). Paper 3 — General Knowledge & Computer Knowledge (100 objective questions, 1 mark each). Negative marking 0.25 per wrong answer.",
        syllabus: "General Knowledge, Indian & Karnataka History, Polity, Geography, Economy, Current Affairs, General Science, Computer Awareness, Kannada & English language.",
      },
      {
        name: "SDA (Second Division Assistant)",
        slug: "kea-sda",
        description: "Second Division Assistant — clerical posts in state government offices.",
        conductingBody: "Karnataka Examinations Authority (KEA)",
        officialWebsite: "cetonline.karnataka.gov.in/kea",
        eligibility: "PUC / 12th pass (or as specified). Age 18–35 years (with relaxations).",
        posts: ["Second Division Assistant", "Clerk / Typist"],
        examPattern:
          "3 papers: Paper 1 — Compulsory Kannada (qualifying). Paper 2 — General Kannada / General English (100 marks). Paper 3 — General Knowledge & Computer Knowledge (100 objective questions). Negative marking 0.25.",
        syllabus: "General Knowledge, Karnataka GK, History, Polity, Geography, Current Affairs, General Science, Computer & language skills (PUC level).",
      },
      {
        name: "Village Accountant (VAO)",
        slug: "kea-village-accountant",
        description: "Village Accountant under the Karnataka Revenue Department.",
        conductingBody: "Karnataka Examinations Authority (KEA)",
        officialWebsite: "cetonline.karnataka.gov.in/kea",
        eligibility: "PUC / 12th pass with basic computer knowledge. Age 18–35 years (with relaxations).",
        posts: ["Village Accountant (Grama Lekkigara)"],
        examPattern: "Objective written examination — General Knowledge, General Kannada, General English, Quantitative Aptitude and Reasoning.",
        syllabus: "Karnataka & Indian GK, Revenue administration basics, Quantitative Aptitude, Reasoning, Kannada & English.",
      },
      {
        name: "PDO (Panchayat Development Officer)",
        slug: "kea-pdo",
        description: "Panchayat Development Officer — administrative head at Grama Panchayat level.",
        conductingBody: "Karnataka Examinations Authority (KEA) / RDPR Department",
        officialWebsite: "cetonline.karnataka.gov.in/kea",
        eligibility: "Bachelor's degree from a recognised university. Age 18–35 years (with relaxations).",
        posts: ["Panchayat Development Officer", "Grama Panchayat Secretary"],
        examPattern:
          "2 objective papers, 200 marks total, OMR based. Paper I — General Knowledge (100 Qs, 90 min). Paper II — Rural Development, Panchayat Raj & language (100 Qs, 120 min). Negative marking 0.25. Compulsory Kannada test is qualifying.",
        syllabus: "General Knowledge, Karnataka Panchayat Raj Act, Rural Development schemes, Indian Constitution & Panchayat Raj, Karnataka geography & history, Current Affairs.",
      },
    ],
  },
  {
    name: "Karnataka State Police (KSP)",
    slug: "ksp",
    icon: "👮",
    color: "#DC2626",
    description: "Police Constable (Civil/Armed), PSI, Sub-Reserve, Bandsman recruitment",
    isPopular: true,
    exams: [
      {
        name: "Civil Police Constable (PC)",
        slug: "ksp-civil-pc",
        description: "Civil Police Constable recruitment (men & women) with PST/PET and written exam.",
        conductingBody: "Karnataka State Police (KSP)",
        officialWebsite: "ksp.karnataka.gov.in",
        eligibility: "PUC / 12th pass. Must meet physical standards (height, chest, endurance). Age 19–25 years (with relaxations).",
        posts: ["Civil Police Constable"],
        examPattern:
          "Stages: Physical Standard Test (PST) → Endurance/Physical Efficiency Test (ET/PET) → Written Exam (objective: General Knowledge, Reasoning, Quantitative Aptitude, Karnataka GK).",
        syllabus: "General Knowledge, Karnataka GK & current affairs, Mental Ability & Reasoning, Quantitative Aptitude, General Science.",
      },
      {
        name: "Police Sub-Inspector (PSI)",
        slug: "ksp-psi",
        description: "Civil Police Sub-Inspector — Prelims + Mains + PST/PET.",
        conductingBody: "Karnataka State Police (KSP)",
        officialWebsite: "ksp.karnataka.gov.in",
        eligibility: "Bachelor's degree. Physical standards apply. Age 21–28 years (with relaxations).",
        posts: ["Police Sub-Inspector (Civil)"],
        examPattern:
          "Physical Standard Test & Endurance Test (qualifying) → Written Exam: Paper I (General Knowledge, descriptive) and Paper II (Mental Ability & Reasoning, objective), each ~100 marks.",
        syllabus: "Indian History & Freedom Struggle, Constitution, Economy, Geography (India & Karnataka), General Science, Current Affairs, Karnataka culture, Reasoning & Mental Ability.",
      },
      {
        name: "Armed Reserve Police Constable",
        slug: "ksp-armed-pc",
        description: "Armed Reserve / Special Reserve Police Constable recruitment.",
        conductingBody: "Karnataka State Police (KSP)",
        officialWebsite: "ksp.karnataka.gov.in",
        eligibility: "PUC / 12th pass. Physical standards apply. Age 19–25 years (with relaxations).",
        posts: ["Armed Reserve Police Constable", "Special Reserve Police Constable"],
        examPattern: "PST → Endurance Test → Written Exam (objective General Knowledge, Reasoning, Quantitative Aptitude).",
        syllabus: "General Knowledge, Karnataka GK, Reasoning, Quantitative Aptitude, General Science, Current Affairs.",
      },
    ],
  },
  {
    name: "KPTCL / ESCOMs",
    slug: "kptcl",
    icon: "⚡",
    color: "#F59E0B",
    description: "Power sector: Assistant Engineer, Junior Engineer, Junior Assistant, Lineman",
    isPopular: false,
    exams: [
      {
        name: "KPTCL Assistant Engineer / Junior Engineer",
        slug: "kptcl-ae-je",
        description: "Engineer recruitment for Karnataka Power Transmission Corporation & ESCOMs.",
        conductingBody: "KPTCL / BESCOM / HESCOM / MESCOM / GESCOM",
        officialWebsite: "kptcl.karnataka.gov.in",
        eligibility: "Diploma (JE) / Degree (AE) in Electrical / Civil / Mechanical Engineering.",
        posts: ["Assistant Engineer (Electrical/Civil)", "Junior Engineer", "Assistant Executive Engineer"],
        examPattern: "Computer-based objective test — General Knowledge/Aptitude + core engineering subject.",
        syllabus: "General Studies, Karnataka GK, Reasoning & Aptitude, and Electrical/Civil/Mechanical engineering fundamentals.",
      },
      {
        name: "KPTCL Junior Assistant / Junior Lineman",
        slug: "kptcl-junior-assistant",
        description: "Non-technical & field posts across KPTCL and ESCOMs.",
        conductingBody: "KPTCL / ESCOMs",
        officialWebsite: "kptcl.karnataka.gov.in",
        eligibility: "PUC / ITI depending on post.",
        posts: ["Junior Assistant", "Junior Lineman", "Junior Station Attendant"],
        examPattern: "Objective written examination — General Knowledge, Kannada, Reasoning & Arithmetic (plus trade test for Lineman).",
        syllabus: "General Knowledge, Karnataka GK, Kannada, Reasoning, Arithmetic, and basic electrical trade knowledge.",
      },
    ],
  },
  {
    name: "Karnataka Forest Department",
    slug: "forest",
    icon: "🌳",
    color: "#16A34A",
    description: "Forest Guard, Forest Watcher, Range Forest Officer (RFO) recruitment",
    isPopular: false,
    exams: [
      {
        name: "Forest Guard (Forester)",
        slug: "forest-guard",
        description: "Forest Guard recruitment with physical standards and written exam.",
        conductingBody: "Karnataka Forest Department",
        officialWebsite: "aranya.gov.in",
        eligibility: "PUC / 12th pass. Physical standards (walking/endurance) apply.",
        posts: ["Forest Guard", "Forester"],
        examPattern: "Endurance walking test (qualifying) + objective written exam (General Knowledge, Science, Reasoning, Karnataka GK).",
        syllabus: "General Knowledge, Environment & Ecology, General Science, Karnataka GK, Reasoning & Aptitude.",
      },
      {
        name: "Range Forest Officer (RFO)",
        slug: "forest-rfo",
        description: "Range Forest Officer — gazetted forest service recruitment.",
        conductingBody: "Karnataka Forest Department / KPSC",
        officialWebsite: "aranya.gov.in",
        eligibility: "Bachelor's degree in Science / Engineering / Agriculture / Forestry.",
        posts: ["Range Forest Officer", "Deputy Range Forest Officer"],
        examPattern: "Objective/descriptive written exam on General Studies + optional science subject, followed by physical test and interview.",
        syllabus: "General Studies, Environment & Ecology, General Science, Karnataka GK, and optional subject (Botany/Zoology/Forestry etc.).",
      },
    ],
  },
  {
    name: "KSRTC / BMTC",
    slug: "ksrtc",
    icon: "🚌",
    color: "#7C3AED",
    description: "Driver, Conductor, Technical Assistant recruitment in state transport",
    isPopular: false,
    exams: [
      {
        name: "KSRTC Driver / Conductor",
        slug: "ksrtc-driver-conductor",
        description: "Recruitment of Drivers and Conductors for Karnataka state road transport corporations.",
        conductingBody: "KSRTC / BMTC / NWKRTC / KKRTC",
        officialWebsite: "ksrtc.in",
        eligibility: "SSLC / PUC pass; valid driving licence (HPV) required for Driver posts.",
        posts: ["Driver", "Driver-cum-Conductor", "Conductor"],
        examPattern: "Objective written test (General Knowledge, Arithmetic, Kannada, road rules) + skill/driving test for Driver posts.",
        syllabus: "General Knowledge, Karnataka GK, Arithmetic, Kannada, Motor Vehicle rules & road safety.",
      },
    ],
  },
  {
    name: "Karnataka Teaching (GPSTR / TET)",
    slug: "ka-teaching",
    icon: "👩‍🏫",
    color: "#DB2777",
    description: "Graduate Primary School Teacher, Karnataka TET, PU Lecturer recruitment",
    isPopular: false,
    exams: [
      {
        name: "Graduate Primary School Teacher (GPSTR)",
        slug: "ka-gpstr",
        description: "Graduate Primary School Teacher recruitment for classes 6–8.",
        conductingBody: "Department of Public Instruction, Karnataka",
        officialWebsite: "schooleducation.kar.nic.in",
        eligibility: "Bachelor's degree with B.Ed and TET qualification.",
        posts: ["Graduate Primary School Teacher (6th–8th)"],
        examPattern: "Objective competitive exam — General Knowledge, Educational Psychology/Pedagogy, subject knowledge and language (Kannada/English).",
        syllabus: "General Knowledge, Child Development & Pedagogy, Karnataka GK, subject specialisation, Kannada & English.",
      },
      {
        name: "Karnataka TET (KARTET)",
        slug: "ka-tet",
        description: "Karnataka Teacher Eligibility Test — Paper I (1–5) and Paper II (6–8).",
        conductingBody: "Centralised Admission Cell / DSERT, Karnataka",
        officialWebsite: "schooleducation.kar.nic.in",
        eligibility: "D.Ed/B.Ed as applicable. Paper I for classes 1–5, Paper II for classes 6–8.",
        posts: ["Eligibility certificate for teacher recruitment"],
        examPattern: "150 objective questions, 150 marks, 150 minutes, no negative marking. Sections: Child Development & Pedagogy, Language I & II, Maths, EVS / Science & Social Studies.",
        syllabus: "Child Development & Pedagogy, Language I (Kannada), Language II (English), Mathematics, Environmental Studies / Science & Social Science.",
      },
    ],
  },
  {
    name: "Cooperative / Apex Bank",
    slug: "ka-coop-bank",
    icon: "🏦",
    color: "#0D9488",
    description: "Karnataka State Coop Apex Bank, DCC Banks, Karnataka Gramin Bank posts",
    isPopular: false,
    exams: [
      {
        name: "Karnataka Apex Bank Clerk / Manager",
        slug: "ka-apex-bank",
        description: "Clerk and Manager recruitment in Karnataka State Cooperative Apex Bank & DCC Banks.",
        conductingBody: "Karnataka State Cooperative Apex Bank",
        officialWebsite: "karnatakaapex.com",
        eligibility: "Bachelor's degree; computer knowledge preferred.",
        posts: ["Clerk / Assistant", "Manager", "Attender"],
        examPattern: "Objective online test — Reasoning, Quantitative Aptitude, English/Kannada, General & Banking Awareness, Computer Knowledge.",
        syllabus: "Reasoning, Quantitative Aptitude, Banking & Financial Awareness, Karnataka GK, Computer Knowledge, English & Kannada.",
      },
    ],
  },
  {
    name: "Health / BBMP / Revenue",
    slug: "ka-health-bbmp",
    icon: "🩺",
    color: "#EA580C",
    description: "Staff Nurse, BBMP posts, Revenue Department & other state recruitments",
    isPopular: false,
    exams: [
      {
        name: "Karnataka Staff Nurse / Health Dept",
        slug: "ka-staff-nurse",
        description: "Staff Nurse and paramedical recruitment under the Karnataka Health Department.",
        conductingBody: "Department of Health & Family Welfare, Karnataka",
        officialWebsite: "karunadu.karnataka.gov.in/hfw",
        eligibility: "GNM / B.Sc Nursing with KSNC registration.",
        posts: ["Staff Nurse", "Junior Health Assistant", "Lab Technician"],
        examPattern: "Objective written exam — Nursing subject knowledge + General Knowledge + Karnataka GK.",
        syllabus: "Nursing fundamentals, Anatomy & Physiology, Community Health, General Knowledge, Karnataka GK.",
      },
      {
        name: "BBMP / Municipal Posts",
        slug: "ka-bbmp",
        description: "Bruhat Bengaluru Mahanagara Palike and urban local body recruitment.",
        conductingBody: "BBMP / Directorate of Municipal Administration",
        officialWebsite: "bbmp.gov.in",
        eligibility: "PUC / Degree depending on post.",
        posts: ["Junior Assistant", "Case Worker", "Revenue Inspector", "Group D"],
        examPattern: "Objective written examination — General Knowledge, Karnataka GK, Reasoning, Arithmetic and Kannada.",
        syllabus: "General Knowledge, Karnataka GK & civic administration, Reasoning, Arithmetic, Kannada & English.",
      },
    ],
  },
];

// ─── Test blueprints per exam ────────────────────────────────────────────────
// Each test pulls unique questions from the named subject pools.

const POOLS: Record<string, Q[]> = {
  kagk: KARNATAKA_GK,
  polity: POLITY,
  pr: PANCHAYAT_RAJ,
  history: HISTORY,
  geo: GEOGRAPHY,
  science: SCIENCE,
  quant: QUANT,
  reasoning: REASONING,
  ca: CURRENT_AFFAIRS,
  kannada: KANNADA,
  english: ENGLISH,
  banking: BANKING,
};

type TestBlueprint = {
  examSlug: string;
  title: string;
  type: "mock" | "subject" | "pyp" | "practice";
  pools: string[];
  limit?: number; // cap total questions
  isFree: boolean;
  duration: number;
};

const TEST_BLUEPRINTS: TestBlueprint[] = [
  // KEA FDA — flagship full mock + sectionals
  { examSlug: "kea-fda", title: "FDA Full Mock Test 1 (Bilingual)", type: "mock", pools: ["kagk", "polity", "history", "geo", "science", "ca", "reasoning", "quant", "english", "kannada"], isFree: true, duration: 90 },
  { examSlug: "kea-fda", title: "FDA Sectional: Karnataka GK", type: "subject", pools: ["kagk"], isFree: true, duration: 15 },
  { examSlug: "kea-fda", title: "FDA Sectional: Indian Polity", type: "subject", pools: ["polity"], isFree: false, duration: 15 },
  { examSlug: "kea-fda", title: "FDA Sectional: General Science & Current Affairs", type: "subject", pools: ["science", "ca"], isFree: false, duration: 20 },
  // KEA SDA
  { examSlug: "kea-sda", title: "SDA Full Mock Test 1 (Bilingual)", type: "mock", pools: ["kagk", "history", "geo", "science", "ca", "reasoning", "quant", "kannada", "english"], isFree: true, duration: 90 },
  { examSlug: "kea-sda", title: "SDA Sectional: Reasoning & Aptitude", type: "subject", pools: ["reasoning", "quant"], isFree: false, duration: 20 },
  // PDO — flagship
  { examSlug: "kea-pdo", title: "PDO Full Mock Test 1 (Bilingual)", type: "mock", pools: ["pr", "kagk", "polity", "geo", "history", "ca", "science"], isFree: true, duration: 120 },
  { examSlug: "kea-pdo", title: "PDO Sectional: Panchayat Raj & Rural Development", type: "subject", pools: ["pr"], isFree: true, duration: 20 },
  { examSlug: "kea-pdo", title: "PDO Sectional: Karnataka GK & Polity", type: "subject", pools: ["kagk", "polity"], isFree: false, duration: 20 },
  // Village Accountant
  { examSlug: "kea-village-accountant", title: "Village Accountant Mock Test 1", type: "mock", pools: ["kagk", "quant", "reasoning", "geo", "ca", "kannada"], isFree: true, duration: 60 },
  // KAS Prelims — flagship GS
  { examSlug: "kpsc-kas", title: "KAS Prelims GS Mock Test 1", type: "mock", pools: ["polity", "history", "geo", "science", "ca", "kagk"], isFree: true, duration: 120 },
  { examSlug: "kpsc-kas", title: "KAS Sectional: Indian Polity & Constitution", type: "subject", pools: ["polity"], isFree: false, duration: 20 },
  // KPSC Group C
  { examSlug: "kpsc-group-c", title: "Group C Mock Test 1", type: "mock", pools: ["kagk", "reasoning", "quant", "ca", "english"], isFree: true, duration: 60 },
  // KSP PSI
  { examSlug: "ksp-psi", title: "PSI Full Mock Test 1 (Bilingual)", type: "mock", pools: ["history", "polity", "geo", "science", "ca", "kagk", "reasoning"], isFree: true, duration: 90 },
  { examSlug: "ksp-psi", title: "PSI Sectional: Mental Ability & Reasoning", type: "subject", pools: ["reasoning", "quant"], isFree: false, duration: 20 },
  // KSP Civil PC
  { examSlug: "ksp-civil-pc", title: "Civil PC Mock Test 1", type: "mock", pools: ["kagk", "reasoning", "quant", "science", "ca"], isFree: true, duration: 90 },
  { examSlug: "ksp-civil-pc", title: "Civil PC Sectional: Karnataka GK", type: "subject", pools: ["kagk"], isFree: true, duration: 15 },
  // Armed PC
  { examSlug: "ksp-armed-pc", title: "Armed Reserve PC Mock Test 1", type: "mock", pools: ["kagk", "reasoning", "quant", "ca", "science"], isFree: true, duration: 90 },
  // Forest Guard
  { examSlug: "forest-guard", title: "Forest Guard Mock Test 1", type: "mock", pools: ["science", "geo", "kagk", "reasoning", "ca"], isFree: true, duration: 60 },
  // KPTCL AE/JE
  { examSlug: "kptcl-ae-je", title: "KPTCL AE/JE General Studies Mock 1", type: "mock", pools: ["kagk", "science", "reasoning", "quant", "ca"], isFree: true, duration: 60 },
  // Teaching GPSTR
  { examSlug: "ka-gpstr", title: "GPSTR General Knowledge Mock 1", type: "mock", pools: ["kagk", "polity", "history", "science", "english", "kannada"], isFree: true, duration: 60 },
  // KARTET
  { examSlug: "ka-tet", title: "KARTET Paper Practice: GK & Language", type: "practice", pools: ["kagk", "english", "kannada", "science"], isFree: true, duration: 45 },
  // Apex Bank
  { examSlug: "ka-apex-bank", title: "Apex Bank Clerk Mock Test 1", type: "mock", pools: ["banking", "reasoning", "quant", "ca", "english"], isFree: true, duration: 60 },
  // Staff Nurse
  { examSlug: "ka-staff-nurse", title: "Staff Nurse GK & Science Mock 1", type: "mock", pools: ["science", "kagk", "ca"], isFree: true, duration: 60 },
  // BBMP
  { examSlug: "ka-bbmp", title: "BBMP Junior Assistant Mock 1", type: "mock", pools: ["kagk", "reasoning", "quant", "ca", "kannada"], isFree: true, duration: 60 },
  // VAO & KSRTC light
  { examSlug: "ksrtc-driver-conductor", title: "KSRTC Driver/Conductor Mock 1", type: "mock", pools: ["kagk", "quant", "reasoning", "ca"], isFree: true, duration: 45 },
];

function toQuestionDoc(item: Q, order: number) {
  return {
    questionText: item.q,
    questionTextKn: item.qKn,
    options: item.opts.map((t, i) => ({ id: OPT_IDS[i], text: t })),
    optionsKn: item.optsKn.map((t, i) => ({ id: OPT_IDS[i], text: t })),
    correctOptionId: item.ans,
    explanation: item.exp,
    explanationKn: item.expKn,
    subject: item.sub,
    topic: item.topic,
    difficulty: item.diff,
    marks: 1,
    negativeMarks: 0.25,
    order,
    language: "English",
  };
}

function assembleQuestions(poolKeys: string[], limit?: number): Q[] {
  const seen = new Set<string>();
  const out: Q[] = [];
  for (const key of poolKeys) {
    for (const q of POOLS[key] ?? []) {
      if (seen.has(q.q)) continue;
      seen.add(q.q);
      out.push(q);
    }
  }
  return limit ? out.slice(0, limit) : out;
}

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    // 1) Push existing (national) categories below Karnataka & tag region.
    const existingCats = await ctx.db.query("examCategories").collect();
    const kaSlugs = new Set(KA_BODIES.map((b) => b.slug));
    for (const cat of existingCats) {
      if (kaSlugs.has(cat.slug)) continue; // don't touch KA rows
      const patch: Record<string, unknown> = {};
      if (cat.region !== "national") patch.region = "national";
      if (cat.order < 100) patch.order = cat.order + 100;
      if (Object.keys(patch).length) await ctx.db.patch(cat._id, patch);
    }

    // 2) Insert Karnataka bodies + exams (idempotent by slug).
    let bodiesCreated = 0;
    let examsCreated = 0;
    let order = 1;
    for (const body of KA_BODIES) {
      const thisOrder = order++;
      let cat = await ctx.db
        .query("examCategories")
        .withIndex("by_slug", (q) => q.eq("slug", body.slug))
        .first();
      if (!cat) {
        const catId = await ctx.db.insert("examCategories", {
          name: body.name,
          slug: body.slug,
          description: body.description,
          icon: body.icon,
          color: body.color,
          isPopular: body.isPopular,
          region: "karnataka",
          order: thisOrder,
          isActive: true,
        });
        cat = await ctx.db.get(catId);
        bodiesCreated++;
      } else {
        await ctx.db.patch(cat._id, { region: "karnataka", order: thisOrder, isActive: true });
      }
      if (!cat) continue;

      let examOrder = 1;
      for (const exam of body.exams) {
        const existingExam = await ctx.db
          .query("exams")
          .withIndex("by_slug", (q) => q.eq("slug", exam.slug))
          .first();
        if (existingExam) {
          await ctx.db.patch(existingExam._id, {
            categoryId: cat._id,
            conductingBody: exam.conductingBody,
            officialWebsite: exam.officialWebsite,
            eligibility: exam.eligibility,
            posts: exam.posts,
            examPattern: exam.examPattern,
            syllabus: exam.syllabus,
          });
          continue;
        }
        await ctx.db.insert("exams", {
          categoryId: cat._id,
          name: exam.name,
          slug: exam.slug,
          description: exam.description,
          icon: body.icon,
          totalTests: 0,
          isActive: true,
          order: examOrder++,
          conductingBody: exam.conductingBody,
          officialWebsite: exam.officialWebsite,
          eligibility: exam.eligibility,
          posts: exam.posts,
          examPattern: exam.examPattern,
          syllabus: exam.syllabus,
        });
        examsCreated++;
      }
    }

    // 3) Insert tests + bilingual questions (idempotent by test slug).
    let testsCreated = 0;
    let questionsCreated = 0;
    for (const bp of TEST_BLUEPRINTS) {
      const exam = await ctx.db
        .query("exams")
        .withIndex("by_slug", (q) => q.eq("slug", bp.examSlug))
        .first();
      if (!exam) continue;

      const testSlug = slugify(bp.title);
      const exists = await ctx.db
        .query("tests")
        .withIndex("by_slug", (q) => q.eq("slug", testSlug))
        .first();
      if (exists) continue;

      const questions = assembleQuestions(bp.pools, bp.limit);
      if (questions.length === 0) continue;

      const testId = await ctx.db.insert("tests", {
        examId: exam._id,
        title: bp.title,
        slug: testSlug,
        description: `${bp.title} — bilingual (English + ಕನ್ನಡ) with detailed solutions. Based on the latest ${exam.name} pattern.`,
        type: bp.type,
        durationMinutes: bp.duration,
        totalQuestions: questions.length,
        totalMarks: questions.length,
        negativeMarking: 0.25,
        languages: ["English", "Kannada"],
        isFree: bp.isFree,
        isPremium: !bp.isFree,
        isActive: true,
        attemptCount: 250 + questions.length * 7,
        createdAt: Date.now(),
      });

      for (let i = 0; i < questions.length; i++) {
        await ctx.db.insert("questions", { testId, ...toQuestionDoc(questions[i], i + 1) });
        questionsCreated++;
      }

      const freshExam = await ctx.db.get(exam._id);
      if (freshExam) await ctx.db.patch(exam._id, { totalTests: freshExam.totalTests + 1 });
      testsCreated++;
    }

    return {
      message: `✅ Karnataka catalog seeded. +${bodiesCreated} bodies, +${examsCreated} exams, +${testsCreated} tests, +${questionsCreated} bilingual questions. Existing national categories preserved and moved below Karnataka.`,
      bodiesCreated,
      examsCreated,
      testsCreated,
      questionsCreated,
    };
  },
});

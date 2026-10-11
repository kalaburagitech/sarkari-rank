// Legal / compliance content for Google Play "Misleading Claims" policy.
// The app shows government-exam information without government affiliation, so
// it must (1) clearly disclaim affiliation and (2) link to official sources.

export const DISCLAIMER_SHORT =
  "Independent educational app — not affiliated with, or endorsed by, any government entity. Tap for official sources.";

export const DISCLAIMER_FULL =
  "Astraa is an independent educational application created to help candidates prepare for competitive examinations. It is NOT affiliated with, endorsed by, authorized by, or associated with any government department, ministry, agency, board, commission, or official recruitment body.\n\n" +
  "All exam names, logos, and trademarks are the property of their respective official organizations. All content in this app — including practice questions, mock tests, study notes, exam details, and current affairs — is provided for general educational and preparation purposes only. It is aggregated from publicly available sources and may not always be accurate, complete, or up to date.\n\n" +
  "Always verify official notifications, eligibility, exam dates, syllabus, and results on the respective official government websites listed below before taking any action. Current affairs shown in this app are aggregated from public news sources — open each item and tap “Read at source” to view the original article.";

export type OfficialPortal = { name: string; url: string };

// Official (government / official recruitment body) source portals.
// Every URL here was opened and checked (Oct 2026) from India AND from a US
// network (where Play reviewers usually are). Google rejects the app if any
// source link is broken — test a URL in a browser before adding it here.
// The app never opens an exam's raw `officialWebsite` from the database: it is
// mapped onto this list by `officialSourceFor`, so bad admin data can't ship a
// dead link.
export const PORTALS = {
  india: { name: "National Portal of India", url: "https://www.india.gov.in" },
  karnataka: { name: "Government of Karnataka", url: "https://karnataka.gov.in" },
  ssc: { name: "Staff Selection Commission (SSC)", url: "https://ssc.gov.in" },
  upsc: { name: "Union Public Service Commission (UPSC)", url: "https://upsc.gov.in" },
  ibps: { name: "Institute of Banking Personnel Selection (IBPS)", url: "https://www.ibps.in" },
  sbi: { name: "State Bank of India — Careers", url: "https://sbi.bank.in/web/careers" },
  rrb: { name: "Railway Recruitment Boards (RRB)", url: "https://www.rrbapply.gov.in" },
  ctet: { name: "Central Teacher Eligibility Test (CTET)", url: "https://ctet.nic.in" },
  kpsc: { name: "Karnataka Public Service Commission (KPSC)", url: "https://kpsc.kar.nic.in" },
  kea: { name: "Karnataka Examinations Authority (KEA)", url: "https://cetonline.karnataka.gov.in/kea" },
  ksp: { name: "Karnataka State Police", url: "https://ksp.karnataka.gov.in" },
  school: { name: "School Education Dept., Karnataka", url: "https://schooleducation.karnataka.gov.in" },
  forest: { name: "Karnataka Forest Department", url: "https://aranya.gov.in" },
  kptcl: { name: "Karnataka Power Transmission Corp. (KPTCL)", url: "https://kptcl.karnataka.gov.in" },
  ksrtc: { name: "Karnataka State Road Transport Corp. (KSRTC)", url: "https://ksrtc.karnataka.gov.in" },
  apex: { name: "Karnataka State Co-operative Apex Bank", url: "https://karnatakaapex.bank.in" },
  bwssb: { name: "Bangalore Water Supply & Sewerage Board", url: "https://bwssb.karnataka.gov.in" },
  uppsc: { name: "Uttar Pradesh Public Service Commission", url: "https://uppsc.up.nic.in" },
  bpsc: { name: "Bihar Public Service Commission", url: "https://bpsc.bihar.gov.in" },
} satisfies Record<string, OfficialPortal>;

// Shown on the "About & Disclaimer" screen.
export const OFFICIAL_PORTALS: OfficialPortal[] = [
  PORTALS.india,
  PORTALS.ssc,
  PORTALS.upsc,
  PORTALS.ibps,
  PORTALS.sbi,
  PORTALS.rrb,
  PORTALS.ctet,
  PORTALS.karnataka,
  PORTALS.kpsc,
  PORTALS.kea,
  PORTALS.ksp,
  PORTALS.school,
];

// First match wins — checked against the exam's officialWebsite, conducting
// body and name. Specific bodies come before generic ones (KEA before Police).
const RULES: [RegExp, OfficialPortal][] = [
  [/kpsc|public service commission.*karnataka|karnataka public service/i, PORTALS.kpsc],
  [/\bkea\b|cetonline|examinations? authority/i, PORTALS.kea],
  [/\bssc\b|staff selection/i, PORTALS.ssc],
  [/upsc|union public/i, PORTALS.upsc],
  [/uppsc|up-psc|uttar pradesh/i, PORTALS.uppsc],
  [/bpsc|bihar/i, PORTALS.bpsc],
  [/ibps/i, PORTALS.ibps],
  [/\bsbi\b|state bank of india|sbi\.(co|bank)\.in/i, PORTALS.sbi],
  [/apex/i, PORTALS.apex],
  [/\brrb\b|railway/i, PORTALS.rrb],
  [/ctet/i, PORTALS.ctet],
  [/kartet|\btet\b|gpstr|teacher|school ?education|dsert|public instruction/i, PORTALS.school],
  [/aranya|forest|\brfo\b/i, PORTALS.forest],
  [/kptcl|escom|power transmission/i, PORTALS.kptcl],
  [/ksrtc|bmtc|road transport/i, PORTALS.ksrtc],
  [/bwssb|water supply/i, PORTALS.bwssb],
  [/ksp|police|\bpsi\b|constable|\bksrp\b|\bcpc\b|\brpc\b|\bpc\b/i, PORTALS.ksp],
  [/\bvao\b|\bpdo\b|village|panchayat|\bfda\b|\bsda\b|division assistant/i, PORTALS.kea],
  [/karnataka|kar\.nic|bbmp|municipal/i, PORTALS.karnataka],
];

/** Verified official source for an exam. Always returns a working link. */
export function officialSourceFor(exam: {
  name?: string;
  conductingBody?: string;
  officialWebsite?: string;
}): OfficialPortal {
  for (const field of [exam.officialWebsite, exam.conductingBody, exam.name]) {
    if (!field) continue;
    for (const [re, portal] of RULES) if (re.test(field)) return portal;
  }
  return PORTALS.india;
}

// Public policy pages (hosted on the admin site) — also linked from the Play listing.
export const PRIVACY_URL = "https://sarkari-rank.vercel.app/privacy";
export const DELETE_ACCOUNT_URL = "https://sarkari-rank.vercel.app/delete-account";

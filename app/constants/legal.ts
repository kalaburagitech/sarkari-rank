// Legal / compliance content for Google Play "Misleading Claims" policy.
// The app shows government-exam information without government affiliation, so
// it must (1) clearly disclaim affiliation and (2) link to official sources.

export const DISCLAIMER_SHORT =
  "Independent educational app — not affiliated with, or endorsed by, any government entity.";

export const DISCLAIMER_FULL =
  "SarkariRank is an independent educational application created to help candidates prepare for competitive examinations. It is NOT affiliated with, endorsed by, authorized by, or associated with any government department, ministry, agency, board, commission, or official recruitment body.\n\n" +
  "All exam names, logos, and trademarks are the property of their respective official organizations. All content in this app — including practice questions, mock tests, study notes, exam details, and current affairs — is provided for general educational and preparation purposes only. It is aggregated from publicly available sources and may not always be accurate, complete, or up to date.\n\n" +
  "Always verify official notifications, eligibility, exam dates, syllabus, and results on the respective official government websites listed below before taking any action. Current affairs shown in this app are aggregated from public news sources — open each item and tap “Read at source” to view the original article.";

export type OfficialPortal = { name: string; url: string };

// Official (government / official recruitment body) source portals.
export const OFFICIAL_PORTALS: OfficialPortal[] = [
  { name: "National Portal of India", url: "https://www.india.gov.in" },
  { name: "Press Information Bureau (PIB)", url: "https://pib.gov.in" },
  { name: "Staff Selection Commission (SSC)", url: "https://ssc.gov.in" },
  { name: "Union Public Service Commission (UPSC)", url: "https://upsc.gov.in" },
  { name: "IBPS (Banking)", url: "https://www.ibps.in" },
  { name: "State Bank of India — Careers", url: "https://sbi.co.in/web/careers" },
  { name: "Railway Recruitment (RRB)", url: "https://www.rrbcdg.gov.in" },
  { name: "Karnataka PSC (KPSC)", url: "https://www.kpsc.kar.nic.in" },
  { name: "Karnataka Examinations Authority (KEA)", url: "https://cetonline.karnataka.gov.in" },
  { name: "Karnataka State Police", url: "https://www.ksp.karnataka.gov.in" },
];

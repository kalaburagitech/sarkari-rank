# Play Store "Misleading Claims" fix — DO THIS IN PLAY CONSOLE (not in the app)

> The rejection quotes your **Full description** as the evidence, and it is still the
> OLD text (no disclaimer, no source links). This is why it keeps getting rejected.
> **Fixing it = replacing the description text in Play Console.** A new AAB upload does
> NOT change the description. You must paste the text below into the store listing.

## Exact steps (5 minutes)
1. Go to **play.google.com/console** → select the **Astra Exam App** app (formerly SarkariRank).
2. Left menu: **Grow → Store presence → Main store listing** (or **Store settings → Main store listing**).
3. Find the **Full description** box. **Delete everything in it.**
4. **Paste the entire block below** (from the line `⚠️ DISCLAIMER…` to the end).
5. Also replace the **Short description** with the one-liner further down.
6. Click **Save**, then **Send for review** / **Submit update**.
7. In the policy rejection screen, click **Appeal / I've fixed the issue** and note that you
   added a clear "not a government entity" disclaimer and official government source links to
   the store description (and inside the app).

---

## ✅ FULL DESCRIPTION — copy everything below this line

⚠️ DISCLAIMER — NOT A GOVERNMENT APP: Astra Exam App is an INDEPENDENT educational and exam-preparation app. It is NOT affiliated with, endorsed by, authorized by, or associated with any government, government department, ministry, agency, board, commission, or official recruitment body. This app does NOT provide any government service, job, application, or recruitment. All exam names, logos, and trademarks are the property of their respective official organizations. All content is for general educational and preparation purposes only, is aggregated from publicly available sources, and may not always be accurate, complete, or current. Always verify official notifications, eligibility, exam dates, syllabus, admit cards, and results on the official government websites listed below.

Astra Exam App is a study and practice app to help you prepare for competitive exams — with mock tests, previous-year questions, study notes, and current affairs.

KEY FEATURES
📚 Mock tests & quizzes — real exam pattern, instant score & analysis
📝 Practice questions & previous-year question papers
📖 Study notes — subject & chapter wise (multi-language)
📊 Performance analysis — track progress and weak areas
📰 Current affairs — aggregated from public news sources; each item links to its original source

EXAMS YOU CAN PREPARE FOR
SSC (CGL, CHSL, MTS), UPSC, Banking (IBPS, SBI), Railways (RRB), Police, Defence, State PSC, Teacher Eligibility Tests (TET), and more.

✅ OFFICIAL GOVERNMENT SOURCES — please verify all official information directly on these official websites:
• National Portal of India — https://www.india.gov.in
• Staff Selection Commission (SSC) — https://ssc.gov.in
• Union Public Service Commission (UPSC) — https://upsc.gov.in
• Institute of Banking Personnel Selection (IBPS) — https://www.ibps.in
• State Bank of India (Careers) — https://sbi.bank.in/web/careers
• Railway Recruitment Boards (RRB) — https://www.rrbapply.gov.in
• Central Teacher Eligibility Test (CTET) — https://ctet.nic.in
• Government of Karnataka — https://karnataka.gov.in
• Karnataka Public Service Commission (KPSC) — https://kpsc.kar.nic.in
• Karnataka Examinations Authority (KEA) — https://cetonline.karnataka.gov.in/kea
• Karnataka State Police — https://ksp.karnataka.gov.in
• School Education Department, Karnataka — https://schooleducation.karnataka.gov.in

Astra Exam App is an independent preparation tool only and does not represent or act on behalf of any government entity. For any official process — applications, fees, admit cards, or results — always use the official government portals listed above.

## ✅ END OF FULL DESCRIPTION — copy everything above this line

---

## ✅ SHORT DESCRIPTION (max 80 chars) — paste in the Short description box
Independent exam-prep app — mock tests, PYQs & notes. Not a government app.

---

## Notes
- The disclaimer is the **first thing** in the description on purpose — Google wants an
  "easy-to-see" disclaimer. Do not move it below the features.
- Keep the official source links exactly as-is (they are the same `.gov` links shown on the
  in-app **About & Disclaimer** screen, so the store and app match).
- In-app (v1.0.11): every exam page now shows an **Official source** link right under the
  disclaimer, chosen from a verified list (`app/constants/legal.ts`) — the app never opens a
  raw website typed into the admin, so a dead link can't reach the reviewer. All links were
  opened in Oct 2026 from India and from a US network. Earlier builds showed some broken
  exam links (bbmp.gov.in, karunadu.karnataka.gov.in/hfw, schooleducation.kar.nic.in) and
  none at all for exams without a conducting body — the likely rejection cause.
- So: **upload the new AAB AND replace the description**, then reply to the rejection.
- If the app **name/subtitle** in Play Console still says "Government Exam Preparation App",
  that's fine as long as this disclaimer is present — but you may also soften it to
  "Exam Preparation App" if you want to be extra safe.

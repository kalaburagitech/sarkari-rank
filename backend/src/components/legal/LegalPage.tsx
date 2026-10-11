// Public pages linked from the Play Store listing (privacy policy, account
// deletion). Plain server components — no admin auth, no Convex calls.

export const SUPPORT_EMAIL = "kalaburagitech@gmail.com";
export const APP_NAME = "Astraa Exam App";
export const DEVELOPER = "KalaburagiTech";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <article className="mx-auto max-w-2xl rounded-2xl bg-white p-6 sm:p-10 shadow-sm border border-slate-100 text-slate-700 leading-relaxed [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-slate-900 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mt-1 [&_a]:text-indigo-700 [&_a]:underline">
        <p className="text-sm font-semibold text-indigo-700">{APP_NAME}</p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">Last updated: {updated}</p>
        <div className="mt-6">{children}</div>
      </article>
    </main>
  );
}

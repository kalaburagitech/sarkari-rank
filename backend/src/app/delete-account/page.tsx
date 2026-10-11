import type { Metadata } from "next";
import { LegalPage, SUPPORT_EMAIL, APP_NAME, DEVELOPER } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: `Delete your account — ${APP_NAME}` };

export default function DeleteAccountPage() {
  const subject = encodeURIComponent(`Delete my ${APP_NAME} account`);
  return (
    <LegalPage title="Delete your account" updated="11 October 2026">
      <p>You can ask {DEVELOPER} to delete your {APP_NAME} account and its data at any time.</p>

      <h2>How to request deletion</h2>
      <ol className="list-decimal pl-6 space-y-1">
        <li>
          Email <a href={`mailto:${SUPPORT_EMAIL}?subject=${subject}`}>{SUPPORT_EMAIL}</a> from the email address you
          registered with, with the subject &ldquo;Delete my {APP_NAME} account&rdquo;.
        </li>
        <li>We confirm the request and delete your account within 30 days.</li>
      </ol>

      <h2>What is deleted</h2>
      <ul>
        <li>Your account: name, email address and password hash.</li>
        <li>Your test attempts, scores, answers and leaderboard entries.</li>
        <li>Your bookmarks and the doubts you submitted.</li>
      </ul>

      <h2>What is kept</h2>
      <p>Nothing linked to you is kept. Data saved on your phone (downloaded questions, practice progress) is removed when you uninstall the app.</p>
    </LegalPage>
  );
}

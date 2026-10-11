import type { Metadata } from "next";
import { LegalPage, SUPPORT_EMAIL, APP_NAME, DEVELOPER } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: `Privacy Policy — ${APP_NAME}` };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="11 October 2026">
      <p>
        {APP_NAME} (&ldquo;the app&rdquo;) is an independent exam-preparation app published by {DEVELOPER}. This
        policy explains what information the app collects, why, and the choices you have. The app is{" "}
        <b>not affiliated with any government entity</b>.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li><b>Account details</b> — your name, email address and password when you register. Passwords are stored only as a one-way (bcrypt) hash.</li>
        <li><b>Learning activity</b> — tests you take, your answers, scores, accuracy, time taken, streak and leaderboard rank.</li>
        <li><b>Content you submit</b> — doubts/questions you send to us and items you bookmark.</li>
        <li><b>On-device data</b> — downloaded questions and your practice progress are saved on your phone so the app works offline. This stays on your device.</li>
      </ul>
      <p>We do <b>not</b> collect your location, contacts, photos, phone number, device identifiers or payment information. The app shows no ads and contains no third-party analytics or advertising SDKs.</p>

      <h2>How we use it</h2>
      <ul>
        <li>To sign you in and keep your progress across devices.</li>
        <li>To grade tests, show your results, analytics and leaderboard position.</li>
        <li>To answer doubts you send us.</li>
      </ul>
      <p>We do not sell or rent your personal information, and we do not use it for advertising.</p>

      <h2>Sharing and storage</h2>
      <p>
        Data is stored with our cloud database provider, Convex (convex.dev), which processes it on our behalf.
        Your name and score may appear on in-app leaderboards to other users. We disclose information only if
        required by law. All data is sent over encrypted (HTTPS) connections.
      </p>

      <h2>Retention and deletion</h2>
      <p>
        We keep your data while your account exists. You can ask us to delete your account and all associated
        data at any time — see <a href="/delete-account">Delete your account</a>. Uninstalling the app removes
        the data stored on your device.
      </p>

      <h2>Children</h2>
      <p>The app is intended for users aged 18 and over preparing for competitive examinations. We do not knowingly collect data from children under 13.</p>

      <h2>Changes</h2>
      <p>We may update this policy; the date above shows the latest version.</p>

      <h2>Contact</h2>
      <p>Questions or requests: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></p>
    </LegalPage>
  );
}

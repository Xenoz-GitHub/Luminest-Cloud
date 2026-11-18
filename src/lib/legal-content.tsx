import { APP_NAME, SUPPORT_EMAIL } from "@/lib/constants";

export interface LegalSection {
  heading: string;
  body: React.ReactNode;
}

/**
 * Single source of truth for the legal copy. The public /privacy and /terms
 * pages and the in-app /legal page all render these, so the wording can never
 * drift between them.
 */

export const PRIVACY_INTRO = `${APP_NAME} is a personal cloud library for your documents. This policy explains what we store, why we store it, and the control you have over it.`;

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    heading: "Information we collect",
    body: (
      <>
        <p>
          <strong className="text-ink">Account details:</strong> your email
          address, display name and avatar. If you sign in with Google, we
          receive your basic profile (name, email and picture) from Google.
        </p>
        <p>
          <strong className="text-ink">Your content:</strong> the files you
          upload, their metadata (name, type, size, dates), generated previews,
          extracted text, tags and folders.
        </p>
        <p>
          <strong className="text-ink">Usage data:</strong> AI credit usage,
          processing status and basic technical logs needed to keep the service
          secure and working.
        </p>
      </>
    ),
  },
  {
    heading: "How we use your information",
    body: (
      <>
        <p>We use your data only to operate the features you use:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>store and organize your files and folders;</li>
          <li>generate previews and extract text on your device or server;</li>
          <li>produce AI summaries you request;</li>
          <li>create and enforce the share links you choose to make;</li>
          <li>show your storage usage and preferences.</li>
        </ul>
        <p>We do not sell your data or use it for advertising.</p>
      </>
    ),
  },
  {
    heading: "Where your data is stored",
    body: (
      <p>
        Documents are stored in Supabase (PostgreSQL and private storage
        buckets) with Row Level Security, so only your account can read your
        rows and objects. Plain images are stored privately in ImageKit and are
        only readable through short-lived signed links. Connections are
        encrypted in transit.
      </p>
    ),
  },
  {
    heading: "AI processing and third parties",
    body: (
      <>
        <p>
          When you ask for a summary, the extracted text of that document is
          sent to the AI provider configured for this deployment (for example
          Google AI Studio, Groq, OpenRouter, Mistral or Cerebras). Those
          providers process the text to return a summary and are governed by
          their own privacy terms. Only the document you choose to summarize is
          sent.
        </p>
        <p>
          If no AI provider is available, a summary is generated locally in this
          application and no text leaves our servers.
        </p>
      </>
    ),
  },
  {
    heading: "Sharing you control",
    body: (
      <p>
        Files are private by default. We only expose a file publicly when you
        create a share link, and only until you revoke it or it expires. Share
        links use secure, signed tokens and can be password-protected.
      </p>
    ),
  },
  {
    heading: "Cookies and local storage",
    body: (
      <p>
        We use cookies for authentication and a small local storage entry for
        your theme and accent color. We do not use advertising or cross-site
        tracking cookies.
      </p>
    ),
  },
  {
    heading: "Retention and deletion",
    body: (
      <p>
        Your files stay until you delete them. Files in the bin are kept until
        you delete them permanently. Deleting a file removes its stored object
        and related previews, summaries and share links. You can request full
        account deletion by emailing {SUPPORT_EMAIL}.
      </p>
    ),
  },
  {
    heading: "Your rights",
    body: (
      <p>
        You can access, update or delete your content at any time in the app.
        You may also request a copy of your data or account deletion by
        contacting us at {SUPPORT_EMAIL}.
      </p>
    ),
  },
  {
    heading: "Children",
    body: (
      <p>
        {APP_NAME} is not directed at children under 13, and we do not knowingly
        collect their personal data.
      </p>
    ),
  },
  {
    heading: "Changes to this policy",
    body: (
      <p>
        We may update this policy as the app evolves. Material changes will be
        reflected by a new “last updated” date on this page.
      </p>
    ),
  },
];

export const TERMS_INTRO = `These terms govern your use of ${APP_NAME}. By creating an account or using the app, you agree to them.`;

export const TERMS_SECTIONS: LegalSection[] = [
  {
    heading: "Your account",
    body: (
      <p>
        You are responsible for keeping your login secure and for activity under
        your account. Provide accurate information and use one account per
        person. You must be at least 13 years old to use {APP_NAME}.
      </p>
    ),
  },
  {
    heading: "Acceptable use",
    body: (
      <>
        <p>You agree not to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>upload illegal, harmful or infringing content;</li>
          <li>attempt to access other users’ files or bypass security;</li>
          <li>use the service to send spam, malware or abuse share links;</li>
          <li>overload, scrape or disrupt the service or its providers.</li>
        </ul>
      </>
    ),
  },
  {
    heading: "Your content",
    body: (
      <p>
        You keep ownership of everything you upload. You grant us the limited
        permission needed to store, process, preview and (when you ask)
        summarize and share your files so we can provide the service.
      </p>
    ),
  },
  {
    heading: "AI summaries",
    body: (
      <p>
        AI summaries are generated automatically and may be incomplete or
        inaccurate. They are a convenience, not professional advice. Always
        check important details against the original document.
      </p>
    ),
  },
  {
    heading: "Sharing",
    body: (
      <p>
        You are responsible for the links you create and who you send them to.
        Anyone with a valid, unexpired link (and the password, if set) can view
        and, if allowed, download the shared file.
      </p>
    ),
  },
  {
    heading: "Usage limits",
    body: (
      <p>
        Free plans include a storage quota and a periodic AI credit budget that
        resets on a rolling window. Limits keep the service fair and may change
        as the product evolves.
      </p>
    ),
  },
  {
    heading: "Availability",
    body: (
      <p>
        The service is provided “as is.” We aim for high availability but do not
        guarantee uninterrupted access, and features may change or be
        withdrawn.
      </p>
    ),
  },
  {
    heading: "Suspension and termination",
    body: (
      <p>
        We may suspend or terminate accounts that break these terms or put the
        service or other users at risk. You may stop using {APP_NAME} at any
        time.
      </p>
    ),
  },
  {
    heading: "Limitation of liability",
    body: (
      <p>
        To the maximum extent permitted by law, {APP_NAME} is not liable for
        indirect or consequential damages, or for loss of data you did not back
        up elsewhere.
      </p>
    ),
  },
  {
    heading: "Changes to these terms",
    body: (
      <p>
        We may update these terms as the app changes. Continued use after an
        update means you accept the revised terms. Questions? Email{" "}
        {SUPPORT_EMAIL}.
      </p>
    ),
  },
];

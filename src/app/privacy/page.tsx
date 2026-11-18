import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { APP_NAME, LEGAL_UPDATED } from "@/lib/constants";
import { PRIVACY_INTRO, PRIVACY_SECTIONS } from "@/lib/legal-content";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${APP_NAME} collects, uses and protects your data.`,
};

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      updated={LEGAL_UPDATED}
      intro={PRIVACY_INTRO}
      sections={PRIVACY_SECTIONS}
      otherHref="/terms"
      otherLabel="Read the Terms of Service"
    />
  );
}

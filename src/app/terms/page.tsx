import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { APP_NAME, LEGAL_UPDATED } from "@/lib/constants";
import { TERMS_INTRO, TERMS_SECTIONS } from "@/lib/legal-content";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `The rules for using ${APP_NAME}.`,
};

export default function TermsPage() {
  return (
    <LegalDocument
      title="Terms of Service"
      updated={LEGAL_UPDATED}
      intro={TERMS_INTRO}
      sections={TERMS_SECTIONS}
      otherHref="/privacy"
      otherLabel="Read the Privacy Policy"
    />
  );
}

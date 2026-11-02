import React from "react";
import { LegalDocumentScreen } from "@/src/legal/LegalDocumentScreen";
import { TERMS } from "@/src/legal/content";

export default function TermsScreen() {
  return <LegalDocumentScreen document={TERMS} />;
}

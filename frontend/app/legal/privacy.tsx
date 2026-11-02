import React from "react";
import { LegalDocumentScreen } from "@/src/legal/LegalDocumentScreen";
import { PRIVACY_POLICY } from "@/src/legal/content";

export default function PrivacyPolicyScreen() {
  return <LegalDocumentScreen document={PRIVACY_POLICY} />;
}

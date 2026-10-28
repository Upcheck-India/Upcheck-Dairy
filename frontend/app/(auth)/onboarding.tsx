import React from "react";
import PhoneSetupScreen from "@/screens/onboarding/PhoneSetupScreen";

/**
 * Onboarding is a single step: the phone number.
 *
 * It used to be a five-step wizard collecting farm name, owner name, phone,
 * village, district, state and permissions. Sign-in already supplies the
 * identity, `/farms` already creates the first farm, and village/district fed
 * nothing but the gate that demanded them — so only the phone number was ever
 * genuinely new information.
 *
 * The wizard screens remain under `screens/onboarding/` and
 * `components/onboarding/` for a fuller profile flow later; nothing renders
 * them today.
 */
export default function OnboardingScreen() {
  return <PhoneSetupScreen />;
}

import React from "react";
import { OnboardingProvider, useOnboarding } from "@/context/OnboardingContext";
import WelcomeScreen from "@/screens/onboarding/WelcomeScreen";
import FarmDetailsScreen from "@/screens/onboarding/FarmDetailsScreen";
import LocationScreen from "@/screens/onboarding/LocationScreen";
import PermissionScreen from "@/screens/onboarding/PermissionScreen";
import SuccessScreen from "@/screens/onboarding/SuccessScreen";

function OnboardingFlowContent() {
  const { currentStep } = useOnboarding();

  switch (currentStep) {
    case 0:
      return <WelcomeScreen />;
    case 1:
      return <FarmDetailsScreen />;
    case 2:
      return <LocationScreen />;
    case 3:
      return <PermissionScreen />;
    case 4:
      return <SuccessScreen />;
    default:
      return <WelcomeScreen />;
  }
}

export default function OnboardingScreen() {
  return (
    <OnboardingProvider>
      <OnboardingFlowContent />
    </OnboardingProvider>
  );
}

"use client";

import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default function OnboardingPage() {
  return (
    <div className="aurora-bg bg-dot-grid bg-noise relative min-h-screen overflow-hidden">
      <div className="gradient-orb gradient-orb-blue float-slow absolute -top-32 -left-32 h-96 w-96" />
      <div
        className="gradient-orb gradient-orb-purple float-slow absolute -bottom-32 -right-32 h-96 w-96"
        style={{ animationDelay: "-4s" }}
      />

      <div className="relative z-10 py-8">
        <OnboardingWizard />
      </div>
    </div>
  );
}

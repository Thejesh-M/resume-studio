import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Get Started",
  description: "Set up your first resume in Open Resume Studio.",
};

export default function OnboardingLayout({ children }: { readonly children: ReactNode }) {
  return children;
}

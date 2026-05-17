import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Cover Letter",
  description: "Generate a tailored cover letter from your resume and job description.",
};

export default function CoverLetterLayout({ children }: { readonly children: ReactNode }) {
  return children;
}

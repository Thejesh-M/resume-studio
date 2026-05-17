import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "My Resumes",
  description: "Manage your base resumes and create tailored versions.",
};

export default function ResumesLayout({ children }: { readonly children: ReactNode }) {
  return children;
}

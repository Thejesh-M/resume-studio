import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your resume overview — credits, resumes, and quick actions.",
};

export default function DashboardLayout({ children }: { readonly children: ReactNode }) {
  return children;
}

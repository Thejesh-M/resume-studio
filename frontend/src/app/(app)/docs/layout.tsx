import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Docs",
  description: "Overview, setup, and template attribution for Open Resume Studio.",
};

export default function DocsLayout({ children }: { readonly children: ReactNode }) {
  return children;
}

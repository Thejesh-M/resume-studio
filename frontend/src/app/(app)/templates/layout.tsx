import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Templates",
  description: "Browse and apply resume templates.",
};

export default function TemplatesLayout({ children }: { readonly children: ReactNode }) {
  return children;
}

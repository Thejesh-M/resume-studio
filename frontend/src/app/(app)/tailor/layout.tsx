import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tailor Resume",
  description:
    "Paste a job description and tailor your resume with AI in a single click.",
};

export default function TailorLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return children;
}

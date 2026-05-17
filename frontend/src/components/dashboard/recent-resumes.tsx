"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResumeCard } from "@/components/resume/resume-card";
import { ROUTES } from "@/lib/constants";
import type { UserResume } from "@/types/resume";

interface RecentResumesProps {
  readonly resumes: readonly UserResume[];
}

export function RecentResumes({ resumes }: RecentResumesProps) {
  const recent = resumes.slice(0, 3);
  if (recent.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">Recent resumes</h2>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href={ROUTES.RESUMES} />}
          className="text-[oklch(0.45_0.2_260)] hover:text-[oklch(0.4_0.2_260)]"
        >
          View all
          <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {recent.map((resume) => (
          <ResumeCard key={resume.id} resume={resume} />
        ))}
      </div>
    </section>
  );
}

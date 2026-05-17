"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StreamlinedWorkspace } from "@/components/tailoring/streamlined-workspace";
import { useResume } from "@/hooks/use-resumes";
import { ROUTES } from "@/lib/constants";

interface TailorPageProps {
  readonly params: Promise<{ resumeId: string }>;
}

export default function TailorPage({ params }: TailorPageProps) {
  const { resumeId } = use(params);
  const { data: resume } = useResume(resumeId);

  return (
    <div className="space-y-6">
      {/* Gradient accent bar */}
      <div className="h-1 bg-gradient-to-r from-[oklch(0.55_0.2_260)] to-[oklch(0.55_0.2_300)] rounded-full mb-6" />

      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href={ROUTES.RESUME_DETAIL(resumeId)} />}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Resume
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Tailor Resume</h1>
          <p className="text-sm text-muted-foreground">
            Paste a job description and tailor your resume with AI.
          </p>
        </div>
      </div>

      {resume?.isRawUpload ? (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-border/60 bg-muted/20 p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[oklch(0.55_0.2_260_/_15%)] to-[oklch(0.55_0.2_300_/_15%)]">
            <FileUp className="h-5 w-5 text-[oklch(0.45_0.2_260)]" />
          </div>
          <div>
            <p className="text-sm font-medium">This resume is an uploaded PDF.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tailoring rewrites structured content — uploaded PDFs are submitted as-is during auto-apply.
              To tailor, build an editable resume from your PDF via the onboarding flow.
            </p>
          </div>
          <Button
            nativeButton={false}
            render={<Link href={ROUTES.ONBOARDING} />}
            className="mt-1"
          >
            Build an editable version
          </Button>
        </div>
      ) : (
        <StreamlinedWorkspace resumeId={resumeId} />
      )}
    </div>
  );
}

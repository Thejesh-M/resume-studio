"use client";

import { use } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResumeEditorShell } from "@/components/resume-editor/resume-editor-shell";
import { useResume } from "@/hooks/use-resumes";
import { ROUTES } from "@/lib/constants";

interface ResumeEditorPageProps {
  readonly params: Promise<{ resumeId: string }>;
}

export default function ResumeEditorPage({ params }: ResumeEditorPageProps) {
  const { resumeId } = use(params);
  const { data: resume, isLoading } = useResume(resumeId);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-sm text-muted-foreground">Resume not found.</p>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={ROUTES.RESUMES} />}
        >
          Back to Resumes
        </Button>
      </div>
    );
  }

  return <ResumeEditorShell resume={resume} />;
}

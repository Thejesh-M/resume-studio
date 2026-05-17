"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResumeEditorShell } from "@/components/resume-editor/resume-editor-shell";
import { useResumes, useResume } from "@/hooks/use-resumes";
import { ROUTES } from "@/lib/constants";

export default function EditorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: resumes = [], isLoading: resumesLoading } = useResumes();

  // Determine which resume to open: ?resumeId param → default → first
  const [selectedId, setSelectedId] = useState<string | null>(
    searchParams.get("resumeId")
  );

  // Once resumes load, fall back to default/first if no selection
  useEffect(() => {
    if (resumesLoading || resumes.length === 0) return;
    if (selectedId && resumes.some((r) => r.id === selectedId)) return;
    const def = resumes.find((r) => r.isDefault) ?? resumes[0];
    setSelectedId(def.id);
  }, [resumesLoading, resumes, selectedId]);

  // Keep the URL in sync (shallow replace — no history entry)
  useEffect(() => {
    if (!selectedId) return;
    const current = searchParams.get("resumeId");
    if (current !== selectedId) {
      router.replace(`${ROUTES.EDITOR}?resumeId=${selectedId}`, { scroll: false });
    }
  }, [selectedId, searchParams, router]);

  const { data: resume, isLoading: resumeLoading } = useResume(selectedId);

  const isLoading = resumesLoading || resumeLoading;

  if (isLoading) {
    return (
      <div className="-mx-6 -mt-6 -mb-6 flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (resumes.length === 0) {
    return (
      <div className="-mx-6 -mt-6 -mb-6 flex h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-4">
        <p className="text-sm text-muted-foreground">
          You don&apos;t have any resumes yet.
        </p>
        <Button
          nativeButton={false}
          render={<Link href={ROUTES.ONBOARDING} />}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Create your first resume
        </Button>
      </div>
    );
  }

  if (!resume) return null;

  if (resume.isRawUpload) {
    return (
      <div className="-mx-6 -mt-6 -mb-6 flex h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-base font-medium">&quot;{resume.title}&quot; is an uploaded PDF.</p>
        <p className="max-w-md text-sm text-muted-foreground">
          The AI editor works on structured resume content. Uploaded PDFs are kept as-is for auto-apply.
          To use the editor, build an editable version from this PDF via onboarding.
        </p>
        <Button nativeButton={false} render={<Link href={ROUTES.ONBOARDING} />}>
          Build an editable version
        </Button>
      </div>
    );
  }

  return (
    <ResumeEditorShell
      key={resume.id}
      resume={resume}
      allResumes={resumes}
      onResumeChange={setSelectedId}
    />
  );
}

"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Target, Loader2, Star, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ResumeContentEditor } from "@/components/resume/resume-content-editor";
import { useResume, useUpdateResume } from "@/hooks/use-resumes";
import { ROUTES } from "@/lib/constants";

interface ResumeDetailPageProps {
  readonly params: Promise<{ resumeId: string }>;
}

export default function ResumeDetailPage({ params }: ResumeDetailPageProps) {
  const { resumeId } = use(params);
  const { data: resume, isLoading } = useResume(resumeId);
  const updateMutation = useUpdateResume();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");

  function startEditTitle() {
    if (!resume) return;
    setTitleDraft(resume.title);
    setIsEditingTitle(true);
  }

  async function saveTitle() {
    if (!resume) return;
    const trimmed = titleDraft.trim();
    if (!trimmed || trimmed === resume.title) {
      setIsEditingTitle(false);
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id: resumeId,
        payload: { title: trimmed },
      });
      toast.success("Title updated.");
    } catch {
      toast.error("Failed to update title.");
    }
    setIsEditingTitle(false);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="mb-4 text-sm text-muted-foreground">Resume not found.</p>
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

  return (
    <div className="space-y-6">
      {/* Gradient accent bar */}
      <div className="h-1 bg-gradient-to-r from-[oklch(0.55_0.2_260)] to-[oklch(0.55_0.2_300)] rounded-full mb-6" />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            nativeButton={false}
            render={<Link href={ROUTES.RESUMES} />}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <Label className="sr-only">Resume title</Label>
                <Input
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void saveTitle();
                    if (e.key === "Escape") setIsEditingTitle(false);
                  }}
                  className="h-8 text-lg font-bold"
                  autoFocus
                />
                <Button size="sm" onClick={() => void saveTitle()}>
                  Save
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={startEditTitle}
                className="text-left text-2xl font-bold hover:underline"
              >
                {resume.title}
              </button>
            )}
            <p className="text-xs text-muted-foreground">
              Last updated{" "}
              {new Date(resume.updatedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!resume.isDefault && (
            <Button
              variant="outline"
              onClick={() => {
                void updateMutation
                  .mutateAsync({
                    id: resumeId,
                    payload: { isDefault: true },
                  })
                  .then(() => toast.success("Set as default resume."));
              }}
              disabled={updateMutation.isPending}
            >
              <Star className="mr-1.5 h-4 w-4" />
              Set as Default
            </Button>
          )}
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={ROUTES.RESUME_EDITOR(resumeId)} />}
            className="border-[oklch(0.55_0.2_260_/_30%)] bg-[oklch(0.55_0.2_260_/_5%)] text-[oklch(0.45_0.2_260)] hover:bg-[oklch(0.55_0.2_260_/_10%)]"
          >
            <Sparkles className="mr-1.5 h-4 w-4" />
            AI Editor
          </Button>
          <Button
            nativeButton={false}
            render={<Link href={ROUTES.RESUME_TAILOR(resumeId)} />}
          >
            <Target className="mr-1.5 h-4 w-4" />
            Tailor for Job
          </Button>
        </div>
      </div>

      {/* Content editor — only for structured resumes; raw uploads have no content to edit. */}
      {resume.content ? (
        <ResumeContentEditor resumeId={resumeId} content={resume.content} />
      ) : (
        <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          This resume is an uploaded PDF. There&apos;s nothing to edit here — open the preview or download the file.
        </div>
      )}
    </div>
  );
}

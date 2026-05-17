"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Wand2, Upload, FileUp } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useResumes } from "@/hooks/use-resumes";
import { StreamlinedWorkspace } from "@/components/tailoring/streamlined-workspace";
import { ROUTES } from "@/lib/constants";

export default function TailorPage() {
  const router = useRouter();
  const { data: resumes = [], isLoading } = useResumes();
  const defaultResume = resumes.find((r) => r.isDefault) ?? resumes[0];
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const resumeId = selectedResumeId || defaultResume?.id || "";

  // After returning from onboarding with a new resume, auto-select it
  const [notified, setNotified] = useState(false);
  useEffect(() => {
    if (!notified && !isLoading && resumes.length > 0) {
      const params = new URLSearchParams(window.location.search);
      if (params.get("from") === "onboarding") {
        toast.success("Resume uploaded! Now paste a job description to tailor it.");
        setNotified(true);
        // Clean the URL
        window.history.replaceState({}, "", ROUTES.TAILOR);
      }
    }
  }, [isLoading, resumes.length, notified]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (resumes.length === 0) {
    return (
      <div className="space-y-6">
        <Header />
        <div className="flex flex-col items-center justify-center gap-5 rounded-xl border border-dashed border-border/60 bg-muted/20 py-16 px-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[oklch(0.55_0.2_260_/_10%)]">
            <Wand2 className="h-8 w-8 text-[oklch(0.45_0.2_260)]" />
          </div>
          <div className="max-w-sm text-center">
            <p className="text-lg font-semibold">Upload a resume first</p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              You need at least one base resume before you can tailor it for a
              job description. Upload your resume and we&apos;ll bring you right back.
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => router.push(`${ROUTES.ONBOARDING}?returnTo=${encodeURIComponent(ROUTES.TAILOR + "?from=onboarding")}`)}
            className="bg-gradient-to-r from-[oklch(0.45_0.2_260)] to-[oklch(0.45_0.2_300)] text-white shadow-md"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Your Resume
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header />

      {/* Resume selector */}
      {resumes.length > 1 && (() => {
        const selectedResume = resumes.find((r) => r.id === resumeId);
        const displayLabel = selectedResume
          ? `${selectedResume.title}${selectedResume.isDefault ? " (default)" : ""}`
          : "Select a resume";

        return (
          <div className="max-w-sm space-y-1.5">
            <Label>Resume to tailor</Label>
            <Select
              value={resumeId}
              onValueChange={(val) => setSelectedResumeId(val ?? "")}
            >
              <SelectTrigger className="w-full">
                <span>{displayLabel}</span>
              </SelectTrigger>
              <SelectContent>
                {resumes.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.title}
                    {r.isDefault ? " (default)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      })()}

      {/* Single-resume indicator */}
      {resumes.length === 1 && (
        <p className="text-sm text-muted-foreground">
          Using: <span className="font-medium text-foreground">{defaultResume?.title}</span>
        </p>
      )}

      {resumeId && (() => {
        const selected = resumes.find((r) => r.id === resumeId);
        if (selected?.isRawUpload) {
          return (
            <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border/60 bg-muted/20 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[oklch(0.55_0.2_260_/_15%)] to-[oklch(0.55_0.2_300_/_15%)]">
                <FileUp className="h-5 w-5 text-[oklch(0.45_0.2_260)]" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  &quot;{selected.title}&quot; is an uploaded PDF.
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tailoring rewrites structured resume content — uploaded PDFs are submitted as-is during auto-apply.
                  Pick a different resume above, or build an editable version via onboarding.
                </p>
              </div>
            </div>
          );
        }
        return <StreamlinedWorkspace key={resumeId} resumeId={resumeId} />;
      })()}
    </div>
  );
}

function Header() {
  return (
    <div>
      <div className="h-1 bg-gradient-to-r from-[oklch(0.55_0.2_260)] to-[oklch(0.55_0.2_300)] rounded-full mb-6" />
      <h1 className="text-2xl font-bold bg-gradient-to-r from-[oklch(0.45_0.2_260)] to-[oklch(0.45_0.2_300)] bg-clip-text text-transparent">
        Tailor Your Resume
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Paste a job description, click tailor, and download your optimized resume.
      </p>
    </div>
  );
}

"use client";

import { FileUpload } from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, ArrowRight, SkipForward } from "lucide-react";
import { useUploadAndExtract } from "@/hooks/use-resumes";
import type { ResumeContent } from "@/types/resume";

interface StepUploadResumeProps {
  readonly file: File | null;
  readonly extractedContent: ResumeContent | null;
  readonly onFileSelected: (file: File) => void;
  readonly onContentExtracted: (content: ResumeContent, extractionId: string) => void;
  readonly onNext: () => void;
  readonly onSkip: () => void;
}

export function StepUploadResume({
  file,
  extractedContent,
  onFileSelected,
  onContentExtracted,
  onNext,
  onSkip,
}: StepUploadResumeProps) {
  const uploadMutation = useUploadAndExtract();

  async function handleFileSelect(selectedFile: File) {
    onFileSelected(selectedFile);
    try {
      const result = await uploadMutation.mutateAsync(selectedFile);
      onContentExtracted(result.content, result.extractionId);
    } catch {
      // Error state is surfaced via uploadMutation.isError
    }
  }

  const isExtracting = uploadMutation.isPending;
  const hasContent = extractedContent !== null;

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Upload your existing resume</CardTitle>
        <CardDescription>
          We&apos;ll extract your content and drop it into a professional,
          ATS-optimized template. You can also skip this and start from scratch.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FileUpload
          onFileSelect={(f) => void handleFileSelect(f)}
          disabled={isExtracting}
        />

        {isExtracting && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Extracting the content, takes a few seconds&hellip;
          </div>
        )}

        {uploadMutation.isError && (
          <p className="text-center text-sm text-destructive">
            Failed to extract content. Please try a different file.
          </p>
        )}

        {hasContent && (
          <div className="rounded-lg border bg-green-50 p-3 text-center text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
            Content extracted from{" "}
            <span className="font-medium">{file?.name}</span>. Ready to
            continue!
          </div>
        )}

        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onSkip}>
            <SkipForward className="mr-1.5 h-4 w-4" />
            Skip &mdash; start from scratch
          </Button>
          <Button onClick={onNext} disabled={!hasContent}>
            Continue
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

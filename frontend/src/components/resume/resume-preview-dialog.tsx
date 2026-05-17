"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Download, Sparkles, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCompileResume } from "@/hooks/use-resumes";
import { ROUTES } from "@/lib/constants";
import type { UserResume } from "@/types/resume";

interface ResumePreviewDialogProps {
  readonly resume: UserResume;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function ResumePreviewDialog({
  resume,
  open,
  onOpenChange,
}: ResumePreviewDialogProps) {
  const compileMutation = useCompileResume();
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const prevBlobUrl = useRef<string | null>(null);

  // Compile when dialog opens, clean up blob URL on close
  useEffect(() => {
    if (!open) {
      setBlobUrl(null);
      setError(false);
      if (prevBlobUrl.current && prevBlobUrl.current.startsWith("blob:")) {
        URL.revokeObjectURL(prevBlobUrl.current);
      }
      prevBlobUrl.current = null;
      return;
    }

    // Raw uploads have a stored PDF — point the viewer at it directly.
    if (resume.isRawUpload) {
      if (resume.basePdfUrl) {
        setError(false);
        setBlobUrl(resume.basePdfUrl);
      } else {
        setError(true);
      }
      return;
    }

    if (!resume.content) {
      setError(true);
      return;
    }

    setError(false);
    compileMutation.mutate(
      { id: resume.id, content: resume.content },
      {
        onSuccess(blob) {
          if (blob.size === 0) {
            // Mock mode — no real PDF
            setError(true);
            return;
          }
          if (prevBlobUrl.current && prevBlobUrl.current.startsWith("blob:")) {
            URL.revokeObjectURL(prevBlobUrl.current);
          }
          const url = URL.createObjectURL(blob);
          prevBlobUrl.current = url;
          setBlobUrl(url);
        },
        onError() {
          setError(true);
        },
      }
    );
    // Only re-run when the dialog opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleDownload() {
    if (!blobUrl) return;
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `${resume.title}.pdf`;
    a.click();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex h-[90vh] w-[90vw] max-w-5xl flex-col gap-0 p-0"
        showCloseButton
      >
        <DialogHeader className="flex-row items-center justify-between gap-3 border-b border-border/50 px-5 py-3">
          <div className="min-w-0">
            <DialogTitle className="truncate">{resume.title}</DialogTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {resume.content?.contact.name || "PDF Preview"}
            </p>
          </div>
        </DialogHeader>

        {/* PDF area */}
        <div className="relative min-h-0 flex-1 bg-muted/20">
          {compileMutation.isPending && (
            <div className="flex h-full flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-[oklch(0.55_0.2_260)]" />
              <p className="text-xs text-muted-foreground">Generating preview…</p>
            </div>
          )}

          {error && !compileMutation.isPending && (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <AlertCircle className="h-8 w-8 opacity-40" />
              <p className="text-sm">Could not generate preview.</p>
              <p className="text-xs opacity-70">
                Make sure the backend is running.
              </p>
            </div>
          )}

          {blobUrl && !compileMutation.isPending && (
            <iframe
              title={`Preview of ${resume.title}`}
              src={blobUrl}
              className="h-full w-full border-0"
            />
          )}
        </div>

        <DialogFooter className="flex-row items-center justify-between gap-2 border-t border-border/50 bg-background px-5 py-3">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={!blobUrl}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Download PDF
            </Button>
          </div>
          <Button
            size="sm"
            className="bg-gradient-to-r from-[oklch(0.45_0.2_260)] to-[oklch(0.45_0.2_300)] text-white hover:opacity-90"
            nativeButton={false}
            render={<Link href={ROUTES.RESUME_EDITOR(resume.id)} />}
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Open in AI Editor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

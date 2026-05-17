"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Plus, Loader2, Upload, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResumeCard } from "@/components/resume/resume-card";
import {
  useResumes,
  useDeleteResume,
  useUpdateResume,
  useUploadRawPdfResume,
  useCopyResume,
} from "@/hooks/use-resumes";
import { ROUTES } from "@/lib/constants";
import { toast } from "sonner";

export default function ResumesPage() {
  const { data: resumes, isLoading, isError } = useResumes();
  const deleteMutation = useDeleteResume();
  const updateMutation = useUpdateResume();
  const uploadRawMutation = useUploadRawPdfResume();
  const copyMutation = useCopyResume();

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function handleDelete(id: string) {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Resume deleted."),
      onError: () => toast.error("Failed to delete resume."),
    });
  }

  function handleSetDefault(id: string) {
    updateMutation.mutate(
      { id, payload: { isDefault: true } },
      {
        onSuccess: () => toast.success("Set as default resume."),
        onError: () => toast.error("Failed to update default."),
      }
    );
  }

  function handleCopy(id: string) {
    const source = resumes?.find((r) => r.id === id);
    if (!source) return;
    copyMutation.mutate(
      { id, title: `Copy of ${source.title}` },
      {
        onSuccess: () => toast.success("Resume copied."),
        onError: () => toast.error("Failed to copy resume."),
      }
    );
  }

  function resetUpload() {
    setUploadTitle("");
    setUploadFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleUploadSubmit() {
    if (!uploadFile) {
      toast.error("Choose a PDF file.");
      return;
    }
    if (uploadFile.type !== "application/pdf") {
      toast.error("Only PDF files are supported.");
      return;
    }
    const title = uploadTitle.trim() || uploadFile.name.replace(/\.pdf$/i, "");
    uploadRawMutation.mutate(
      { title, file: uploadFile },
      {
        onSuccess: () => {
          toast.success("Resume uploaded.");
          setUploadOpen(false);
          resetUpload();
        },
        onError: (err) => {
          const msg = err instanceof Error ? err.message : "Upload failed.";
          toast.error(msg);
        },
      }
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative flex items-center justify-between overflow-hidden rounded-xl bg-gradient-to-r from-[oklch(0.55_0.2_260_/_8%)] via-[oklch(0.55_0.2_280_/_5%)] to-[oklch(0.55_0.2_300_/_8%)] p-6">
        <div className="gradient-orb gradient-orb-purple absolute -top-16 -right-16 h-32 w-32 opacity-30" />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold">My Resumes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your base resumes. Tailor them for specific job postings, or upload a polished PDF to use as-is.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setUploadOpen(true)}
          >
            <FileUp className="mr-1.5 h-4 w-4" />
            Upload PDF
          </Button>
          <Button
            nativeButton={false}
            render={<Link href={ROUTES.ONBOARDING} />}
            className="bg-gradient-to-r from-[oklch(0.45_0.2_260)] to-[oklch(0.45_0.2_300)] text-white shadow-sm hover:shadow-md"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            New Resume
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20">
          <p className="text-sm text-destructive">
            Failed to load resumes. Please try again.
          </p>
        </div>
      ) : !resumes || resumes.length === 0 ? (
        <div className="relative flex flex-col items-center justify-center rounded-lg border border-dashed py-20">
          <div className="gradient-orb gradient-orb-teal absolute top-1/2 left-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2" />
          <p className="relative z-10 mb-4 text-sm text-muted-foreground">
            No resumes yet. Upload a PDF or build one from scratch.
          </p>
          <div className="relative z-10 flex items-center gap-2">
            <Button variant="outline" onClick={() => setUploadOpen(true)}>
              <FileUp className="mr-1.5 h-4 w-4" />
              Upload PDF
            </Button>
            <Button
              nativeButton={false}
              render={<Link href={ROUTES.ONBOARDING} />}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Build a Resume
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Add new resume card — always first */}
          <Link
            href={ROUTES.ONBOARDING}
            className="group flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/50 bg-muted/20 text-muted-foreground transition-all duration-200 hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-dashed border-current transition-colors">
              <Plus className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium">Add New Resume</span>
          </Link>

          {resumes.map((resume) => (
            <ResumeCard
              key={resume.id}
              resume={resume}
              onDelete={handleDelete}
              onCopy={handleCopy}
              onSetDefault={handleSetDefault}
            />
          ))}
        </div>
      )}

      <Dialog
        open={uploadOpen}
        onOpenChange={(open) => {
          setUploadOpen(open);
          if (!open) resetUpload();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload a PDF resume</DialogTitle>
            <DialogDescription>
              Your PDF will be stored as-is. If you set it as default, auto-apply submits this file unchanged — no tailoring, no edits.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="upload-title">Title</Label>
              <Input
                id="upload-title"
                placeholder={uploadFile ? uploadFile.name.replace(/\.pdf$/i, "") : "e.g. Jane Doe — Senior Engineer"}
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="upload-file">PDF file</Label>
              <div className="flex items-center gap-2">
                <input
                  id="upload-file"
                  type="file"
                  accept="application/pdf"
                  ref={fileInputRef}
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                  className="block w-full cursor-pointer rounded-md border border-border bg-background px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-muted file:px-2 file:py-1 file:text-xs file:text-foreground hover:bg-muted/40"
                />
              </div>
              {uploadFile && (
                <p className="text-xs text-muted-foreground">
                  {uploadFile.name} · {(uploadFile.size / 1024 / 1024).toFixed(1)} MB
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUploadOpen(false);
                resetUpload();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUploadSubmit}
              disabled={!uploadFile || uploadRawMutation.isPending}
              className="bg-gradient-to-r from-[oklch(0.45_0.2_260)] to-[oklch(0.45_0.2_300)] text-white"
            >
              {uploadRawMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload className="mr-1.5 h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

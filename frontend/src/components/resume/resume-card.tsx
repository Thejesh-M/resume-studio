"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, FileUp, Star, MoreVertical, Pencil, Trash2, Target, Copy, StarOff, Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResumePreviewDialog } from "./resume-preview-dialog";
import { useCompileResume } from "@/hooks/use-resumes";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROUTES } from "@/lib/constants";
import type { UserResume } from "@/types/resume";

interface ResumeCardProps {
  readonly resume: UserResume;
  readonly onDelete?: (id: string) => void;
  readonly onCopy?: (id: string) => void;
  readonly onSetDefault?: (id: string) => void;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ResumeCard({ resume, onDelete, onCopy, onSetDefault }: ResumeCardProps) {
  const router = useRouter();
  const [previewOpen, setPreviewOpen] = useState(false);
  const compileMutation = useCompileResume();

  async function handleDownload() {
    // Raw uploads: just stream the stored PDF.
    if (resume.isRawUpload) {
      if (resume.basePdfUrl) window.open(resume.basePdfUrl, "_blank", "noopener,noreferrer");
      return;
    }
    if (!resume.content) return;
    const blob = await compileMutation.mutateAsync({ id: resume.id, content: resume.content });
    if (blob.size === 0) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${resume.title}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const allSkills = resume.content?.skills.flatMap((g) => g.items ?? []) ?? [];
  const skillCount = allSkills.length;
  const expCount = resume.content?.experience.length ?? 0;
  const contactName = resume.content?.contact.name ?? "";

  return (
    <Card className="group relative border-border/50 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      {/* Always-visible actions menu, pinned top-right so it never fights the badges for space */}
      <div className="absolute right-3 top-3 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Resume actions"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onClick={() => setPreviewOpen(true)}
              className="flex items-center gap-2"
            >
              <Eye className="h-3.5 w-3.5" />
              Preview
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => void handleDownload()}
              disabled={compileMutation.isPending}
              className="flex items-center gap-2"
            >
              <Download className="h-3.5 w-3.5" />
              {compileMutation.isPending ? "Downloading…" : "Download PDF"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push(ROUTES.RESUME_DETAIL(resume.id))}
              className="flex items-center gap-2"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push(ROUTES.RESUME_TAILOR(resume.id))}
              className="flex items-center gap-2"
            >
              <Target className="h-3.5 w-3.5" />
              Tailor
            </DropdownMenuItem>
            {onCopy && (
              <DropdownMenuItem
                onClick={() => onCopy(resume.id)}
                className="flex items-center gap-2"
              >
                <Copy className="h-3.5 w-3.5" />
                Make a copy
              </DropdownMenuItem>
            )}
            {onSetDefault && !resume.isDefault && (
              <DropdownMenuItem
                onClick={() => onSetDefault(resume.id)}
                className="flex items-center gap-2"
              >
                <Star className="h-3.5 w-3.5" />
                Set as default
              </DropdownMenuItem>
            )}
            {resume.isDefault && (
              <DropdownMenuItem disabled className="flex items-center gap-2 opacity-50">
                <StarOff className="h-3.5 w-3.5" />
                Already default
              </DropdownMenuItem>
            )}
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(resume.id)}
                  className="flex items-center gap-2 text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CardHeader className="flex flex-row items-start justify-between gap-2 pr-10">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[oklch(0.55_0.2_260)] to-[oklch(0.55_0.2_300)] shadow-sm">
            {resume.isRawUpload ? (
              <FileUp className="h-5 w-5 text-white" />
            ) : (
              <FileText className="h-5 w-5 text-white" />
            )}
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base">
              <Link
                href={ROUTES.RESUME_DETAIL(resume.id)}
                className="hover:text-[oklch(0.45_0.2_260)] hover:underline"
              >
                {resume.title}
              </Link>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Updated {formatDate(resume.updatedAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {resume.isRawUpload && (
            <Badge variant="outline" className="gap-1 border-[oklch(0.55_0.18_160_/_30%)] bg-[oklch(0.55_0.18_160_/_5%)] text-[10px] text-[oklch(0.4_0.18_160)]">
              <FileUp className="h-2.5 w-2.5" />
              Uploaded PDF
            </Badge>
          )}
          {resume.isDefault && (
            <Badge variant="outline" className="gap-1 border-[oklch(0.55_0.2_260_/_30%)] bg-[oklch(0.55_0.2_260_/_5%)] text-[10px] text-[oklch(0.45_0.2_260)]">
              <Star className="h-2.5 w-2.5" />
              Default
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {resume.isRawUpload ? (
          <p className="text-xs text-muted-foreground">
            Uploaded PDF — submitted as-is during auto-apply (no tailoring).
          </p>
        ) : (
          <>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{contactName}</span>
              <span className="text-border">&middot;</span>
              <span>{expCount} experience{expCount !== 1 ? "s" : ""}</span>
              <span className="text-border">&middot;</span>
              <span>{skillCount} skills</span>
            </div>

            <div className="mt-3 flex flex-wrap gap-1">
              {allSkills.slice(0, 6).map((skill) => (
                <Badge key={skill} variant="outline" className="border-border/50 bg-muted/30 text-[10px]">
                  {skill}
                </Badge>
              ))}
              {skillCount > 6 && (
                <Badge variant="outline" className="border-border/50 bg-muted/30 text-[10px] text-muted-foreground">
                  +{skillCount - 6} more
                </Badge>
              )}
            </div>
          </>
        )}
      </CardContent>

      <ResumePreviewDialog
        resume={resume}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </Card>
  );
}

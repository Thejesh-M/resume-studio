"use client";

import Link from "next/link";
import { ArrowLeft, Download, Loader2, Check, Sparkles, ChevronDown, Star, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROUTES } from "@/lib/constants";
import type { UserResume } from "@/types/resume";

interface EditorTopbarProps {
  readonly resume: UserResume;
  readonly allResumes?: readonly UserResume[];
  readonly onResumeChange?: (id: string) => void;
  readonly isSaving: boolean;
  readonly isDirty: boolean;
  readonly isCompiling: boolean;
  readonly onSave: () => void;
  readonly onDownload: () => void;
}

export function EditorTopbar({
  resume,
  allResumes,
  onResumeChange,
  isSaving,
  isDirty,
  isCompiling,
  onSave,
  onDownload,
}: EditorTopbarProps) {
  const hasMultiple = allResumes && allResumes.length > 1 && onResumeChange;

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border/50 bg-background px-4">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        nativeButton={false}
        render={<Link href={ROUTES.RESUMES} />}
        title="Back to resumes"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>

      <div className="flex min-w-0 items-center gap-1.5">
        <Sparkles className="h-4 w-4 shrink-0 text-[oklch(0.55_0.2_260)]" />

        {hasMultiple ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="group flex min-w-0 items-center gap-1 rounded-md px-1.5 py-1 text-sm font-semibold transition-colors hover:bg-muted/60">
              <span className="truncate">{resume.title}</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-64 max-h-[min(400px,60vh)] overflow-y-auto">
              <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Switch Resume
              </div>
              <DropdownMenuSeparator />
              {allResumes.map((r) => (
                <DropdownMenuItem
                  key={r.id}
                  onClick={() => onResumeChange(r.id)}
                  className="flex items-center gap-2.5 py-2"
                >
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                      r.id === resume.id
                        ? "bg-gradient-to-br from-[oklch(0.55_0.2_260)] to-[oklch(0.55_0.2_300)]"
                        : "bg-muted"
                    }`}
                  >
                    <FileText
                      className={`h-3.5 w-3.5 ${r.id === resume.id ? "text-white" : "text-muted-foreground"}`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium">{r.title}</span>
                      {r.isDefault && (
                        <Star className="h-3 w-3 shrink-0 fill-[oklch(0.55_0.2_260)] text-[oklch(0.55_0.2_260)]" />
                      )}
                    </div>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {r.content?.contact.name || "No name"}
                    </p>
                  </div>
                  {r.id === resume.id && (
                    <Check className="h-3.5 w-3.5 shrink-0 text-[oklch(0.55_0.2_260)]" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <span className="truncate text-sm font-semibold">{resume.title}</span>
        )}

        <span className="hidden text-xs text-muted-foreground sm:block">— AI Editor</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Save status */}
        <div className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
          {isSaving ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Auto-saving…
            </>
          ) : isDirty ? (
            <span className="text-amber-500">Unsaved changes</span>
          ) : (
            <>
              <Check className="h-3 w-3 text-green-500" />
              Saved
            </>
          )}
        </div>

        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={onSave}
          disabled={isSaving || !isDirty}
        >
          Save
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={onDownload}
          disabled={isCompiling}
          title="Download PDF"
        >
          {isCompiling ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Download className="h-3 w-3" />
          )}
          <span className="ml-1.5 hidden sm:inline">Download</span>
        </Button>
      </div>
    </header>
  );
}

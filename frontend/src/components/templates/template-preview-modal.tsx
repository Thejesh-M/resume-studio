"use client";

import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Template } from "@/types/template";

interface TemplatePreviewModalProps {
  readonly template: Template | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSelect?: (template: Template) => void;
}

export function TemplatePreviewModal({
  template,
  open,
  onOpenChange,
  onSelect,
}: TemplatePreviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {template && (
        <DialogContent className="flex h-[90vh] flex-col gap-3 sm:max-w-4xl">
          {/* Header */}
          <DialogHeader className="shrink-0 space-y-2">
            <DialogTitle>{template.name}</DialogTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{template.category}</Badge>
              <Badge variant="outline">{template.engine.toUpperCase()}</Badge>
              {template.isAtsTested && (
                <Badge variant="outline" className="gap-1 text-green-600">
                  <ShieldCheck className="h-3 w-3" />
                  ATS Tested
                </Badge>
              )}
            </div>
          </DialogHeader>

          {/* PDF viewer — takes all remaining vertical space */}
          {template.pdfUrl ? (
            <iframe
              src={`${template.pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
              title={`${template.name} preview`}
              className="min-h-0 w-full flex-1 rounded-md border bg-white"
            />
          ) : template.previewUrl ? (
            <div className="relative min-h-0 flex-1 overflow-hidden rounded-md bg-white">
              <Image
                src={template.previewUrl}
                alt={`${template.name} full preview`}
                fill
                unoptimized
                className="object-contain"
                sizes="90vw"
              />
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
              No preview available
            </div>
          )}

          {/* Footer */}
          {onSelect && (
            <div className="shrink-0 flex justify-end">
              <Button
                onClick={() => {
                  onSelect(template);
                  onOpenChange(false);
                }}
              >
                Use This Template
              </Button>
            </div>
          )}
        </DialogContent>
      )}
    </Dialog>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { Check, Download, RotateCcw, X } from "lucide-react";

interface TailorApprovalBarProps {
  readonly onApprove: () => void;
  readonly onReject: () => void;
  readonly onRetry: () => void;
  readonly onDownload: () => void;
  readonly pdfUrl: string | null;
  readonly isApproved: boolean;
}

export function TailorApprovalBar({
  onApprove,
  onReject,
  onRetry,
  onDownload,
  pdfUrl,
  isApproved,
}: TailorApprovalBarProps) {
  return (
    <div className="sticky bottom-0 z-10 border-t bg-background/95 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-3xl items-center justify-between">
        <div className="flex gap-2">
          <Button variant="outline" onClick={onReject}>
            <X className="mr-1.5 h-4 w-4" />
            Reject
          </Button>
          <Button variant="outline" onClick={onRetry}>
            <RotateCcw className="mr-1.5 h-4 w-4" />
            Retry
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {!isApproved && (
            <Button onClick={onApprove}>
              <Check className="mr-1.5 h-4 w-4" />
              Approve Changes
            </Button>
          )}
          {isApproved && (
            pdfUrl ? (
              <Button onClick={onDownload}>
                <Download className="mr-1.5 h-4 w-4" />
                Download PDF
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">
                PDF is being generated...
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );
}

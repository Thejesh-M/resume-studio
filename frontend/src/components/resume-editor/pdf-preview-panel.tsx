"use client";

import { useEffect, useRef } from "react";
import { Loader2, FileText } from "lucide-react";

interface PdfPreviewPanelProps {
  readonly pdfBlobUrl: string | null;
  readonly isCompiling: boolean;
}

export function PdfPreviewPanel({ pdfBlobUrl, isCompiling }: PdfPreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Reload iframe when blob URL changes
  useEffect(() => {
    if (iframeRef.current && pdfBlobUrl) {
      iframeRef.current.src = pdfBlobUrl;
    }
  }, [pdfBlobUrl]);

  return (
    <div className="relative flex h-full flex-col bg-muted/20">
      {/* Compiling overlay */}
      {isCompiling && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-background/70 backdrop-blur-sm">
          <Loader2 className="h-6 w-6 animate-spin text-[oklch(0.55_0.2_260)]" />
          <p className="text-xs text-muted-foreground">Generating preview…</p>
        </div>
      )}

      {pdfBlobUrl ? (
        <iframe
          ref={iframeRef}
          title="Resume PDF preview"
          className="h-full w-full border-0"
          src={pdfBlobUrl}
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
          {isCompiling ? null : (
            <>
              <FileText className="h-10 w-10 opacity-30" />
              <p className="text-sm">PDF preview will appear here</p>
              <p className="text-xs opacity-70">
                Save or make an AI edit to generate a preview
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { FileText, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface ResumePdfViewerProps {
  readonly pdfUrl: string | null;
  readonly className?: string;
}

export function ResumePdfViewer({ pdfUrl, className }: ResumePdfViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loadError, setLoadError] = useState(false);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages: total }: { numPages: number }) => {
      setNumPages(total);
      setPageNumber(1);
      setLoadError(false);
    },
    []
  );

  if (!pdfUrl) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/30 p-12 text-center",
          className
        )}
      >
        <FileText className="mb-3 h-12 w-12 text-muted-foreground/50" />
        <p className="text-sm font-medium text-muted-foreground">
          No PDF preview available
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          The PDF will appear here once your resume is compiled.
        </p>
      </div>
    );
  }

  // Only allow https URLs or relative paths to prevent XSS via javascript:/data: URIs
  const isSafeUrl =
    pdfUrl.startsWith("https://") || pdfUrl.startsWith("/");

  if (!isSafeUrl) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/30 p-12 text-center",
          className
        )}
      >
        <FileText className="mb-3 h-12 w-12 text-muted-foreground/50" />
        <p className="text-sm font-medium text-destructive">
          Invalid PDF URL
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/30 p-12 text-center",
          className
        )}
      >
        <FileText className="mb-3 h-12 w-12 text-muted-foreground/50" />
        <p className="text-sm font-medium text-destructive">
          Failed to load PDF
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          The file may be corrupted or inaccessible.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col rounded-lg border", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-1.5">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground">
            {pageNumber} / {numPages || "–"}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            disabled={pageNumber >= numPages}
            onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            disabled={scale <= 0.5}
            onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-10 text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            disabled={scale >= 2.0}
            onClick={() => setScale((s) => Math.min(2.0, s + 0.25))}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto bg-muted/10 p-4">
        <div className="flex justify-center">
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={() => setLoadError(true)}
            loading={
              <div className="flex h-[600px] items-center justify-center">
                <p className="text-sm text-muted-foreground">Loading PDF...</p>
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              className="shadow-md"
              renderAnnotationLayer
              renderTextLayer
            />
          </Document>
        </div>
      </div>
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils";
import type { DiffChange } from "@/types/tailoring";

interface DiffViewerProps {
  readonly changes: readonly DiffChange[];
  readonly className?: string;
}

export function DiffViewer({ changes, className }: DiffViewerProps) {
  if (changes.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        No changes to display.
      </p>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {changes.map((change, index) => (
        <div key={index} className="rounded-lg border">
          <div className="border-b bg-muted/50 px-4 py-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {change.section}
            </span>
          </div>
          <div className="grid gap-0 sm:grid-cols-2">
            {/* Original */}
            <div className="border-b p-4 sm:border-r sm:border-b-0">
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Original
              </p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-red-700 dark:text-red-400">
                {change.original}
              </p>
            </div>
            {/* Tailored */}
            <div className="p-4">
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Tailored
              </p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-green-700 dark:text-green-400">
                {change.tailored}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

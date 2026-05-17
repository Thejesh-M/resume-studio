"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationControlsProps {
  readonly currentPage: number;
  readonly totalPages: number;
  readonly onPageChange: (page: number) => void;
}

export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationControlsProps) {
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;

  return (
    <div className="flex items-center justify-center gap-4 pt-4">
      <Button
        variant="outline"
        size="sm"
        disabled={isFirstPage}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeft className="mr-1 h-3.5 w-3.5" />
        Previous
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={isLastPage}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
        <ChevronRight className="ml-1 h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import type { TemplateCategory } from "@/types/template";

const CATEGORIES: readonly { value: TemplateCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "classic", label: "Classic" },
  { value: "modern", label: "Modern" },
  { value: "two-column", label: "Two-Column" },
  { value: "academic", label: "Academic" },
  { value: "creative", label: "Creative" },
  { value: "cover-letter", label: "Cover Letter" },
];

interface TemplateCategoryFilterProps {
  readonly selected: TemplateCategory | "all";
  readonly onChange: (category: TemplateCategory | "all") => void;
}

export function TemplateCategoryFilter({
  selected,
  onChange,
}: TemplateCategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((cat) => (
        <Button
          key={cat.value}
          variant={selected === cat.value ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(cat.value)}
        >
          {cat.label}
        </Button>
      ))}
    </div>
  );
}

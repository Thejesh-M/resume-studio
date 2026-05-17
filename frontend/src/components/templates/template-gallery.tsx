"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TemplateCard } from "./template-card";
import { TemplateCategoryFilter } from "./template-category-filter";
import { TemplatePreviewModal } from "./template-preview-modal";
import type { Template, TemplateCategory } from "@/types/template";

interface TemplateGalleryProps {
  readonly templates: readonly Template[];
  readonly loading?: boolean;
  readonly selectedId?: string | null;
  readonly onSelect?: (template: Template) => void;
  readonly showFilter?: boolean;
}

export function TemplateGallery({
  templates,
  loading = false,
  selectedId = null,
  onSelect,
  showFilter = true,
}: TemplateGalleryProps) {
  const [category, setCategory] = useState<TemplateCategory | "all">("all");
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const filtered =
    category === "all"
      ? templates
      : templates.filter((t) => t.category === category);

  if (loading) {
    return (
      <div className="space-y-6">
        {showFilter && (
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-md" />
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[3/4] w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showFilter && (
        <TemplateCategoryFilter selected={category} onChange={setCategory} />
      )}

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No templates found in this category.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              selected={selectedId === template.id}
              onSelect={onSelect}
              onPreview={setPreviewTemplate}
            />
          ))}
        </div>
      )}

      <TemplatePreviewModal
        template={previewTemplate}
        open={previewTemplate !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewTemplate(null);
        }}
        onSelect={onSelect}
      />
    </div>
  );
}

"use client";

import Image from "next/image";
import { Check, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Template } from "@/types/template";

interface TemplateCardProps {
  readonly template: Template;
  readonly selected?: boolean;
  readonly onSelect?: (template: Template) => void;
  readonly onPreview?: (template: Template) => void;
}

export function TemplateCard({
  template,
  selected = false,
  onSelect,
  onPreview,
}: TemplateCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(template)}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg border bg-background text-left transition-all hover:shadow-md",
        selected
          ? "border-primary ring-2 ring-primary/20"
          : "border-border hover:border-primary/50"
      )}
    >
      {/* Preview image */}
      <div
        className="relative aspect-[3/4] w-full overflow-hidden bg-white"
        onClick={(e) => {
          if (onPreview) {
            e.stopPropagation();
            onPreview(template);
          }
        }}
      >
        {template.previewUrl ? (
          <Image
            src={template.previewUrl}
            alt={`${template.name} template preview`}
            fill
            unoptimized
            className="object-cover object-top transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-xs">
            No preview
          </div>
        )}

        {/* Hover overlay */}
        {onPreview && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <span className="rounded-md bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-900">
              Preview
            </span>
          </div>
        )}

        {/* Selected checkmark */}
        {selected && (
          <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="text-sm font-medium">{template.name}</p>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className="text-[10px]">
            {template.category}
          </Badge>
          {template.isAtsTested && (
            <Badge variant="outline" className="gap-1 text-[10px] text-green-600">
              <ShieldCheck className="h-2.5 w-2.5" />
              ATS
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}

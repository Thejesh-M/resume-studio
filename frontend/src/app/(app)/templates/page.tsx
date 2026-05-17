"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TemplateGallery } from "@/components/templates/template-gallery";
import { useTemplates } from "@/hooks/use-templates";
import { useResumes, useUpdateResume } from "@/hooks/use-resumes";
import { ROUTES } from "@/lib/constants";
import type { Template } from "@/types/template";

export default function TemplatesPage() {
  const { data: templates = [], isLoading: templatesLoading } = useTemplates();
  const { data: resumes = [], isLoading: resumesLoading } = useResumes();
  const isLoading = templatesLoading || resumesLoading;
  const updateResume = useUpdateResume();
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const defaultResume = resumes.find((r) => r.isDefault) ?? resumes[0] ?? null;
  const hasNoResumes = !isLoading && resumes.length === 0;

  function handleSelect(template: Template) {
    // No resumes yet — send to onboarding with template pre-selected
    if (hasNoResumes) {
      router.push(`${ROUTES.ONBOARDING}?template=${template.id}`);
      return;
    }

    if (!defaultResume) return;

    setSelectedId(template.id);

    updateResume.mutate(
      { id: defaultResume.id, payload: { templateId: template.id } },
      {
        onSuccess: () => {
          toast.success(`Template "${template.name}" applied to "${defaultResume.title}".`);
        },
        onError: () => {
          toast.error("Failed to apply template. Please try again.");
          setSelectedId(null);
        },
      }
    );
  }

  return (
    <div className="space-y-6 bg-dot-grid">
      <div>
        <h1 className="text-2xl font-bold">Templates</h1>
        <p className="text-muted-foreground">
          Browse and switch your resume template.
        </p>
        {hasNoResumes ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Select a template to get started — you&apos;ll set up your resume next.
          </p>
        ) : defaultResume ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Applying to: <span className="font-medium text-foreground">{defaultResume.title}</span>
          </p>
        ) : null}
      </div>

      <TemplateGallery
        templates={templates}
        loading={isLoading}
        selectedId={selectedId}
        onSelect={handleSelect}
      />
    </div>
  );
}

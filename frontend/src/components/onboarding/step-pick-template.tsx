"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { TemplateGallery } from "@/components/templates/template-gallery";
import { useTemplates } from "@/hooks/use-templates";
import type { Template } from "@/types/template";

interface StepPickTemplateProps {
  readonly selectedTemplate: Template | null;
  readonly onSelect: (template: Template) => void;
  readonly onNext: () => void;
  readonly onBack: () => void;
}

export function StepPickTemplate({
  selectedTemplate,
  onSelect,
  onNext,
  onBack,
}: StepPickTemplateProps) {
  const { data: templates = [], isLoading } = useTemplates();

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Choose a template</CardTitle>
        <CardDescription>
          Pick a template for your resume. You can change this anytime later.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <TemplateGallery
          templates={templates}
          loading={isLoading}
          selectedId={selectedTemplate?.id ?? null}
          onSelect={onSelect}
        />

        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back
          </Button>
          <Button onClick={onNext} disabled={!selectedTemplate}>
            Continue
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

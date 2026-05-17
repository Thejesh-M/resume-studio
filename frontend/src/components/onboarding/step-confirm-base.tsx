"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, Loader2, FileText, Layout } from "lucide-react";
import type { ResumeContent } from "@/types/resume";
import type { Template } from "@/types/template";

interface StepConfirmBaseProps {
  readonly content: ResumeContent | null;
  readonly template: Template | null;
  readonly onConfirm: () => void;
  readonly onBack: () => void;
  readonly isSubmitting: boolean;
}

export function StepConfirmBase({
  content,
  template,
  onConfirm,
  onBack,
  isSubmitting,
}: StepConfirmBaseProps) {
  const hasContent = content !== null;

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Ready to create your resume</CardTitle>
        <CardDescription>
          Review your selections below. You can always change these later.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Template */}
          <div className="rounded-lg border p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Layout className="h-4 w-4 text-primary" />
              Template
            </div>
            {template ? (
              <div>
                <p className="text-sm">{template.name}</p>
                <div className="mt-1 flex gap-1">
                  <Badge variant="outline" className="text-[10px]">
                    {template.category}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {template.engine.toUpperCase()}
                  </Badge>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No template selected</p>
            )}
          </div>

          {/* Content */}
          <div className="rounded-lg border p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4 text-primary" />
              Content
            </div>
            {hasContent ? (
              <div className="space-y-0.5 text-sm">
                <p>{content.contact.name}</p>
                <p className="text-xs text-muted-foreground">
                  {content.contact.email}
                </p>
                <p className="text-xs text-muted-foreground">
                  {content.experience.length} experience entries &middot;{" "}
                  {content.skills.flatMap((g) => g.items ?? []).length} skills
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Starting from scratch &mdash; you&apos;ll add content after setup
              </p>
            )}
          </div>
        </div>

        {/* What happens next */}
        <div className="rounded-lg bg-muted/50 p-4">
          <h4 className="mb-2 text-sm font-medium">What happens next?</h4>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
              Your base resume will be created with the selected template
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
              You can edit all sections in detail from the resume editor
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
              Paste any job description to tailor your resume with AI
            </li>
          </ul>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onBack} disabled={isSubmitting}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back
          </Button>
          <Button onClick={onConfirm} disabled={isSubmitting || !template}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Check className="mr-1.5 h-4 w-4" />
                Create Resume
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

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
import { ResumeContentEditor } from "@/components/resume/resume-content-editor";
import type { ResumeContent } from "@/types/resume";

interface StepReviewContentProps {
  readonly content: ResumeContent | null;
  readonly onUpdate: (content: ResumeContent) => void;
  readonly onNext: () => void;
  readonly onBack: () => void;
}

const EMPTY_CONTENT: ResumeContent = {
  contact: { name: "", email: "" },
  summary: "",
  experience: [],
  education: [],
  skills: [],
};

export function StepReviewContent({
  content,
  onUpdate,
  onNext,
  onBack,
}: StepReviewContentProps) {
  const activeContent = content ?? EMPTY_CONTENT;

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>
          {content !== null ? "Review your content" : "Enter your details"}
        </CardTitle>
        <CardDescription>
          {content !== null
            ? "We extracted this from your resume. Review and edit anything before continuing."
            : "Fill in your details to get started. All sections are optional except name and email."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Full section editor in controlled mode — no save button */}
        <ResumeContentEditor
          content={activeContent}
          onChange={onUpdate}
        />

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          <Button type="button" variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back
          </Button>
          <Button
            type="button"
            onClick={onNext}
            disabled={!activeContent.contact.name || !activeContent.contact.email}
          >
            Continue
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

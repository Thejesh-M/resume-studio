"use client";

import { useReducer, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ROUTES, isSafeRedirect } from "@/lib/constants";
import { useCreateResume } from "@/hooks/use-resumes";
import { useTemplates } from "@/hooks/use-templates";
import { StepUploadResume } from "./step-upload-resume";
import { StepPickTemplate } from "./step-pick-template";
import { StepReviewContent } from "./step-review-content";
import { StepConfirmBase } from "./step-confirm-base";
import type { ResumeContent } from "@/types/resume";
import type { Template } from "@/types/template";

// ── State ────────────────────────────────────────────────────────────

type Step = "upload" | "template" | "review" | "confirm";

const STEPS: readonly Step[] = ["upload", "template", "review", "confirm"];
const STEP_LABELS: Record<Step, string> = {
  upload: "Upload Resume",
  template: "Pick Template",
  review: "Review Content",
  confirm: "Confirm",
};

interface WizardState {
  readonly step: Step;
  readonly file: File | null;
  readonly extractedContent: ResumeContent | null;
  readonly extractionId: string | null;
  readonly selectedTemplate: Template | null;
  readonly editedContent: ResumeContent | null;
}

type WizardAction =
  | { type: "SET_FILE"; file: File }
  | { type: "SET_EXTRACTED_CONTENT"; content: ResumeContent; extractionId: string }
  | { type: "SKIP_UPLOAD" }
  | { type: "SELECT_TEMPLATE"; template: Template }
  | { type: "UPDATE_CONTENT"; content: ResumeContent }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" };

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "SET_FILE":
      return { ...state, file: action.file };
    case "SET_EXTRACTED_CONTENT":
      return {
        ...state,
        extractedContent: action.content,
        extractionId: action.extractionId,
        editedContent: action.content,
      };
    case "SKIP_UPLOAD":
      return {
        ...state,
        file: null,
        extractedContent: null,
        extractionId: null,
        editedContent: null,
        step: "template",
      };
    case "SELECT_TEMPLATE":
      return { ...state, selectedTemplate: action.template };
    case "UPDATE_CONTENT":
      return { ...state, editedContent: action.content };
    case "NEXT_STEP": {
      const idx = STEPS.indexOf(state.step);
      if (idx < STEPS.length - 1) {
        return { ...state, step: STEPS[idx + 1] };
      }
      return state;
    }
    case "PREV_STEP": {
      const idx = STEPS.indexOf(state.step);
      if (idx > 0) {
        return { ...state, step: STEPS[idx - 1] };
      }
      return state;
    }
    default:
      return state;
  }
}

const INITIAL_STATE: WizardState = {
  step: "upload",
  file: null,
  extractedContent: null,
  extractionId: null,
  selectedTemplate: null,
  editedContent: null,
};

// ── Component ────────────────────────────────────────────────────────

export function OnboardingWizard() {
  const [state, dispatch] = useReducer(wizardReducer, INITIAL_STATE);
  const router = useRouter();
  const searchParams = useSearchParams();
  const createResume = useCreateResume();
  const { data: templates = [] } = useTemplates();

  const returnTo = searchParams.get("returnTo");
  const templateParam = searchParams.get("template");

  // Pre-select template from ?template=<id> param (e.g. coming from Templates page)
  useEffect(() => {
    if (!templateParam || !templates.length || state.selectedTemplate) return;
    const match = templates.find((t) => t.id === templateParam);
    if (match) dispatch({ type: "SELECT_TEMPLATE", template: match });
  }, [templateParam, templates, state.selectedTemplate]);

  const currentStepIndex = STEPS.indexOf(state.step);

  async function handleConfirm() {
    if (!state.selectedTemplate) {
      toast.error("Please select a template.");
      return;
    }

    try {
      const resume = await createResume.mutateAsync({
        title: state.editedContent?.contact.name
          ? `${state.editedContent.contact.name}'s Resume`
          : "My Resume",
        templateId: state.selectedTemplate.id,
        content: state.editedContent ?? {
          contact: { name: "", email: "" },
          summary: "",
          experience: [],
          education: [],
          skills: [],
        },
        extractionId: state.extractionId ?? undefined,
      });

      toast.success("Resume created! Opening editor…");
      const destination = returnTo && isSafeRedirect(returnTo)
        ? returnTo
        : ROUTES.RESUME_EDITOR(resume.id);
      router.push(destination);
    } catch {
      toast.error("Failed to create resume. Please try again.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 px-4">
      {/* Stepper — glowing orbs, agentic */}
      <nav
        aria-label="Onboarding steps"
        className="flex items-center justify-center gap-1 sm:gap-2"
        role="tablist"
      >
        {STEPS.map((step, i) => {
          const isDone = i < currentStepIndex;
          const isActive = i === currentStepIndex;

          return (
            <div key={step} className="flex items-center gap-1 sm:gap-2">
              <div className="flex items-center gap-2">
                <div className="relative">
                  {isActive && (
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 -m-1 rounded-full bg-gradient-to-br from-[oklch(0.55_0.2_260_/_60%)] to-[oklch(0.55_0.2_300_/_60%)] blur-md"
                    />
                  )}
                  <div
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`Step ${i + 1}: ${STEP_LABELS[step]}${isDone ? " (completed)" : ""}`}
                    tabIndex={isActive ? 0 : -1}
                    className={`relative flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                      isDone
                        ? "bg-gradient-to-br from-[oklch(0.55_0.2_260)] to-[oklch(0.55_0.2_300)] text-white ring-1 ring-white/30 shadow-[0_2px_8px_oklch(0.55_0.2_260_/_30%)]"
                        : isActive
                          ? "bg-gradient-to-br from-[oklch(0.55_0.2_260)] to-[oklch(0.55_0.2_300)] text-white ring-2 ring-[oklch(0.6_0.2_280_/_40%)] shadow-[0_4px_16px_oklch(0.55_0.2_260_/_40%)]"
                          : "bg-background/60 text-muted-foreground ring-1 ring-border/60 backdrop-blur"
                    }`}
                  >
                    {isDone ? "✓" : i + 1}
                  </div>
                </div>
                <span
                  className={`hidden text-sm transition-colors sm:inline ${
                    isActive
                      ? "font-semibold text-foreground"
                      : isDone
                        ? "text-foreground/70"
                        : "text-muted-foreground"
                  }`}
                >
                  {STEP_LABELS[step]}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  aria-hidden="true"
                  className={`h-[2px] w-6 rounded-full transition-all sm:w-10 ${
                    isDone
                      ? "bg-gradient-to-r from-[oklch(0.55_0.2_260)] to-[oklch(0.55_0.2_300)]"
                      : "bg-border"
                  }`}
                />
              )}
            </div>
          );
        })}
      </nav>

      {/* Step content — glass card container */}
      <div className="glass-card rounded-2xl p-6 sm:p-8">
        {state.step === "upload" && (
          <StepUploadResume
            onFileSelected={(file) => dispatch({ type: "SET_FILE", file })}
            onContentExtracted={(content, extractionId) =>
              dispatch({ type: "SET_EXTRACTED_CONTENT", content, extractionId })
            }
            onNext={() => dispatch({ type: "NEXT_STEP" })}
            onSkip={() => dispatch({ type: "SKIP_UPLOAD" })}
            file={state.file}
            extractedContent={state.extractedContent}
          />
        )}

        {state.step === "template" && (
          <StepPickTemplate
            selectedTemplate={state.selectedTemplate}
            onSelect={(template) =>
              dispatch({ type: "SELECT_TEMPLATE", template })
            }
            onNext={() => dispatch({ type: "NEXT_STEP" })}
            onBack={() => dispatch({ type: "PREV_STEP" })}
          />
        )}

        {state.step === "review" && (
          <StepReviewContent
            content={state.editedContent}
            onUpdate={(content) =>
              dispatch({ type: "UPDATE_CONTENT", content })
            }
            onNext={() => dispatch({ type: "NEXT_STEP" })}
            onBack={() => dispatch({ type: "PREV_STEP" })}
          />
        )}

        {state.step === "confirm" && (
          <StepConfirmBase
            content={state.editedContent}
            template={state.selectedTemplate}
            onConfirm={() => void handleConfirm()}
            onBack={() => dispatch({ type: "PREV_STEP" })}
            isSubmitting={createResume.isPending}
          />
        )}
      </div>
    </div>
  );
}

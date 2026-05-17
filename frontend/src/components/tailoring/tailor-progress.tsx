"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Brain,
  BarChart3,
  Search,
  Pencil,
  FileOutput,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import type { TailoringStatus } from "@/types/tailoring";

interface TailorProgressProps {
  readonly status: TailoringStatus;
  readonly progressPct: number;
  readonly currentStep: string;
}

const AGENT_STEPS: readonly {
  status: TailoringStatus;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    status: "analyzing_jd",
    label: "JD Analyzer",
    icon: <Brain className="h-4 w-4" />,
  },
  {
    status: "scoring",
    label: "Resume Scorer",
    icon: <BarChart3 className="h-4 w-4" />,
  },
  {
    status: "finding_gaps",
    label: "Gap Finder",
    icon: <Search className="h-4 w-4" />,
  },
  {
    status: "rewriting",
    label: "Content Rewriter",
    icon: <Pencil className="h-4 w-4" />,
  },
  {
    status: "compiling",
    label: "PDF Compiler",
    icon: <FileOutput className="h-4 w-4" />,
  },
];

function getStepState(
  stepStatus: TailoringStatus,
  currentStatus: TailoringStatus
): "completed" | "active" | "pending" {
  const stepOrder = AGENT_STEPS.findIndex((s) => s.status === stepStatus);
  const currentOrder = AGENT_STEPS.findIndex((s) => s.status === currentStatus);

  if (currentStatus === "completed") return "completed";
  if (stepOrder < currentOrder) return "completed";
  if (stepOrder === currentOrder) return "active";
  return "pending";
}

export function TailorProgress({
  status,
  progressPct,
  currentStep,
}: TailorProgressProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tailoring in progress...</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-center text-xs text-muted-foreground">
            {currentStep}
          </p>
        </div>

        {/* Agent pipeline */}
        <div className="space-y-3">
          {AGENT_STEPS.map((step) => {
            const state = getStepState(step.status, status);

            return (
              <div
                key={step.status}
                className={cn(
                  "flex items-center gap-3 rounded-md border px-3 py-2 transition-all",
                  state === "completed" && "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950",
                  state === "active" && "border-primary bg-primary/5",
                  state === "pending" && "border-transparent bg-muted/30 text-muted-foreground"
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full",
                    state === "completed" && "bg-green-500 text-white",
                    state === "active" && "bg-primary text-primary-foreground",
                    state === "pending" && "bg-muted text-muted-foreground"
                  )}
                >
                  {state === "completed" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : state === "active" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    step.icon
                  )}
                </div>
                <span
                  className={cn(
                    "text-sm",
                    state === "active" && "font-medium",
                    state === "pending" && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

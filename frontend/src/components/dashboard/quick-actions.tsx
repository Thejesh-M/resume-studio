"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";
import {
  FilePlus,
  Sparkles,
  Wand2,
  FileEdit,
  Palette,
  FileText,
  type LucideIcon,
} from "lucide-react";

interface Action {
  readonly label: string;
  readonly description: string;
  readonly href: string;
  readonly icon: LucideIcon;
  readonly gradient: string;
}

const ACTIONS: readonly Action[] = [
  {
    label: "Build a Resume",
    description: "Start fresh or upload a PDF/DOCX to extract.",
    href: ROUTES.ONBOARDING,
    icon: FilePlus,
    gradient: "from-[oklch(0.6_0.15_180)] to-[oklch(0.55_0.2_200)]",
  },
  {
    label: "AI Editor",
    description: "Chat with AI to refine bullets, summary, and skills.",
    href: ROUTES.EDITOR,
    icon: Sparkles,
    gradient: "from-[oklch(0.55_0.2_260)] to-[oklch(0.55_0.2_300)]",
  },
  {
    label: "Tailor Resume",
    description: "Match a resume to any job description.",
    href: ROUTES.TAILOR,
    icon: Wand2,
    gradient: "from-[oklch(0.6_0.18_300)] to-[oklch(0.55_0.2_330)]",
  },
  {
    label: "Cover Letter",
    description: "Generate a tailored cover letter from a job post.",
    href: ROUTES.COVER_LETTER,
    icon: FileEdit,
    gradient: "from-[oklch(0.65_0.18_30)] to-[oklch(0.6_0.2_50)]",
  },
  {
    label: "Templates",
    description: "Browse layouts and switch the look of any resume.",
    href: ROUTES.TEMPLATES,
    icon: Palette,
    gradient: "from-[oklch(0.55_0.18_220)] to-[oklch(0.5_0.2_250)]",
  },
  {
    label: "All Resumes",
    description: "Manage every resume in one place.",
    href: ROUTES.RESUMES,
    icon: FileText,
    gradient: "from-[oklch(0.6_0.16_160)] to-[oklch(0.55_0.18_185)]",
  },
];

export function QuickActions() {
  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">Everything you can do</h2>
        <span className="text-xs text-muted-foreground">
          {ACTIONS.length} workflows
        </span>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {ACTIONS.map((action) => (
          <Link key={action.href} href={action.href} className="block">
            <Card className="group h-full border-border/50 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
              <CardContent className="flex items-start gap-4 p-5">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${action.gradient} shadow-sm transition-transform duration-200 group-hover:scale-110`}
                >
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold">{action.label}</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {action.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

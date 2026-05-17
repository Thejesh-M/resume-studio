"use client";

import { Card, CardContent } from "@/components/ui/card";
import { FileText, Target, Palette } from "lucide-react";

interface DashboardStatsProps {
  readonly resumeCount: number;
  readonly tailoringCount: number;
  readonly templateCount: number;
}

interface Stat {
  readonly label: string;
  readonly value: number;
  readonly hint: string;
  readonly icon: typeof FileText;
  readonly gradient: string;
  readonly text: string;
}

export function DashboardStats({
  resumeCount,
  tailoringCount,
  templateCount,
}: DashboardStatsProps) {
  const stats: readonly Stat[] = [
    {
      label: "Resumes",
      value: resumeCount,
      hint: "base resumes",
      icon: FileText,
      gradient: "from-[oklch(0.6_0.15_180)] to-[oklch(0.55_0.2_200)]",
      text: "text-[oklch(0.45_0.15_180)]",
    },
    {
      label: "Tailorings",
      value: tailoringCount,
      hint: "tailored versions",
      icon: Target,
      gradient: "from-[oklch(0.6_0.18_300)] to-[oklch(0.55_0.2_330)]",
      text: "text-[oklch(0.45_0.18_300)]",
    },
    {
      label: "Templates",
      value: templateCount,
      hint: "ready to use",
      icon: Palette,
      gradient: "from-[oklch(0.55_0.2_260)] to-[oklch(0.55_0.2_300)]",
      text: "text-[oklch(0.45_0.2_260)]",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat) => (
        <Card
          key={stat.label}
          className="group border-border/50 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
        >
          <CardContent className="flex items-center gap-4 p-5">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} shadow-sm`}
            >
              <stat.icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.text}`}>{stat.value}</p>
              <p className="text-[11px] text-muted-foreground/70">{stat.hint}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils";

interface ScoreGaugeProps {
  readonly score: number; // 0-100
  readonly size?: "sm" | "md" | "lg";
  readonly label?: string;
  readonly className?: string;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-500";
  if (score >= 60) return "text-yellow-500";
  if (score >= 40) return "text-orange-500";
  return "text-red-500";
}

function getStrokeColor(score: number): string {
  if (score >= 80) return "stroke-green-500";
  if (score >= 60) return "stroke-yellow-500";
  if (score >= 40) return "stroke-orange-500";
  return "stroke-red-500";
}

const SIZES = {
  sm: { dim: 80, stroke: 6, fontSize: "text-lg", labelSize: "text-[10px]" },
  md: { dim: 120, stroke: 8, fontSize: "text-3xl", labelSize: "text-xs" },
  lg: { dim: 160, stroke: 10, fontSize: "text-4xl", labelSize: "text-sm" },
} as const;

export function ScoreGauge({
  score,
  size = "md",
  label,
  className,
}: ScoreGaugeProps) {
  const { dim, stroke, fontSize, labelSize } = SIZES[size];
  const radius = (dim - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, score));
  const offset = circumference - (clampedScore / 100) * circumference;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg
          width={dim}
          height={dim}
          className="-rotate-90"
          viewBox={`0 0 ${dim} ${dim}`}
        >
          {/* Background circle */}
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            className="stroke-muted"
          />
          {/* Score arc */}
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn("transition-[stroke-dashoffset] duration-700 ease-out", getStrokeColor(clampedScore))}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-bold", fontSize, getScoreColor(clampedScore))}>
            {clampedScore}
          </span>
        </div>
      </div>
      {label && (
        <span className={cn("mt-1 text-muted-foreground", labelSize)}>
          {label}
        </span>
      )}
    </div>
  );
}

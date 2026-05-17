"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScoreGauge } from "@/components/ui/score-gauge";
import { DiffViewer } from "@/components/ui/diff-viewer";
import { ArrowRight } from "lucide-react";
import type { TailoredVersion } from "@/types/tailoring";

interface TailorDiffReviewProps {
  readonly result: TailoredVersion;
}

export function TailorDiffReview({ result }: TailorDiffReviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Changes</CardTitle>
        <CardDescription>
          Here&apos;s what the AI changed. Review each section before approving.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score comparison */}
        <div className="flex items-center justify-center gap-6">
          <ScoreGauge score={result.scoreBefore} size="sm" label="Before" />
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
          <ScoreGauge score={result.scoreAfter} size="sm" label="After" />
        </div>

        <div className="rounded-lg bg-green-50 p-3 text-center text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
          Score improved by{" "}
          <span className="font-bold">
            +{result.scoreAfter - result.scoreBefore} points
          </span>
        </div>

        {/* Diff */}
        <DiffViewer changes={result.diff} />
      </CardContent>
    </Card>
  );
}

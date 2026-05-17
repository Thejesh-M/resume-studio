"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Wand2, Clock } from "lucide-react";

interface StreamlinedWorkspaceProps {
  readonly resumeId: string;
}

export function StreamlinedWorkspace(_props: StreamlinedWorkspaceProps) {
  return (
    <Card className="glass-card border-border/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wand2 className="h-5 w-5 text-[oklch(0.45_0.2_260)]" />
          Tailor Your Resume
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="rounded-full bg-muted p-3">
          <Clock className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-base font-semibold">Coming soon</p>
        <p className="max-w-md text-sm text-muted-foreground">
          The AI tailoring feature is still being built. Soon you&apos;ll be able to paste a job description and get a tailored, ATS-friendly resume in seconds.
        </p>
      </CardContent>
    </Card>
  );
}

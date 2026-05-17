"use client";

import Link from "next/link";
import {
  ArrowRight,
  FilePlus,
  Sparkles,
  Wand2,
  ShieldCheck,
  Code,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useResumes } from "@/hooks/use-resumes";
import { useVersions } from "@/hooks/use-tailoring";
import { useTemplates } from "@/hooks/use-templates";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { RecentResumes } from "@/components/dashboard/recent-resumes";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { DashboardSkeleton } from "@/components/skeletons/dashboard-skeleton";
import { ROUTES, API_BASE_URL } from "@/lib/constants";

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Unknown error";
}

export default function DashboardPage() {
  const {
    data: resumes = [],
    isLoading: resumesLoading,
    isError,
    error,
    refetch,
  } = useResumes();
  const { data: versions = [] } = useVersions();
  const { data: templates = [] } = useTemplates();

  if (isError) {
    return <BackendUnreachable error={error} onRetry={() => void refetch()} />;
  }

  if (resumesLoading) {
    return <DashboardSkeleton />;
  }

  const isFirstTime = resumes.length === 0;

  return (
    <div className="space-y-8">
      <Hero isFirstTime={isFirstTime} resumeCount={resumes.length} />

      {!isFirstTime && (
        <DashboardStats
          resumeCount={resumes.length}
          tailoringCount={versions.length}
          templateCount={templates.length}
        />
      )}

      {!isFirstTime && <RecentResumes resumes={resumes} />}

      <QuickActions />

      <LocalFirstFooter />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*                              Hero                                  */
/* ------------------------------------------------------------------ */

interface HeroProps {
  readonly isFirstTime: boolean;
  readonly resumeCount: number;
}

function Hero({ isFirstTime, resumeCount }: HeroProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-[oklch(0.55_0.2_260_/_10%)] via-[oklch(0.55_0.2_280_/_6%)] to-[oklch(0.55_0.2_300_/_10%)] p-8">
      <div className="gradient-orb gradient-orb-blue absolute -top-24 -right-20 h-56 w-56 opacity-50" />
      <div className="gradient-orb gradient-orb-purple absolute -bottom-20 -left-24 h-48 w-48 opacity-40" />

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur">
            <ShieldCheck className="h-3 w-3 text-emerald-500" />
            Local-first &middot; your data never leaves this machine
          </div>

          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            {isFirstTime ? (
              <>
                Welcome to{" "}
                <span className="bg-gradient-to-r from-[oklch(0.55_0.2_260)] to-[oklch(0.55_0.2_320)] bg-clip-text text-transparent">
                  Open Resume Studio
                </span>
              </>
            ) : (
              <>
                Welcome back
                <span className="text-[oklch(0.55_0.2_260)]">.</span>
              </>
            )}
          </h1>

          <p className="text-sm text-muted-foreground md:text-base">
            {isFirstTime
              ? "Build, edit, tailor, and generate cover letters for resumes — all on your machine, with the LLM provider you choose."
              : `You have ${resumeCount} ${resumeCount === 1 ? "resume" : "resumes"}. Pick a workflow below or jump into the AI editor.`}
          </p>
        </div>

        <div className="flex flex-col gap-2 lg:items-end">
          {isFirstTime ? (
            <>
              <Button
                size="lg"
                nativeButton={false}
                render={<Link href={ROUTES.ONBOARDING} />}
                className="bg-gradient-to-r from-[oklch(0.45_0.2_260)] to-[oklch(0.45_0.2_300)] text-white shadow-lg transition-shadow hover:shadow-xl"
              >
                <FilePlus className="mr-2 h-4 w-4" />
                Build your first resume
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                nativeButton={false}
                render={<Link href={ROUTES.TEMPLATES} />}
                className="text-muted-foreground"
              >
                Or browse templates first
              </Button>
            </>
          ) : (
            <>
              <Button
                size="lg"
                nativeButton={false}
                render={<Link href={ROUTES.EDITOR} />}
                className="bg-gradient-to-r from-[oklch(0.45_0.2_260)] to-[oklch(0.45_0.2_300)] text-white shadow-lg transition-shadow hover:shadow-xl"
              >
                <Wand2 className="mr-2 h-4 w-4" />
                Build Resume
              </Button>
              <Button
                size="sm"
                variant="ghost"
                nativeButton={false}
                render={<Link href={ROUTES.EDITOR} />}
                className="text-[oklch(0.45_0.2_260)] hover:text-[oklch(0.4_0.2_260)]"
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Open AI Editor
              </Button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*                       Local-first footer                           */
/* ------------------------------------------------------------------ */

function LocalFirstFooter() {
  return (
    <footer className="flex flex-col items-center gap-2 border-t border-border/40 pt-6 text-center text-xs text-muted-foreground sm:flex-row sm:justify-between sm:text-left">
      <p>
        Open Resume Studio runs entirely on your machine. AI calls go directly
        to the provider you configured.
      </p>
      <span className="inline-flex items-center gap-1">
        <Code className="h-3.5 w-3.5" />
        Open source &middot; MIT
      </span>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*                       Backend unreachable state                    */
/* ------------------------------------------------------------------ */

interface BackendUnreachableProps {
  readonly error: unknown;
  readonly onRetry: () => void;
}

function BackendUnreachable({ error, onRetry }: BackendUnreachableProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-10 text-center">
      <p className="text-sm font-medium text-destructive">
        Couldn&apos;t reach the backend at{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">{API_BASE_URL}</code>.
      </p>
      <p className="text-xs text-muted-foreground">{errorMessage(error)}</p>
      <p className="text-xs text-muted-foreground">
        Start it with{" "}
        <code className="rounded bg-muted px-1 py-0.5">./run.sh backend</code> or
        check that{" "}
        <code className="rounded bg-muted px-1 py-0.5">NEXT_PUBLIC_API_URL</code>{" "}
        points at the right port.
      </p>
      <Button size="sm" variant="outline" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

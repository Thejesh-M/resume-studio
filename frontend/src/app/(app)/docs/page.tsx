"use client";

import Link from "next/link";
import {
  BookOpen,
  Code as CodeIcon,
  Cpu,
  Database,
  HardDrive,
  ShieldCheck,
  Sparkles,
  Terminal,
  Wand2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 pb-12">
      {/* Hero */}
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur">
          <BookOpen className="h-3 w-3" />
          Documentation
        </div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Open Resume{" "}
          <span className="bg-gradient-to-r from-[oklch(0.55_0.2_260)] to-[oklch(0.55_0.2_320)] bg-clip-text text-transparent">
            Studio
          </span>
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          A local-first, open-source AI workspace for building, editing,
          tailoring, and writing cover letters for resumes. Everything runs on
          your machine; AI calls go straight to the provider you configured.
        </p>
      </header>

      {/* What it is */}
      <Section title="What is this?" icon={<Sparkles className="h-4 w-4" />}>
        <p>
          Open Resume Studio is a self-contained desktop-style web app. You run
          it locally — there&apos;s no signup, no cloud database, no telemetry,
          and no subscription. It bundles 15+ professionally-designed Typst
          templates and a multi-provider LLM layer so you can pick the AI
          backend that suits you (Gemini, OpenAI, Anthropic, or Ollama).
        </p>
        <FeatureGrid />
      </Section>

      {/* Setup */}
      <Section title="Setup" icon={<Terminal className="h-4 w-4" />}>
        <p className="mb-4">You need these on your machine:</p>
        <ul className="ml-5 list-disc space-y-1 text-sm">
          <li>
            <strong>Python 3.12+</strong>
          </li>
          <li>
            <strong>Node.js 20+</strong>
          </li>
          <li>
            <a
              href="https://typst.app/"
              className="text-[oklch(0.45_0.2_260)] underline-offset-4 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Typst
            </a>{" "}
            CLI on your <code className="px-1 text-xs">PATH</code> (for PDF
            compilation)
          </li>
          <li>
            An API key from a supported provider, or a local{" "}
            <a
              href="https://ollama.com/"
              className="text-[oklch(0.45_0.2_260)] underline-offset-4 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Ollama
            </a>{" "}
            instance for fully-offline use
          </li>
        </ul>

        <Step n={1} title="Clone and install">
          <Code>{`git clone https://github.com/<your-fork>/open-resume-studio.git
cd open-resume-studio

# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -e .

# Frontend
cd ../frontend
npm install`}</Code>
        </Step>

        <Step n={2} title="Configure your LLM provider">
          <p className="mb-2 text-sm">
            <strong>Option A — shell export</strong> (recommended for API
            keys; nothing on disk):
          </p>
          <Code>{`export LLM_PROVIDER=gemini
export GEMINI_API_KEY=sk-...`}</Code>
          <p className="mb-2 mt-3 text-sm">
            <strong>Option B — `.env` file.</strong> Copy{" "}
            <code className="px-1 text-xs">backend/.env.example</code> to{" "}
            <code className="px-1 text-xs">backend/.env</code> and edit:
          </p>
          <Code>{`LLM_PROVIDER=gemini
GEMINI_API_KEY=...

# ...or OpenAI
# LLM_PROVIDER=openai
# OPENAI_API_KEY=...

# ...or Anthropic
# LLM_PROVIDER=anthropic
# ANTHROPIC_API_KEY=...

# ...or a local Ollama model
# LLM_PROVIDER=ollama
# OLLAMA_MODEL=llama3.1`}</Code>
          <p className="mt-2 text-xs text-muted-foreground">
            Shell env vars always win over <code className="px-1">.env</code>,
            so you can mix both (defaults in the file, secrets in your shell).
          </p>
        </Step>

        <Step n={3} title="Run">
          <Code>{`./run.sh`}</Code>
          <p className="mt-2 text-sm text-muted-foreground">
            Backend on <code className="px-1 text-xs">http://localhost:8000</code>
            , frontend on{" "}
            <code className="px-1 text-xs">http://localhost:3000</code>. First
            run takes ~30s while Typst compiles the template previews.
          </p>
        </Step>
      </Section>

      {/* How to use */}
      <Section title="How to use" icon={<Wand2 className="h-4 w-4" />}>
        <Workflow
          step="1"
          title="Build a resume"
          description="Start from scratch or upload an existing PDF/DOCX. The LLM extracts structured content; you confirm the fields and pick a template."
        />
        <Workflow
          step="2"
          title="Edit with the AI Editor"
          description="Chat-based editing: rewrite bullets for impact, summarize a role, generate skills sections, or restructure the whole document."
        />
        <Workflow
          step="3"
          title="Tailor to a job description"
          description="Paste the JD, click Tailor. You get a tailored version with a clear diff against your base resume."
        />
        <Workflow
          step="4"
          title="Generate a cover letter"
          description="From any resume + JD pair, generate a cover letter draft you can copy or refine further."
        />
        <Workflow
          step="5"
          title="Swap templates anytime"
          description="Pick from 15+ Typst layouts. Compilation happens locally — no proprietary engine."
        />
      </Section>

      {/* Where things live */}
      <Section title="Where your data lives" icon={<HardDrive className="h-4 w-4" />}>
        <div className="grid gap-3 sm:grid-cols-2">
          <DataCard
            label="SQLite database"
            path="data/open_resume_studio.db"
            description="Resumes, job descriptions, tailored versions, cover letters."
          />
          <DataCard
            label="Uploaded files"
            path="data/storage/"
            description="Original PDF/DOCX uploads, generated PDFs, per-resume template copies."
          />
          <DataCard
            label="Template previews"
            path="frontend/public/previews/"
            description="PNGs auto-generated from each Typst template on first boot."
          />
          <DataCard
            label="Bundled templates"
            path="backend/templates/"
            description="The Typst source for every variant — add your own here."
          />
        </div>
        <p className="mt-4 rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs text-emerald-700 dark:text-emerald-300">
          <ShieldCheck className="mr-1 inline h-3.5 w-3.5" />
          Nothing leaves your machine unless you explicitly call an external LLM
          provider you configured.
        </p>
      </Section>

      {/* LLM providers */}
      <Section title="LLM providers" icon={<Cpu className="h-4 w-4" />}>
        <p className="mb-3">
          Set <code className="px-1 text-xs">LLM_PROVIDER</code> in{" "}
          <code className="px-1 text-xs">backend/.env</code>:
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <ProviderCard
            name="Gemini"
            envVar="GEMINI_API_KEY"
            default="gemini-2.5-flash"
            note="Best PDF parsing via the Files API."
          />
          <ProviderCard
            name="OpenAI"
            envVar="OPENAI_API_KEY"
            default="gpt-4o-mini"
            note="Strong JSON mode, broad availability."
          />
          <ProviderCard
            name="Anthropic"
            envVar="ANTHROPIC_API_KEY"
            default="claude-sonnet-4-6"
            note="Excellent at long-form rewriting."
          />
          <ProviderCard
            name="Ollama"
            envVar="OLLAMA_MODEL"
            default="llama3.1"
            note="Fully offline. Runs against http://localhost:11434."
          />
        </div>
      </Section>

      {/* Database */}
      <Section title="Database" icon={<Database className="h-4 w-4" />}>
        <p>
          SQLite is the default and requires zero setup. Tables and bundled
          templates are auto-created on first run.
        </p>
        <p>
          To use Postgres instead, set{" "}
          <code className="px-1 text-xs">DATABASE_URL</code> in{" "}
          <code className="px-1 text-xs">backend/.env</code>:
        </p>
        <Code>{`DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/open_resume_studio`}</Code>
      </Section>

      {/* Attributions */}
      <Section title="Template attribution" icon={<CodeIcon className="h-4 w-4" />}>
        <p className="mb-4">
          The bundled Typst templates are adapted from these open-source
          projects. Big thanks to their authors — please star the originals if
          you find them useful.
        </p>
        <div className="space-y-2">
          {TEMPLATE_SOURCES.map((t) => (
            <AttributionRow key={t.path} {...t} />
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          The remaining bundled templates (Classic Serif, Modern Blue, Creative
          Purple, Academic Serif &amp; Template 2, Cover Letter Template 1
          &amp; 2, Two-Column Template 2) are original to this project and ship
          under the same MIT license as the rest of the codebase.
        </p>
      </Section>

      {/* Footer */}
      <footer className="border-t border-border/40 pt-6 text-center text-xs text-muted-foreground">
        <p>
          MIT-licensed. Contributions welcome — see{" "}
          <Link
            href="/dashboard"
            className="text-[oklch(0.45_0.2_260)] hover:underline"
          >
            CONTRIBUTING.md
          </Link>{" "}
          in the repo.
        </p>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*                            Sub-components                          */
/* ------------------------------------------------------------------ */

interface SectionProps {
  readonly title: string;
  readonly icon: React.ReactNode;
  readonly children: React.ReactNode;
}

function Section({ title, icon, children }: SectionProps) {
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-xl font-semibold">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-[oklch(0.55_0.2_260_/_15%)] to-[oklch(0.55_0.2_300_/_15%)] text-[oklch(0.45_0.2_260)]">
          {icon}
        </span>
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground [&_strong]:text-foreground">
        {children}
      </div>
    </section>
  );
}

interface StepProps {
  readonly n: number;
  readonly title: string;
  readonly children: React.ReactNode;
}

function Step({ n, title, children }: StepProps) {
  return (
    <div className="mt-4 space-y-2">
      <p className="text-sm font-semibold text-foreground">
        <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-[oklch(0.55_0.2_260)] to-[oklch(0.55_0.2_300)] text-[11px] text-white">
          {n}
        </span>
        {title}
      </p>
      {children}
    </div>
  );
}

function Code({ children }: { readonly children: React.ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded-md border border-border/50 bg-muted/40 p-3 text-xs leading-relaxed">
      <code>{children}</code>
    </pre>
  );
}

interface WorkflowProps {
  readonly step: string;
  readonly title: string;
  readonly description: string;
}

function Workflow({ step, title, description }: WorkflowProps) {
  return (
    <div className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-semibold text-muted-foreground">
        {step}
      </span>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

interface DataCardProps {
  readonly label: string;
  readonly path: string;
  readonly description: string;
}

function DataCard({ label, path, description }: DataCardProps) {
  return (
    <Card className="border-border/50">
      <CardContent className="space-y-1 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="font-mono text-xs text-[oklch(0.45_0.2_260)]">{path}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

interface ProviderCardProps {
  readonly name: string;
  readonly envVar: string;
  readonly default: string;
  readonly note: string;
}

function ProviderCard({ name, envVar, default: model, note }: ProviderCardProps) {
  return (
    <Card className="border-border/50">
      <CardContent className="space-y-1 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">{name}</p>
          <Badge variant="outline" className="text-[10px]">
            {model}
          </Badge>
        </div>
        <p className="font-mono text-xs text-muted-foreground">{envVar}</p>
        <p className="text-xs text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  );
}

interface AttributionRowProps {
  readonly templateName: string;
  readonly path: string;
  readonly source: string;
  readonly author: string;
}

function AttributionRow({
  templateName,
  path,
  source,
  author,
}: AttributionRowProps) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-border/40 bg-muted/20 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-foreground">{templateName}</p>
        <p className="font-mono text-[11px] text-muted-foreground">{path}</p>
      </div>
      <a
        href={source}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-[oklch(0.45_0.2_260)] hover:underline"
      >
        @{author} ↗
      </a>
    </div>
  );
}

function FeatureGrid() {
  const features = [
    { label: "Build resumes from PDFs", icon: Sparkles },
    { label: "Tailor to any JD", icon: Wand2 },
    { label: "AI-powered editing", icon: Cpu },
    { label: "15+ Typst templates", icon: BookOpen },
  ] as const;
  return (
    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {features.map((f) => (
        <div
          key={f.label}
          className="flex flex-col items-start gap-1 rounded-md border border-border/40 bg-muted/20 px-3 py-2"
        >
          <f.icon className="h-3.5 w-3.5 text-[oklch(0.45_0.2_260)]" />
          <p className="text-xs font-medium text-foreground">{f.label}</p>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*                       Template attribution                         */
/* ------------------------------------------------------------------ */

const TEMPLATE_SOURCES: readonly AttributionRowProps[] = [
  {
    templateName: "Classic — Template 2",
    path: "classic/template-2",
    source: "https://github.com/austinyu/fantastic-cv",
    author: "austinyu/fantastic-cv",
  },
  {
    templateName: "Classic — Template 3",
    path: "classic/template-3",
    source: "https://github.com/roaldarbol/academicv",
    author: "roaldarbol/academicv",
  },
  {
    templateName: "Classic — Template 4",
    path: "classic/template-4",
    source: "https://github.com/jskherman/imprecv",
    author: "jskherman/imprecv",
  },
  {
    templateName: "Modern — Template 1",
    path: "modern/template-1",
    source: "https://github.com/ptsouchlos/modern-cv",
    author: "ptsouchlos/modern-cv",
  },
  {
    templateName: "Modern — Modern Plain",
    path: "modern/modern-plain",
    source: "https://github.com/jxpeng98/Typst-CV-Resume",
    author: "jxpeng98/Typst-CV-Resume",
  },
  {
    templateName: "Two-Column — Modern Resume",
    path: "two-column/modern-resume",
    source: "https://github.com/peterpf/modern-typst-resume",
    author: "peterpf/modern-typst-resume",
  },
  {
    templateName: "Two-Column — Template 3",
    path: "two-column/template-3",
    source: "https://github.com/xrsl/nabcv",
    author: "xrsl/nabcv",
  },
];

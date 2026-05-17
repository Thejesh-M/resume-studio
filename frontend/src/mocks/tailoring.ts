import type {
  ScoreResult,
  GapAnalysis,
  TailoredVersion,
  TailoringTaskStatus,
  TailoringStatus,
} from "@/types/tailoring";

export const MOCK_SCORE_RESULT: ScoreResult = {
  overallScore: 62,
  breakdown: {
    keywordMatch: 55,
    experienceAlignment: 70,
    skillsCoverage: 50,
    educationMatch: 85,
    quantification: 60,
    sectionCompleteness: 52,
  },
  summary:
    "Your resume has a moderate ATS score. Strong education and experience alignment, but keyword coverage and skills matching need improvement for this role.",
  quickWins: [
    {
      suggestion: 'Add "Kubernetes" and "CI/CD" to your skills section',
      impact: "high",
    },
    {
      suggestion: "Quantify your impact in the first two bullet points",
      impact: "high",
    },
    {
      suggestion: "Include the company's industry keywords in your summary",
      impact: "medium",
    },
    {
      suggestion: "Add a projects section to showcase relevant work",
      impact: "low",
    },
  ],
};

export const MOCK_GAP_ANALYSIS: GapAnalysis = {
  missingHardSkills: [
    {
      skill: "Kubernetes",
      importance: "must_have",
      suggestion:
        'Mention your container orchestration experience in the TechCorp role',
    },
    {
      skill: "Terraform",
      importance: "must_have",
      suggestion:
        "Add infrastructure-as-code experience if applicable",
    },
    {
      skill: "Go",
      importance: "nice_to_have",
      suggestion: "Mention any Go projects or contributions",
    },
  ],
  weakBullets: [
    {
      bullet: "Mentored 4 junior engineers through structured 1:1s and code review sessions",
      issue: "Not aligned with the JD's focus on technical leadership and architecture",
      jdAlignment: "low",
    },
    {
      bullet: "Developed customer-facing dashboard with React and TypeScript, improving user engagement by 35%",
      issue: "Could emphasize backend systems and scalability aspects more",
      jdAlignment: "medium",
    },
  ],
  missingKeywords: [
    "infrastructure as code",
    "observability",
    "SRE",
    "incident response",
    "service mesh",
  ],
  experienceGaps: [
    "No mention of on-call or incident management experience",
    "Limited infrastructure/DevOps focus in current bullet points",
  ],
  strengthsToEmphasize: [
    "Strong microservices migration experience — highly relevant",
    "CI/CD pipeline implementation — good alignment",
    "Real-time systems experience with WebSockets",
  ],
};

const PIPELINE_STEPS: readonly { status: TailoringStatus; label: string; pct: number }[] = [
  { status: "analyzing_jd", label: "Analyzing job description...", pct: 15 },
  { status: "scoring", label: "Scoring current resume...", pct: 30 },
  { status: "finding_gaps", label: "Finding skill gaps...", pct: 50 },
  { status: "rewriting", label: "Rewriting content...", pct: 75 },
  { status: "compiling", label: "Compiling PDF...", pct: 90 },
  { status: "completed", label: "Done!", pct: 100 },
];

export function createMockPipelineIterator(taskId: string) {
  let stepIndex = 0;

  return function next(): TailoringTaskStatus {
    const step = PIPELINE_STEPS[Math.min(stepIndex, PIPELINE_STEPS.length - 1)];
    stepIndex++;
    return {
      taskId,
      status: step.status,
      currentStep: step.label,
      progressPct: step.pct,
    };
  };
}

export const MOCK_TAILORED_VERSION: TailoredVersion = {
  id: "tv-mock-001",
  userResumeId: "resume-mock-001",
  jdId: "jd-mock-001",
  tailoredContent: {},
  pdfUrl: "/mock-tailored.pdf",
  scoreBefore: 62,
  scoreAfter: 89,
  diff: [
    {
      section: "Summary",
      original:
        "Full-stack software engineer with 5+ years of experience building scalable web applications.",
      tailored:
        "Platform engineer with 5+ years building and operating scalable distributed systems, with expertise in Kubernetes, CI/CD pipelines, and cloud-native infrastructure on GCP.",
    },
    {
      section: "Experience — TechCorp — Bullet 1",
      original:
        "Led migration of monolithic application to microservices architecture, reducing deployment time by 60%",
      tailored:
        "Led migration of monolithic application to Kubernetes-based microservices architecture, reducing deployment time by 60% and improving service reliability to 99.95% uptime",
    },
    {
      section: "Experience — TechCorp — Bullet 4",
      original:
        "Implemented CI/CD pipeline with GitHub Actions, achieving 95% test coverage",
      tailored:
        "Designed and maintained CI/CD pipelines with GitHub Actions and Terraform, achieving 95% test coverage with automated canary deployments and rollback procedures",
    },
    {
      section: "Skills",
      original:
        "TypeScript, React, Node.js, Python, PostgreSQL, AWS, Docker, Kubernetes, GraphQL, CI/CD",
      tailored:
        "TypeScript, Python, Go, Kubernetes, Terraform, Docker, GCP, PostgreSQL, CI/CD, Observability (Datadog), GitHub Actions, gRPC",
    },
  ],
  creditsUsed: 1,
  createdAt: new Date().toISOString(),
};

export type TailoringStatus =
  | "processing"
  | "analyzing_jd"
  | "scoring"
  | "finding_gaps"
  | "rewriting"
  | "compiling"
  | "completed"
  | "failed";

export interface ScoreBreakdown {
  readonly keywordMatch: number;
  readonly experienceAlignment: number;
  readonly skillsCoverage: number;
  readonly educationMatch: number;
  readonly quantification: number;
  readonly sectionCompleteness: number;
}

export interface QuickWin {
  readonly suggestion: string;
  readonly impact: "high" | "medium" | "low";
}

export interface ScoreResult {
  readonly overallScore: number;
  readonly breakdown: ScoreBreakdown;
  readonly summary: string;
  readonly quickWins: readonly QuickWin[];
}

export interface MissingSkill {
  readonly skill: string;
  readonly importance: "must_have" | "nice_to_have";
  readonly suggestion: string;
}

export interface WeakBullet {
  readonly bullet: string;
  readonly issue: string;
  readonly jdAlignment: "low" | "medium" | "high";
}

export interface GapAnalysis {
  readonly missingHardSkills: readonly MissingSkill[];
  readonly weakBullets: readonly WeakBullet[];
  readonly missingKeywords: readonly string[];
  readonly experienceGaps: readonly string[];
  readonly strengthsToEmphasize: readonly string[];
}

export interface TailoringTaskStatus {
  readonly taskId: string;
  readonly status: TailoringStatus;
  readonly currentStep: string;
  readonly progressPct: number;
}

export interface DiffChange {
  readonly section: string;
  readonly original: string;
  readonly tailored: string;
}

export interface TailoredVersion {
  readonly id: string;
  readonly userResumeId: string;
  readonly jdId: string;
  readonly tailoredContent: Record<string, unknown>;
  readonly pdfUrl: string;
  readonly scoreBefore: number;
  readonly scoreAfter: number;
  readonly diff: readonly DiffChange[];
  readonly creditsUsed: number;
  readonly createdAt: string;
}

export interface JDAnalysis {
  readonly company: string;
  readonly role: string;
  readonly seniorityLevel: string;
  readonly mustHaveSkills: readonly string[];
  readonly niceToHaveSkills: readonly string[];
  readonly requiredExperienceYears: number | null;
  readonly requiredEducation: string | null;
  readonly keyResponsibilities: readonly string[];
  readonly industryKeywords: readonly string[];
  readonly softSkills: readonly string[];
  readonly tone: string;
}

export interface JobDescription {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly company: string;
  readonly rawText: string;
  readonly agentAnalysis: JDAnalysis | null;
  readonly sourceUrl: string | null;
  readonly createdAt: string;
}

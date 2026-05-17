export interface ContactInfo {
  readonly name: string;
  readonly email: string;
  readonly phone?: string;
  readonly linkedin?: string;
  readonly github?: string;
  readonly location?: string;
  readonly website?: string;
  readonly address?: string;
  readonly titles?: readonly string[];
}

export interface ExperienceEntry {
  readonly company: string;
  readonly title: string;
  readonly dates: string;
  readonly location?: string;
  readonly bullets: readonly string[];
}

export interface EducationEntry {
  readonly institution: string;
  readonly degree: string;
  readonly field: string;
  readonly dates: string;
  readonly gpa?: string;
}

export interface SkillGroup {
  readonly category: string;
  readonly items: readonly string[];
}

export interface CertificationEntry {
  readonly name: string;
  readonly issuer: string;
  readonly date?: string;
}

export interface ProjectEntry {
  readonly name: string;
  readonly dates?: string;
  readonly description: string;
  readonly url?: string;
}

export interface AwardEntry {
  readonly title: string;
  readonly awarder: string;
  readonly date?: string;
  readonly summary?: string;
}

export interface PublicationEntry {
  readonly title: string;
  readonly authors?: string;
  readonly venue?: string;
  readonly date?: string;
  readonly url?: string;
}

export interface VolunteerEntry {
  readonly organization: string;
  readonly role: string;
  readonly dates?: string;
  readonly description?: string;
}

export interface ReferenceEntry {
  readonly name: string;
  readonly title?: string;
  readonly institution?: string;
  readonly email?: string;
  readonly phone?: string;
}

export interface AffiliationEntry {
  readonly organization: string;
  readonly role?: string;
  readonly dates?: string;
}

export const DEFAULT_SECTION_ORDER = [
  "summary",
  "experience",
  "education",
  "skills",
  "projects",
  "certifications",
  "awards",
  "publications",
  "languages",
  "interests",
  "volunteers",
  "affiliations",
  "references",
] as const;

export type SectionKey = (typeof DEFAULT_SECTION_ORDER)[number];

export interface ResumeContent {
  readonly contact: ContactInfo;
  readonly summary: string;
  readonly experience: readonly ExperienceEntry[];
  readonly education: readonly EducationEntry[];
  readonly skills: readonly SkillGroup[];
  readonly certifications?: readonly CertificationEntry[];
  readonly projects?: readonly ProjectEntry[];
  readonly awards?: readonly AwardEntry[];
  readonly publications?: readonly PublicationEntry[];
  readonly languages?: readonly string[];
  readonly interests?: readonly string[];
  readonly volunteers?: readonly VolunteerEntry[];
  readonly references?: readonly ReferenceEntry[];
  readonly affiliations?: readonly AffiliationEntry[];
  readonly section_order?: readonly string[];
}

export interface UserResume {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  // Raw-PDF uploads have no template or structured content.
  readonly templateId: string | null;
  readonly content: ResumeContent | null;
  readonly compiledSource: string | null;
  readonly basePdfUrl: string | null;
  readonly isDefault: boolean;
  /** True when the resume is an uploaded PDF used verbatim (no extraction, no tailoring). */
  readonly isRawUpload: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

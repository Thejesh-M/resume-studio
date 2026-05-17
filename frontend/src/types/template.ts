export type TemplateCategory =
  | "classic"
  | "modern"
  | "two-column"
  | "academic"
  | "cover-letter"
  | "creative";

export type TemplateEngine = "latex" | "typst";

export interface Template {
  readonly id: string;
  readonly name: string;
  readonly category: TemplateCategory;
  readonly variant: string; // e.g. "modern-blue", "classic-serif"
  readonly previewUrl: string;
  readonly pdfUrl?: string; // scrollable PDF shown in preview modal
  readonly engine: TemplateEngine;
  readonly isAtsTested: boolean;
  readonly createdAt: string;
}

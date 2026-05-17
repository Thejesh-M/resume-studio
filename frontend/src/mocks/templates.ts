import type { Template } from "@/types/template";

/**
 * Mock templates used when NEXT_PUBLIC_USE_MOCKS=true.
 * Preview/pdf URLs point at the auto-generated assets under
 * `frontend/public/previews/<category>/<variant>.{png,pdf}`.
 */

function mockTemplate(
  category: Template["category"],
  variant: string,
  name: string,
  id: string,
  isAtsTested = true,
): Template {
  const base = `/previews/${category}/${variant}`;
  return {
    id,
    name,
    category,
    variant,
    previewUrl: `${base}.png`,
    pdfUrl: `${base}.pdf`,
    engine: "typst",
    isAtsTested,
    createdAt: "2026-01-01T00:00:00Z",
  };
}

export const MOCK_TEMPLATES: readonly Template[] = [
  mockTemplate("classic", "classic-serif", "Classic Serif", "00000000-0000-0000-0000-000000000001"),
  mockTemplate("classic", "template-2", "Classic Template 2", "00000000-0000-0000-0000-000000000002"),
  mockTemplate("classic", "template-3", "Classic Template 3", "00000000-0000-0000-0000-000000000003"),
  mockTemplate("classic", "template-4", "Classic Template 4", "00000000-0000-0000-0000-000000000004"),
  mockTemplate("modern", "modern-blue", "Modern Blue", "00000000-0000-0000-0000-000000000005"),
  mockTemplate("modern", "modern-plain", "Modern Plain", "00000000-0000-0000-0000-000000000006"),
  mockTemplate("modern", "template-1", "Modern Template 1", "00000000-0000-0000-0000-000000000007"),
  mockTemplate("two-column", "modern-resume", "Two-Column Resume", "00000000-0000-0000-0000-000000000008"),
  mockTemplate("two-column", "template-2", "Two-Column Template 2", "00000000-0000-0000-0000-000000000009"),
  mockTemplate("two-column", "template-3", "Two-Column Template 3", "00000000-0000-0000-0000-000000000010"),
  mockTemplate("academic", "academic-serif", "Academic Serif", "00000000-0000-0000-0000-000000000011"),
  mockTemplate("academic", "template-2", "Academic Template 2", "00000000-0000-0000-0000-000000000012"),
  mockTemplate("creative", "creative-purple", "Creative Purple", "00000000-0000-0000-0000-000000000013"),
  mockTemplate("cover-letter", "template-1", "Cover Letter Template 1", "00000000-0000-0000-0000-000000000014", false),
  mockTemplate("cover-letter", "template-2", "Cover Letter Template 2", "00000000-0000-0000-0000-000000000015", false),
];

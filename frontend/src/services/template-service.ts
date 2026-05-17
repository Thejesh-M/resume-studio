import { apiClient } from "./api-client";
import { USE_MOCKS } from "@/lib/constants";
import { MOCK_TEMPLATES } from "@/mocks/templates";
import type { Template, TemplateCategory } from "@/types/template";

interface RawTemplate {
  id: string;
  name: string;
  category: string;
  variant: string;
  preview_url: string | null;
  engine: string;
  is_ats_tested: boolean;
  created_at: string;
}

// PDF companions follow the same basename as preview PNGs (e.g.
// "/templates/foo-preview.png" ↔ "/templates/foo-preview.pdf"). Multi-page
// templates have page images suffixed "-1.png", "-2.png", … but a single PDF.
// So we strip a trailing "-N" before swapping the extension.
function derivePdfUrl(previewUrl: string | null | undefined): string | undefined {
  if (!previewUrl) return undefined;
  const match = previewUrl.match(/^(.*?)(?:-\d+)?\.png(\?.*)?$/i);
  if (!match) return undefined;
  const base = match[1];
  const query = match[2] ?? "";
  return `${base}.pdf${query}`;
}

function toTemplate(raw: RawTemplate): Template {
  const previewUrl = raw.preview_url ?? "";
  return {
    id: raw.id,
    name: raw.name,
    category: raw.category as Template["category"],
    variant: raw.variant,
    previewUrl,
    pdfUrl: derivePdfUrl(previewUrl),
    engine: raw.engine as Template["engine"],
    isAtsTested: raw.is_ats_tested,
    createdAt: raw.created_at,
  };
}

export interface TemplateListParams {
  readonly category?: TemplateCategory;
}

async function fetchTemplates(
  params?: TemplateListParams
): Promise<readonly Template[]> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 500));
    let templates = [...MOCK_TEMPLATES];
    if (params?.category) {
      templates = templates.filter((t) => t.category === params.category);
    }
    return templates;
  }

  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.set("category", params.category);

  const query = searchParams.toString();
  const endpoint = `/templates${query ? `?${query}` : ""}`;
  const raw = await apiClient.get<RawTemplate[]>(endpoint);
  return raw.map(toTemplate);
}

async function fetchTemplateById(id: string): Promise<Template> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 300));
    const template = MOCK_TEMPLATES.find((t) => t.id === id);
    if (!template) throw new Error(`Template ${id} not found`);
    return template;
  }

  const raw = await apiClient.get<RawTemplate>(`/templates/${id}`);
  return toTemplate(raw);
}

export const templateService = {
  list: fetchTemplates,
  getById: fetchTemplateById,
};

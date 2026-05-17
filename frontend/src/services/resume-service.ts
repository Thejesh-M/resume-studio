import { apiClient } from "./api-client";
import { USE_MOCKS } from "@/lib/constants";
import { MOCK_EXTRACTED_CONTENT } from "@/mocks/resume-content";
import { mockResumeStore } from "@/mocks/resumes";
import type { ResumeContent, UserResume } from "@/types/resume";

interface RawResume {
  id: string;
  user_id: string;
  title: string;
  template_id: string | null;
  content: ResumeContent | null;
  compiled_source: string | null;
  base_pdf_url: string | null;
  is_default: boolean;
  is_raw_upload: boolean;
  created_at: string;
  updated_at: string;
}

interface RawExtractionResult {
  content: ResumeContent;
  extraction_id: string;
}

function toUserResume(raw: RawResume): UserResume {
  return {
    id: raw.id,
    userId: raw.user_id,
    title: raw.title,
    templateId: raw.template_id,
    content: raw.content,
    compiledSource: raw.compiled_source,
    basePdfUrl: raw.base_pdf_url,
    isDefault: raw.is_default,
    isRawUpload: raw.is_raw_upload ?? false,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export interface ExtractionResult {
  readonly content: ResumeContent;
  readonly extractionId: string;
}

async function uploadAndExtract(file: File): Promise<ExtractionResult> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 2000));
    return { content: MOCK_EXTRACTED_CONTENT, extractionId: "mock-extraction-id" };
  }
  const raw = await apiClient.upload<RawExtractionResult>("/resumes/extract", file);
  return { content: raw.content, extractionId: raw.extraction_id };
}

interface CreateResumePayload {
  readonly title: string;
  readonly templateId: string;
  readonly content: ResumeContent;
  readonly extractionId?: string;
}

async function createResume(payload: CreateResumePayload): Promise<UserResume> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 1000));
    const resume: UserResume = {
      id: `resume-${Date.now()}`,
      userId: "mock-user",
      title: payload.title,
      templateId: payload.templateId,
      content: payload.content,
      compiledSource: null,
      basePdfUrl: null,
      isDefault: mockResumeStore.list().length === 0,
      isRawUpload: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockResumeStore.add(resume);
    return resume;
  }
  const raw = await apiClient.post<RawResume>("/resumes", {
    title: payload.title,
    template_id: payload.templateId,
    content: payload.content,
    extraction_id: payload.extractionId ?? null,
  });
  return toUserResume(raw);
}

async function uploadRawPdfResume(title: string, file: File): Promise<UserResume> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 1000));
    const resume: UserResume = {
      id: `resume-${Date.now()}`,
      userId: "mock-user",
      title,
      templateId: null,
      content: null,
      compiledSource: null,
      basePdfUrl: `mock://uploads/${encodeURIComponent(file.name)}`,
      isDefault: mockResumeStore.list().length === 0,
      isRawUpload: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockResumeStore.add(resume);
    return resume;
  }
  const form = new FormData();
  form.append("title", title);
  form.append("file", file);
  const raw = await apiClient.upload<RawResume>("/resumes/raw-upload", form);
  return toUserResume(raw);
}

async function listResumes(): Promise<readonly UserResume[]> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 500));
    return mockResumeStore.list();
  }
  const raw = await apiClient.get<RawResume[]>("/resumes");
  return raw.map(toUserResume);
}

async function getResumeById(id: string): Promise<UserResume> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 300));
    const resume = mockResumeStore.getById(id);
    if (!resume) throw new Error(`Resume ${id} not found`);
    return resume;
  }
  const raw = await apiClient.get<RawResume>(`/resumes/${encodeURIComponent(id)}`);
  return toUserResume(raw);
}

async function copyResume(id: string, title?: string): Promise<UserResume> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 500));
    const source = mockResumeStore.getById(id);
    if (!source) throw new Error(`Resume ${id} not found`);
    const copy: UserResume = {
      ...source,
      id: `resume-${Date.now()}`,
      title: title?.trim() || `Copy of ${source.title}`,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockResumeStore.add(copy);
    return copy;
  }
  const form = new FormData();
  if (title) form.append("title", title);
  const raw = await apiClient.upload<RawResume>(
    `/resumes/${encodeURIComponent(id)}/copy`,
    form,
  );
  return toUserResume(raw);
}

interface UpdateResumePayload {
  readonly title?: string;
  readonly content?: ResumeContent;
  readonly templateId?: string;
  readonly isDefault?: boolean;
}

async function updateResume(
  id: string,
  payload: UpdateResumePayload
): Promise<UserResume> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 500));
    const updated = mockResumeStore.update(id, payload);
    if (!updated) throw new Error(`Resume ${id} not found`);
    return updated;
  }
  const raw = await apiClient.patch<RawResume>(`/resumes/${encodeURIComponent(id)}`, {
    title: payload.title,
    content: payload.content,
    template_id: payload.templateId,
    is_default: payload.isDefault,
  });
  return toUserResume(raw);
}

async function deleteResume(id: string): Promise<void> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 300));
    mockResumeStore.delete(id);
    return;
  }
  await apiClient.delete(`/resumes/${encodeURIComponent(id)}`);
}

async function compileResume(id: string, content: ResumeContent): Promise<Blob> {
  if (USE_MOCKS) {
    // In mock mode, return an empty PDF-like blob
    await new Promise((r) => setTimeout(r, 800));
    return new Blob([], { type: "application/pdf" });
  }
  return apiClient.postBinary(`/resumes/${encodeURIComponent(id)}/compile`, { content });
}

export interface ChatResult {
  readonly reply: string;
  readonly updatedContent: ResumeContent;
  readonly changed: readonly string[];
  readonly templateChanged: boolean;
}

async function chatResume(
  id: string,
  message: string,
  currentContent: ResumeContent
): Promise<ChatResult> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 1500));
    return {
      reply: "I've reviewed your resume. Here's what I'd suggest (mock mode — connect to backend for real AI edits).",
      updatedContent: currentContent,
      changed: [],
      templateChanged: false,
    };
  }
  const raw = await apiClient.post<{
    reply: string;
    updated_content: ResumeContent;
    changed: string[];
    template_changed: boolean;
  }>(`/resumes/${encodeURIComponent(id)}/chat`, {
    message,
    current_content: currentContent,
  });
  return {
    reply: raw.reply,
    updatedContent: raw.updated_content,
    changed: raw.changed,
    templateChanged: raw.template_changed,
  };
}

// ── Template file types ──────────────────────────────────────────────────────

export interface TemplateFileEntry {
  readonly path: string;
  readonly size: number;
}

export interface TemplateFileContent {
  readonly path: string;
  readonly content: string;
}

export interface TemplateFileChange {
  readonly file_path: string;
  readonly content: string;
}

export interface TemplateEditResult {
  readonly reply: string;
  readonly changes: readonly TemplateFileChange[];
}

// ── Template file API ────────────────────────────────────────────────────────

async function listTemplateFiles(resumeId: string): Promise<readonly TemplateFileEntry[]> {
  const result = await apiClient.get<{ files: TemplateFileEntry[] }>(
    `/resumes/${encodeURIComponent(resumeId)}/template-files`
  );
  return result.files;
}

async function readTemplateFile(resumeId: string, filePath: string): Promise<TemplateFileContent> {
  return apiClient.get<TemplateFileContent>(
    `/resumes/${encodeURIComponent(resumeId)}/template-files/${filePath}`
  );
}

async function writeTemplateFile(
  resumeId: string,
  filePath: string,
  content: string
): Promise<TemplateFileContent> {
  return apiClient.put<TemplateFileContent>(
    `/resumes/${encodeURIComponent(resumeId)}/template-files/${filePath}`,
    { content }
  );
}

async function resetTemplate(resumeId: string): Promise<void> {
  await apiClient.post(`/resumes/${encodeURIComponent(resumeId)}/template-reset`);
}

async function aiEditTemplate(
  resumeId: string,
  message: string,
  targetFile?: string
): Promise<TemplateEditResult> {
  return apiClient.post<TemplateEditResult>(
    `/resumes/${encodeURIComponent(resumeId)}/template-edit`,
    { message, target_file: targetFile ?? null }
  );
}

export const resumeService = {
  uploadAndExtract,
  create: createResume,
  uploadRawPdf: uploadRawPdfResume,
  copy: copyResume,
  list: listResumes,
  getById: getResumeById,
  update: updateResume,
  delete: deleteResume,
  compile: compileResume,
  chat: chatResume,
  listTemplateFiles,
  readTemplateFile,
  writeTemplateFile,
  resetTemplate,
  aiEditTemplate,
};

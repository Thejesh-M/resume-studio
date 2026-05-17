export const APP_NAME = "Open Resume Studio";

const _API_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** Full base URL including /api/v1 prefix — all service calls are relative to this. */
export const API_BASE_URL = `${_API_ORIGIN}/api/v1`;

export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

export const ROUTES = {
  HOME: "/",
  ONBOARDING: "/onboarding",
  DASHBOARD: "/dashboard",
  RESUMES: "/resumes",
  RESUME_DETAIL: (id: string) => `/resumes/${id}` as const,
  EDITOR: "/editor",
  RESUME_EDITOR: (id: string) => `/editor?resumeId=${id}` as const,
  RESUME_TAILOR: (id: string) => `/resumes/${id}/tailor` as const,
  TAILOR: "/tailor",
  TEMPLATES: "/templates",
  COVER_LETTER: "/cover-letter",
  DOCS: "/docs",
} as const;

export const POLLING_INTERVAL_MS = 2000;
export const MAX_FILE_SIZE_MB = 10;
export const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

/**
 * Validates that a redirect path is safe (relative, starts with /).
 * Prevents open redirect attacks via query parameters.
 */
export function isSafeRedirect(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//");
}

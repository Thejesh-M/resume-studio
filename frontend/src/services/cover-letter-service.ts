import { apiClient } from "./api-client";
import { USE_MOCKS } from "@/lib/constants";
import { MOCK_COVER_LETTER } from "@/mocks/cover-letter";
import type { ApiResponse } from "@/types/api";

// ── Types ─────────────────────────────────────────────────────────────

export interface CoverLetterContent {
  readonly subjectLine: string;
  readonly salutation: string;
  readonly body: string;
  readonly closing: string;
}

export interface CoverLetterResult {
  readonly id: string;
  readonly resumeId: string;
  readonly status: string;
  readonly content: CoverLetterContent | null;
  readonly creditsUsed: number;
  readonly createdAt: string;
}

interface StartResponse {
  readonly taskId: string;
}

// ── Start (async) ─────────────────────────────────────────────────────

async function start(params: {
  resumeId: string;
  jdText: string;
}): Promise<string> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 500));
    return `mock-cover-letter-${Date.now()}`;
  }

  const res = await apiClient.post<ApiResponse<StartResponse>>(
    "/cover-letter/generate",
    { resume_id: params.resumeId, jd_text: params.jdText }
  );
  return res.data!.taskId;
}

// ── Get result ────────────────────────────────────────────────────────

async function getResult(taskId: string): Promise<CoverLetterResult> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 300));
    return {
      id: taskId,
      resumeId: "mock-resume",
      status: "completed",
      content: {
        subjectLine: "Application for Software Engineer",
        salutation: "Dear Hiring Manager,",
        body: MOCK_COVER_LETTER,
        closing: "Best regards,",
      },
      creditsUsed: 1,
      createdAt: new Date().toISOString(),
    };
  }

  const res = await apiClient.get<ApiResponse<{ id: string; resume_id: string; status: string; content: string | null; credits_used: number; created_at: string }>>(
    `/cover-letter/result/${encodeURIComponent(taskId)}`
  );

  const raw = res.data!;
  let parsedContent: CoverLetterContent | null = null;
  if (raw.content) {
    try {
      parsedContent = JSON.parse(raw.content) as CoverLetterContent;
    } catch {
      parsedContent = null;
    }
  }

  return {
    id: raw.id,
    resumeId: raw.resume_id,
    status: raw.status,
    content: parsedContent,
    creditsUsed: raw.credits_used,
    createdAt: raw.created_at,
  };
}

export const coverLetterService = { start, getResult } as const;

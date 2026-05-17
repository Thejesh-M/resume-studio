import { apiClient } from "./api-client";
import { USE_MOCKS } from "@/lib/constants";
import {
  MOCK_GAP_ANALYSIS,
  MOCK_TAILORED_VERSION,
  createMockPipelineIterator,
} from "@/mocks/tailoring";
import type { GapAnalysis, TailoredVersion, TailoringTaskStatus } from "@/types/tailoring";

// ── Gap Analysis ──────────────────────────────────────────────────────

interface GapAnalysisParams {
  readonly resumeId: string;
  readonly jdText: string;
}

async function analyzeGaps(params: GapAnalysisParams): Promise<GapAnalysis> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 1200));
    return MOCK_GAP_ANALYSIS;
  }

  return apiClient.post<GapAnalysis>("/tailoring/gaps", params);
}

// ── Tailoring Pipeline ────────────────────────────────────────────────

interface StartTailoringParams {
  readonly resumeId: string;
  readonly jdText: string;
}

interface StartTailoringResponse {
  readonly taskId: string;
  readonly status: "processing";
}

// Store mock iterators by taskId for polling simulation
const mockIterators = new Map<string, ReturnType<typeof createMockPipelineIterator>>();

async function startTailoring(
  params: StartTailoringParams
): Promise<StartTailoringResponse> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 500));
    const taskId = `task-${Date.now()}`;
    mockIterators.set(taskId, createMockPipelineIterator(taskId));
    return { taskId, status: "processing" };
  }

  const raw = await apiClient.post<{ task_id: string }>("/tailoring/start", {
    resume_id: params.resumeId,
    jd_text: params.jdText,
  });
  return { taskId: raw.task_id, status: "processing" };
}

async function pollStatus(taskId: string): Promise<TailoringTaskStatus> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 800));
    const iterator = mockIterators.get(taskId);
    if (!iterator) {
      return {
        taskId,
        status: "completed",
        currentStep: "Done!",
        progressPct: 100,
      };
    }
    const status = iterator();
    if (status.status === "completed") {
      mockIterators.delete(taskId);
    }
    return status;
  }

  return apiClient.get<TailoringTaskStatus>(`/tailoring/status/${encodeURIComponent(taskId)}`);
}

async function getTailoredResult(taskId: string): Promise<TailoredVersion> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 300));
    return MOCK_TAILORED_VERSION;
  }

  return apiClient.get<TailoredVersion>(`/tailoring/result/${encodeURIComponent(taskId)}`);
}

// ── Versions ─────────────────────────────────────────────────────────

async function listVersions(): Promise<TailoredVersion[]> {
  return apiClient.get<TailoredVersion[]>("/tailoring/versions");
}

export const tailoringService = {
  analyzeGaps,
  startTailoring,
  pollStatus,
  getTailoredResult,
  listVersions,
};

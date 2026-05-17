/**
 * Task status polling.
 *
 * The original SaaS subscribed to Firestore for live updates; the local
 * backend exposes the same shape over HTTP, so we poll once a second. Same
 * `subscribeToTaskStatus(taskId, onStatus, onError)` signature — callers don't
 * change.
 */

import { apiClient } from "@/services/api-client";

export interface TaskStatus {
  readonly taskId: string;
  readonly status: string;
  readonly currentStep: string;
  readonly progressPct: number;
  readonly error?: string;
}

interface StatusResponse {
  task_id?: string;
  status?: string;
  currentStep?: string;
  current_step?: string;
  progressPct?: number;
  progress_pct?: number;
  error?: string;
}

type StatusCallback = (status: TaskStatus) => void;
type ErrorCallback = (error: Error) => void;

const POLL_INTERVAL_MS = 1000;
const TERMINAL_STATUSES = new Set(["completed", "failed"]);

export function subscribeToTaskStatus(
  taskId: string,
  onStatus: StatusCallback,
  onError?: ErrorCallback
): () => void {
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const poll = async (): Promise<void> => {
    if (cancelled) return;

    try {
      const data = await apiClient.get<StatusResponse>(
        `/tailoring/status/${taskId}`
      );

      const status: TaskStatus = {
        taskId,
        status: data.status ?? "pending",
        currentStep: data.currentStep ?? data.current_step ?? "",
        progressPct: data.progressPct ?? data.progress_pct ?? 0,
        error: data.error,
      };

      onStatus(status);

      if (TERMINAL_STATUSES.has(status.status)) {
        return;
      }
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }

    if (!cancelled) {
      timer = setTimeout(poll, POLL_INTERVAL_MS);
    }
  };

  void poll();

  return () => {
    cancelled = true;
    if (timer !== null) clearTimeout(timer);
  };
}

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { coverLetterService, type CoverLetterResult } from "@/services/cover-letter-service";
import { subscribeToTaskStatus, type TaskStatus } from "@/lib/firestore-tasks";

// ── Start mutation ─────────────────────────────────────────────────────

export function useStartCoverLetter() {
  return useMutation({
    mutationFn: (params: { resumeId: string; jdText: string }) =>
      coverLetterService.start(params),
  });
}

// ── Firestore task status subscription ────────────────────────────────

export function useCoverLetterTaskStatus(taskId: string | null) {
  const [status, setStatus] = useState<TaskStatus | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!taskId) {
      setStatus(null);
      return;
    }

    unsubRef.current = subscribeToTaskStatus(
      taskId,
      (s) => setStatus(s),
      (err) => console.error("Firestore task subscription error:", err)
    );

    return () => {
      unsubRef.current?.();
      unsubRef.current = null;
    };
  }, [taskId]);

  return status;
}

// ── Fetch result ───────────────────────────────────────────────────────

export function useCoverLetterResult(taskId: string | null) {
  return useQuery({
    queryKey: ["cover-letter", "result", taskId],
    queryFn: () => coverLetterService.getResult(taskId!),
    enabled: !!taskId,
    staleTime: Infinity,
  });
}

// ── Orchestrated hook (start → Firestore progress → fetch result) ──────
//
// Usage:
//   const { generate, status, result, isGenerating } = useGenerateCoverLetter();
//   await generate({ resumeId, jdText });
//   // status updates in real-time via Firestore
//   // result is populated once status.status === "completed"

interface GenerateCoverLetterState {
  taskId: string | null;
  status: TaskStatus | null;
  result: CoverLetterResult | null;
  isGenerating: boolean;
  error: string | null;
}

export function useGenerateCoverLetter() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<GenerateCoverLetterState>({
    taskId: null,
    status: null,
    result: null,
    isGenerating: false,
    error: null,
  });

  const taskStatus = useCoverLetterTaskStatus(state.taskId);

  // When Firestore reports completed, fetch the result from Postgres
  useEffect(() => {
    if (taskStatus?.status === "completed" && state.taskId && !state.result) {
      coverLetterService
        .getResult(state.taskId)
        .then((res) => {
          setState((prev) => ({
            ...prev,
            result: res,
            isGenerating: false,
          }));
          queryClient.setQueryData(
            ["cover-letter", "result", state.taskId],
            res
          );
        })
        .catch((err: unknown) => {
          setState((prev) => ({
            ...prev,
            isGenerating: false,
            error: err instanceof Error ? err.message : "Failed to fetch result",
          }));
        });
    }

    if (taskStatus?.status === "failed") {
      setState((prev) => ({
        ...prev,
        isGenerating: false,
        error: taskStatus.error ?? "Cover letter generation failed",
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskStatus?.status]);

  const generate = useCallback(
    async (params: { resumeId: string; jdText: string }) => {
      setState({
        taskId: null,
        status: null,
        result: null,
        isGenerating: true,
        error: null,
      });
      try {
        const taskId = await coverLetterService.start(params);
        setState((prev) => ({ ...prev, taskId }));
      } catch (err: unknown) {
        setState((prev) => ({
          ...prev,
          isGenerating: false,
          error: err instanceof Error ? err.message : "Failed to start",
        }));
      }
    },
    []
  );

  return {
    generate,
    taskId: state.taskId,
    taskStatus,
    result: state.result,
    isGenerating: state.isGenerating,
    error: state.error,
  };
}

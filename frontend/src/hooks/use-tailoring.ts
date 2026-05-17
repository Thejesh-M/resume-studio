import { useMutation, useQuery } from "@tanstack/react-query";
import { tailoringService } from "@/services/tailoring-service";
import { subscribeToTaskStatus, type TaskStatus } from "@/lib/firestore-tasks";
import { USE_MOCKS, POLLING_INTERVAL_MS } from "@/lib/constants";
import { useEffect, useRef, useState } from "react";

export function useAnalyzeGaps() {
  return useMutation({
    mutationFn: (params: { resumeId: string; jdText: string }) =>
      tailoringService.analyzeGaps(params),
  });
}

export function useStartTailoring() {
  return useMutation({
    mutationFn: (params: { resumeId: string; jdText: string }) =>
      tailoringService.startTailoring(params),
  });
}

/**
 * Subscribe to tailoring task progress.
 * - Real backend: uses Firestore onSnapshot for real-time updates.
 * - Mock mode: polls the mock service on a fixed interval.
 */
export function useTailoringStatus(taskId: string | null) {
  const [firestoreStatus, setFirestoreStatus] = useState<TaskStatus | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (USE_MOCKS || !taskId) {
      setFirestoreStatus(null);
      return;
    }

    unsubRef.current = subscribeToTaskStatus(
      taskId,
      (s) => setFirestoreStatus(s),
      (err) => console.error("Tailoring status subscription error:", err)
    );

    return () => {
      unsubRef.current?.();
      unsubRef.current = null;
    };
  }, [taskId]);

  // Mock mode falls back to polling via React Query
  const pollQuery = useQuery({
    queryKey: ["tailoring", "status", taskId],
    queryFn: () => tailoringService.pollStatus(taskId!),
    enabled: USE_MOCKS && !!taskId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "completed" || status === "failed") return false;
      return POLLING_INTERVAL_MS;
    },
  });

  if (USE_MOCKS) return pollQuery.data ?? null;
  return firestoreStatus;
}

export function useVersions() {
  return useQuery({
    queryKey: ["versions"],
    queryFn: () => tailoringService.listVersions(),
  });
}

export function useTailoredResult(taskId: string | null) {
  return useQuery({
    queryKey: ["tailoring", "result", taskId],
    queryFn: () => tailoringService.getTailoredResult(taskId!),
    enabled: !!taskId,
    staleTime: Infinity,
  });
}

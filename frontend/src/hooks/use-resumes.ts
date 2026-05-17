import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { resumeService } from "@/services/resume-service";
import type { ResumeContent } from "@/types/resume";
import type { ChatResult, TemplateEditResult } from "@/services/resume-service";

export function useResumes() {
  return useQuery({
    queryKey: ["resumes"],
    queryFn: () => resumeService.list(),
  });
}

export function useResume(id: string | null) {
  return useQuery({
    queryKey: ["resume", id],
    queryFn: () => resumeService.getById(id!),
    enabled: !!id,
  });
}

export function useUploadAndExtract() {
  return useMutation({
    mutationFn: (file: File) => resumeService.uploadAndExtract(file),
  });
}

export function useCreateResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      title: string;
      templateId: string;
      content: ResumeContent;
      extractionId?: string;
    }) => resumeService.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["resumes"] });
    },
  });
}

export function useUploadRawPdfResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ title, file }: { title: string; file: File }) =>
      resumeService.uploadRawPdf(title, file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["resumes"] });
    },
  });
}

export function useCopyResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, title }: { id: string; title?: string }) =>
      resumeService.copy(id, title),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["resumes"] });
    },
  });
}

export function useUpdateResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      id: string;
      payload: { title?: string; content?: ResumeContent; templateId?: string; isDefault?: boolean };
    }) => resumeService.update(params.id, params.payload),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ["resumes"] });
      void queryClient.invalidateQueries({ queryKey: ["resume", data.id] });
    },
  });
}

export function useDeleteResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => resumeService.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["resumes"] });
    },
  });
}

export function useCompileResume() {
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: ResumeContent }) =>
      resumeService.compile(id, content),
  });
}

export function useChatResume() {
  return useMutation({
    mutationFn: ({
      id,
      message,
      currentContent,
    }: {
      id: string;
      message: string;
      currentContent: ResumeContent;
    }): Promise<ChatResult> => resumeService.chat(id, message, currentContent),
  });
}

// ── Template file hooks ──────────────────────────────────────────────────────

export function useTemplateFiles(resumeId: string | null) {
  return useQuery({
    queryKey: ["template-files", resumeId],
    queryFn: () => resumeService.listTemplateFiles(resumeId!),
    enabled: !!resumeId,
  });
}

export function useTemplateFileContent(resumeId: string | null, filePath: string | null) {
  return useQuery({
    queryKey: ["template-file", resumeId, filePath],
    queryFn: () => resumeService.readTemplateFile(resumeId!, filePath!),
    enabled: !!resumeId && !!filePath,
  });
}

export function useWriteTemplateFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      resumeId,
      filePath,
      content,
    }: {
      resumeId: string;
      filePath: string;
      content: string;
    }) => resumeService.writeTemplateFile(resumeId, filePath, content),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["template-files", vars.resumeId] });
      void queryClient.invalidateQueries({ queryKey: ["template-file", vars.resumeId, vars.filePath] });
    },
  });
}

export function useResetTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (resumeId: string) => resumeService.resetTemplate(resumeId),
    onSuccess: (_data, resumeId) => {
      void queryClient.invalidateQueries({ queryKey: ["template-files", resumeId] });
      void queryClient.invalidateQueries({ queryKey: ["template-file", resumeId] });
    },
  });
}

export function useAiEditTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      resumeId,
      message,
      targetFile,
    }: {
      resumeId: string;
      message: string;
      targetFile?: string;
    }): Promise<TemplateEditResult> =>
      resumeService.aiEditTemplate(resumeId, message, targetFile),
    onSuccess: (_data, vars) => {
      // Invalidate all template file queries so the editor refreshes
      void queryClient.invalidateQueries({ queryKey: ["template-files", vars.resumeId] });
      void queryClient.invalidateQueries({ queryKey: ["template-file", vars.resumeId] });
    },
  });
}

import { useQuery } from "@tanstack/react-query";
import {
  templateService,
  type TemplateListParams,
} from "@/services/template-service";

export function useTemplates(params?: TemplateListParams) {
  return useQuery({
    queryKey: ["templates", params],
    queryFn: () => templateService.list(params),
  });
}

export function useTemplate(id: string | null) {
  return useQuery({
    queryKey: ["template", id],
    queryFn: () => templateService.getById(id!),
    enabled: !!id,
  });
}

import { API_BASE_URL } from "@/lib/constants";
import { ApiError } from "@/types/api";

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, headers: customHeaders, ...restOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((customHeaders as Record<string, string>) ?? {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...restOptions,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({
      error: response.statusText,
    }));

    throw new ApiError(
      errorBody.error ?? "Request failed",
      response.status,
      errorBody.code
    );
  }

  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return undefined as T;
  }

  const json = await response.json();

  if (
    json !== null &&
    typeof json === "object" &&
    "success" in json &&
    "data" in json
  ) {
    return json.data as T;
  }

  return json as T;
}

export const apiClient = {
  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, { ...options, method: "GET" });
  },

  post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, { ...options, method: "POST", body });
  },

  put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, { ...options, method: "PUT", body });
  },

  patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, { ...options, method: "PATCH", body });
  },

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, { ...options, method: "DELETE" });
  },

  async postBinary(endpoint: string, body?: unknown): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorBody = await response
        .json()
        .catch(() => ({ error: response.statusText }));
      throw new ApiError(
        errorBody.error ?? "Request failed",
        response.status,
        errorBody.code
      );
    }

    return response.blob();
  },

  async upload<T>(
    endpoint: string,
    fileOrForm: File | FormData,
    fieldName = "file"
  ): Promise<T> {
    const formData =
      fileOrForm instanceof FormData ? fileOrForm : new FormData();
    if (!(fileOrForm instanceof FormData)) {
      formData.append(fieldName, fileOrForm);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({
        error: response.statusText,
      }));
      throw new ApiError(
        errorBody.error ?? "Upload failed",
        response.status,
        errorBody.code
      );
    }

    if (response.status === 204 || response.headers.get("content-length") === "0") {
      return undefined as T;
    }

    const uploadJson = await response.json();
    if (
      uploadJson !== null &&
      typeof uploadJson === "object" &&
      "success" in uploadJson &&
      "data" in uploadJson
    ) {
      return uploadJson.data as T;
    }
    return uploadJson as T;
  },
};

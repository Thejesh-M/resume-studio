import type { UserResume } from "@/types/resume";
import { MOCK_EXTRACTED_CONTENT } from "./resume-content";

const STORAGE_KEY = "mock_resume_store";

const SEED_RESUMES: readonly UserResume[] = [
  {
    id: "resume-001",
    userId: "mock-user",
    title: "Jane Doe's Resume",
    templateId: "tpl-classic-01",
    content: MOCK_EXTRACTED_CONTENT,
    compiledSource: null,
    basePdfUrl: null,
    isDefault: true,
    isRawUpload: false,
    createdAt: "2025-11-01T10:00:00Z",
    updatedAt: "2025-12-15T14:30:00Z",
  },
  {
    id: "resume-002",
    userId: "mock-user",
    title: "Backend Focus Resume",
    templateId: "tpl-modern-01",
    content: {
      ...MOCK_EXTRACTED_CONTENT,
      summary:
        "Backend-focused software engineer with expertise in distributed systems, databases, and API design. 5+ years building high-throughput services on GCP and AWS.",
      skills: [
        { category: "Backend", items: ["Python", "Go", "PostgreSQL", "Redis", "gRPC", "Kafka"] },
        { category: "Cloud & DevOps", items: ["Kubernetes", "Terraform", "GCP", "Docker"] },
      ],
    },
    compiledSource: null,
    basePdfUrl: null,
    isDefault: false,
    isRawUpload: false,
    createdAt: "2026-01-10T08:00:00Z",
    updatedAt: "2026-02-20T11:00:00Z",
  },
];

function loadFromStorage(): UserResume[] {
  if (typeof window === "undefined") return [...SEED_RESUMES];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as UserResume[];
  } catch {
    // corrupted — fall through to seed
  }
  return [...SEED_RESUMES];
}

function saveToStorage(resumes: UserResume[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resumes));
  } catch {
    // storage full or unavailable — ignore
  }
}

/** Mutable store for mock mode — backed by localStorage so changes survive refreshes. */
class MockResumeStore {
  private resumes: UserResume[] = loadFromStorage();

  list(): readonly UserResume[] {
    return this.resumes;
  }

  getById(id: string): UserResume | undefined {
    return this.resumes.find((r) => r.id === id);
  }

  add(resume: UserResume): void {
    this.resumes.push(resume);
    saveToStorage(this.resumes);
  }

  update(id: string, payload: Partial<UserResume>): UserResume | undefined {
    const index = this.resumes.findIndex((r) => r.id === id);
    if (index === -1) return undefined;

    if (payload.isDefault) {
      this.resumes = this.resumes.map((r) => ({ ...r, isDefault: false }));
    }

    const updated = {
      ...this.resumes[index],
      ...payload,
      updatedAt: new Date().toISOString(),
    };
    this.resumes[index] = updated;
    saveToStorage(this.resumes);
    return updated;
  }

  delete(id: string): boolean {
    const before = this.resumes.length;
    this.resumes = this.resumes.filter((r) => r.id !== id);
    saveToStorage(this.resumes);
    return this.resumes.length < before;
  }
}

export const mockResumeStore = new MockResumeStore();

/** @deprecated Use mockResumeStore.list() instead */
export const MOCK_RESUMES = SEED_RESUMES;

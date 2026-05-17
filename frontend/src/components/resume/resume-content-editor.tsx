"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { toast } from "sonner";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis, restrictToWindowEdges } from "@dnd-kit/modifiers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Loader2 } from "lucide-react";
import {
  SkillsEditor,
  ExperienceEditor,
  EducationEditor,
  CertificationsEditor,
  ProjectsEditor,
  AwardsEditor,
  PublicationsEditor,
  LanguagesEditor,
  InterestsEditor,
  VolunteersEditor,
  AffiliationsEditor,
  ReferencesEditor,
} from "./resume-section-editor";
import { SortableSection, SectionDragOverlay } from "./sortable-section";
import { useUpdateResume } from "@/hooks/use-resumes";
import { DEFAULT_SECTION_ORDER } from "@/types/resume";
import type {
  ResumeContent,
  ExperienceEntry,
  EducationEntry,
  SkillGroup,
  CertificationEntry,
  ProjectEntry,
  AwardEntry,
  PublicationEntry,
  VolunteerEntry,
  ReferenceEntry,
  AffiliationEntry,
} from "@/types/resume";

// ── Section labels for display ──

const SECTION_LABELS: Record<string, string> = {
  summary: "Professional Summary",
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  certifications: "Certifications",
  awards: "Awards",
  publications: "Publications",
  languages: "Languages",
  interests: "Interests",
  volunteers: "Volunteering",
  affiliations: "Affiliations",
  references: "References",
};

// ── Component ──

interface ResumeContentEditorProps {
  readonly content: ResumeContent;
  readonly resumeId?: string;
  readonly onChange?: (content: ResumeContent) => void;
}

export function ResumeContentEditor({
  resumeId,
  content: initialContent,
  onChange,
}: ResumeContentEditorProps) {
  const [content, setContent] = useState<ResumeContent>(initialContent);
  const updateMutation = useUpdateResume();

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  const sectionOrder: readonly string[] =
    content.section_order && content.section_order.length > 0
      ? content.section_order
      : DEFAULT_SECTION_ORDER;

  function updateField<K extends keyof ResumeContent>(key: K, value: ResumeContent[K]) {
    const next = { ...content, [key]: value };
    setContent(next);
    onChange?.(next);
  }

  function updateContact(field: string, value: string) {
    const next = { ...content, contact: { ...content.contact, [field]: value } };
    setContent(next);
    onChange?.(next);
  }

  // ── Drag & Drop ──

  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);

      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = sectionOrder.indexOf(active.id as string);
      const newIndex = sectionOrder.indexOf(over.id as string);
      if (oldIndex === -1 || newIndex === -1) return;

      const newOrder = arrayMove([...sectionOrder], oldIndex, newIndex);
      const next = { ...content, section_order: newOrder };
      setContent(next);
      onChange?.(next);
    },
    [content, sectionOrder, onChange],
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  // ── Section renderer ──

  function renderSection(key: string): ReactNode {
    switch (key) {
      case "summary":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{SECTION_LABELS.summary}</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={4}
                value={content.summary}
                onChange={(e) => updateField("summary", e.target.value)}
              />
            </CardContent>
          </Card>
        );

      case "experience":
        return (
          <ExperienceEditor
            entries={content.experience}
            onChange={(entries) => updateField("experience", entries as readonly ExperienceEntry[])}
          />
        );

      case "education":
        return (
          <EducationEditor
            entries={content.education}
            onChange={(entries) => updateField("education", entries as readonly EducationEntry[])}
          />
        );

      case "skills":
        return (
          <SkillsEditor
            skills={content.skills}
            onChange={(skills) => updateField("skills", skills as readonly SkillGroup[])}
          />
        );

      case "projects":
        return (
          <ProjectsEditor
            entries={content.projects ?? []}
            onChange={(entries) => updateField("projects", entries as readonly ProjectEntry[])}
          />
        );

      case "certifications":
        return (
          <CertificationsEditor
            entries={content.certifications ?? []}
            onChange={(entries) =>
              updateField("certifications", entries as readonly CertificationEntry[])
            }
          />
        );

      case "awards":
        return (
          <AwardsEditor
            entries={content.awards ?? []}
            onChange={(entries) => updateField("awards", entries as readonly AwardEntry[])}
          />
        );

      case "publications":
        return (
          <PublicationsEditor
            entries={content.publications ?? []}
            onChange={(entries) =>
              updateField("publications", entries as readonly PublicationEntry[])
            }
          />
        );

      case "languages":
        return (
          <LanguagesEditor
            languages={content.languages ?? []}
            onChange={(languages) => updateField("languages", languages)}
          />
        );

      case "interests":
        return (
          <InterestsEditor
            interests={content.interests ?? []}
            onChange={(interests) => updateField("interests", interests)}
          />
        );

      case "volunteers":
        return (
          <VolunteersEditor
            entries={content.volunteers ?? []}
            onChange={(entries) => updateField("volunteers", entries as readonly VolunteerEntry[])}
          />
        );

      case "affiliations":
        return (
          <AffiliationsEditor
            entries={content.affiliations ?? []}
            onChange={(entries) =>
              updateField("affiliations", entries as readonly AffiliationEntry[])
            }
          />
        );

      case "references":
        return (
          <ReferencesEditor
            entries={content.references ?? []}
            onChange={(entries) => updateField("references", entries as readonly ReferenceEntry[])}
          />
        );

      default:
        return null;
    }
  }

  async function handleSave() {
    if (!resumeId) return;
    try {
      await updateMutation.mutateAsync({ id: resumeId, payload: { content } });
      toast.success("Resume saved.");
    } catch {
      toast.error("Failed to save. Please try again.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Contact info — always first, not draggable */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input
                value={content.contact.name}
                onChange={(e) => updateContact("name", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                value={content.contact.email}
                onChange={(e) => updateContact("email", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                value={content.contact.phone ?? ""}
                onChange={(e) => updateContact("phone", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input
                value={content.contact.location ?? ""}
                onChange={(e) => updateContact("location", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>LinkedIn</Label>
              <Input
                value={content.contact.linkedin ?? ""}
                onChange={(e) => updateContact("linkedin", e.target.value)}
                placeholder="linkedin.com/in/yourname"
              />
            </div>
            <div className="space-y-1.5">
              <Label>GitHub</Label>
              <Input
                value={content.contact.github ?? ""}
                onChange={(e) => updateContact("github", e.target.value)}
                placeholder="github.com/yourname"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Website</Label>
              <Input
                value={content.contact.website ?? ""}
                onChange={(e) => updateContact("website", e.target.value)}
                placeholder="yoursite.dev"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Address (optional)</Label>
              <Input
                value={content.contact.address ?? ""}
                onChange={(e) => updateContact("address", e.target.value)}
                placeholder="123 Main St, City, State 12345"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Professional Titles (comma-separated, optional)</Label>
              <Input
                value={(content.contact.titles ?? []).join(", ")}
                onChange={(e) =>
                  updateField("contact", {
                    ...content.contact,
                    titles: e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="Software Engineer, Full Stack Developer"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Draggable sections */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
        autoScroll={{ layoutShiftCompensation: false, acceleration: 10, interval: 5 }}
      >
        <SortableContext items={sectionOrder as string[]} strategy={verticalListSortingStrategy}>
          {sectionOrder.map((key) => (
            <SortableSection key={key} id={key} label={SECTION_LABELS[key] ?? key} isDragActive={activeId !== null}>
              {renderSection(key)}
            </SortableSection>
          ))}
        </SortableContext>

        <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
          {activeId ? (
            <SectionDragOverlay label={SECTION_LABELS[activeId] ?? activeId} />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Save button — only shown in persisted (resumeId) mode */}
      {resumeId && (
        <div className="sticky bottom-4 flex justify-end">
          <Button
            onClick={() => void handleSave()}
            disabled={updateMutation.isPending}
            size="lg"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-1.5 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

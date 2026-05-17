"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Check, X, Plus, Trash2 } from "lucide-react";
import type {
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

// ── Skills Editor (categorized) ──────────────────────────────────────

interface SkillsEditorProps {
  readonly skills: readonly SkillGroup[];
  readonly onChange: (skills: readonly SkillGroup[]) => void;
}

export function SkillsEditor({ skills, onChange }: SkillsEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  function addGroup() {
    const newGroup: SkillGroup = { category: "", items: [] };
    onChange([...skills, newGroup]);
    setEditingIndex(skills.length);
  }

  function updateGroup(index: number, updated: SkillGroup) {
    onChange(skills.map((g, i) => (i === index ? updated : g)));
  }

  function deleteGroup(index: number) {
    if (editingIndex === index) setEditingIndex(null);
    else if (editingIndex !== null && editingIndex > index)
      setEditingIndex(editingIndex - 1);
    onChange(skills.filter((_, i) => i !== index));
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Skills</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={addGroup}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add Category
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {skills.length === 0 && (
          <p className="text-sm text-muted-foreground">No skill categories yet.</p>
        )}
        {skills.map((group, index) => (
          <div key={index} className="rounded-md border p-3">
            {editingIndex === index ? (
              <SkillGroupForm
                group={group}
                onSave={(updated) => {
                  updateGroup(index, updated);
                  setEditingIndex(null);
                }}
                onCancel={() => setEditingIndex(null)}
              />
            ) : (
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{group.category || "Untitled"}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {group.items.map((item) => (
                      <Badge key={item} variant="outline" className="text-xs">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setEditingIndex(index)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => deleteGroup(index)}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function SkillGroupForm({
  group,
  onSave,
  onCancel,
}: {
  readonly group: SkillGroup;
  readonly onSave: (group: SkillGroup) => void;
  readonly onCancel: () => void;
}) {
  const [category, setCategory] = useState(group.category);
  const [items, setItems] = useState(group.items.join(", "));

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">Category Name</Label>
        <Input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="e.g. Backend, Frontend, Cloud & DevOps"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Skills (comma-separated)</Label>
        <Input
          value={items}
          onChange={(e) => setItems(e.target.value)}
          placeholder="Python, TypeScript, Node.js"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          <X className="mr-1 h-3.5 w-3.5" />
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() =>
            onSave({
              category: category.trim(),
              items: items
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
        >
          <Check className="mr-1 h-3.5 w-3.5" />
          Save
        </Button>
      </div>
    </div>
  );
}

// ── Experience Editor ────────────────────────────────────────────────

interface ExperienceEditorProps {
  readonly entries: readonly ExperienceEntry[];
  readonly onChange: (entries: readonly ExperienceEntry[]) => void;
}

export function ExperienceEditor({ entries, onChange }: ExperienceEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  function updateEntry(index: number, updated: ExperienceEntry) {
    onChange(entries.map((e, i) => (i === index ? updated : e)));
  }

  function deleteEntry(index: number) {
    if (editingIndex === index) setEditingIndex(null);
    else if (editingIndex !== null && editingIndex > index)
      setEditingIndex(editingIndex - 1);
    onChange(entries.filter((_, i) => i !== index));
  }

  function addEntry() {
    const newEntry: ExperienceEntry = { company: "", title: "", dates: "", bullets: [""] };
    onChange([...entries, newEntry]);
    setEditingIndex(entries.length);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Experience</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={addEntry}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {entries.length === 0 && (
          <p className="text-sm text-muted-foreground">No experience entries yet.</p>
        )}
        {entries.map((entry, index) => (
          <div key={index} className="rounded-md border p-3">
            {editingIndex === index ? (
              <ExperienceEntryForm
                entry={entry}
                onSave={(updated) => {
                  updateEntry(index, updated);
                  setEditingIndex(null);
                }}
                onCancel={() => setEditingIndex(null)}
              />
            ) : (
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {entry.title || "Untitled"} at {entry.company || "Company"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.dates}
                    {entry.location ? ` · ${entry.location}` : ""}
                  </p>
                  <ul className="mt-1.5 space-y-0.5">
                    {entry.bullets.map((b, i) => (
                      <li key={i} className="text-xs text-muted-foreground">
                        &bull; {b}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setEditingIndex(index)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => deleteEntry(index)}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ExperienceEntryForm({
  entry,
  onSave,
  onCancel,
}: {
  readonly entry: ExperienceEntry;
  readonly onSave: (entry: ExperienceEntry) => void;
  readonly onCancel: () => void;
}) {
  const [title, setTitle] = useState(entry.title);
  const [company, setCompany] = useState(entry.company);
  const [dates, setDates] = useState(entry.dates);
  const [location, setLocation] = useState(entry.location ?? "");
  const [bullets, setBullets] = useState(entry.bullets.join("\n"));

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">Job Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Company</Label>
          <Input value={company} onChange={(e) => setCompany(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Dates</Label>
          <Input
            value={dates}
            onChange={(e) => setDates(e.target.value)}
            placeholder="Jan 2022 - Present"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Location (optional)</Label>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="San Francisco, CA"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Bullet Points (one per line)</Label>
        <Textarea rows={4} value={bullets} onChange={(e) => setBullets(e.target.value)} />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          <X className="mr-1 h-3.5 w-3.5" />
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() =>
            onSave({
              title,
              company,
              dates,
              ...(location.trim() ? { location: location.trim() } : {}),
              bullets: bullets.split("\n").filter((b) => b.trim()),
            })
          }
        >
          <Check className="mr-1 h-3.5 w-3.5" />
          Save
        </Button>
      </div>
    </div>
  );
}

// ── Education Editor ─────────────────────────────────────────────────

interface EducationEditorProps {
  readonly entries: readonly EducationEntry[];
  readonly onChange: (entries: readonly EducationEntry[]) => void;
}

export function EducationEditor({ entries, onChange }: EducationEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  function updateEntry(index: number, updated: EducationEntry) {
    onChange(entries.map((e, i) => (i === index ? updated : e)));
  }

  function deleteEntry(index: number) {
    if (editingIndex === index) setEditingIndex(null);
    else if (editingIndex !== null && editingIndex > index)
      setEditingIndex(editingIndex - 1);
    onChange(entries.filter((_, i) => i !== index));
  }

  function addEntry() {
    const newEntry: EducationEntry = { institution: "", degree: "", field: "", dates: "" };
    onChange([...entries, newEntry]);
    setEditingIndex(entries.length);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Education</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={addEntry}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {entries.length === 0 && (
          <p className="text-sm text-muted-foreground">No education entries yet.</p>
        )}
        {entries.map((entry, index) => (
          <div key={index} className="rounded-md border p-3">
            {editingIndex === index ? (
              <EducationEntryForm
                entry={entry}
                onSave={(updated) => {
                  updateEntry(index, updated);
                  setEditingIndex(null);
                }}
                onCancel={() => setEditingIndex(null)}
              />
            ) : (
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium">{entry.institution || "Institution"}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.degree || "Degree"} in {entry.field || "Field"} &middot; {entry.dates}
                  </p>
                  {entry.gpa && (
                    <p className="text-xs text-muted-foreground">GPA: {entry.gpa}</p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setEditingIndex(index)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => deleteEntry(index)}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function EducationEntryForm({
  entry,
  onSave,
  onCancel,
}: {
  readonly entry: EducationEntry;
  readonly onSave: (entry: EducationEntry) => void;
  readonly onCancel: () => void;
}) {
  const [institution, setInstitution] = useState(entry.institution);
  const [degree, setDegree] = useState(entry.degree);
  const [field, setField] = useState(entry.field);
  const [dates, setDates] = useState(entry.dates);
  const [gpa, setGpa] = useState(entry.gpa ?? "");

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">Institution</Label>
          <Input value={institution} onChange={(e) => setInstitution(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Degree</Label>
          <Input value={degree} onChange={(e) => setDegree(e.target.value)} placeholder="B.S." />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Field of Study</Label>
          <Input
            value={field}
            onChange={(e) => setField(e.target.value)}
            placeholder="Computer Science"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Dates</Label>
          <Input
            value={dates}
            onChange={(e) => setDates(e.target.value)}
            placeholder="2018 - 2022"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">GPA (optional)</Label>
          <Input value={gpa} onChange={(e) => setGpa(e.target.value)} placeholder="3.8" />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          <X className="mr-1 h-3.5 w-3.5" />
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() =>
            onSave({
              institution,
              degree,
              field,
              dates,
              ...(gpa.trim() ? { gpa: gpa.trim() } : {}),
            })
          }
        >
          <Check className="mr-1 h-3.5 w-3.5" />
          Save
        </Button>
      </div>
    </div>
  );
}

// ── Certifications Editor ─────────────────────────────────────────────

interface CertificationsEditorProps {
  readonly entries: readonly CertificationEntry[];
  readonly onChange: (entries: readonly CertificationEntry[]) => void;
}

export function CertificationsEditor({ entries, onChange }: CertificationsEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  function updateEntry(index: number, updated: CertificationEntry) {
    onChange(entries.map((e, i) => (i === index ? updated : e)));
  }

  function deleteEntry(index: number) {
    if (editingIndex === index) setEditingIndex(null);
    else if (editingIndex !== null && editingIndex > index)
      setEditingIndex(editingIndex - 1);
    onChange(entries.filter((_, i) => i !== index));
  }

  function addEntry() {
    const newEntry: CertificationEntry = { name: "", issuer: "" };
    onChange([...entries, newEntry]);
    setEditingIndex(entries.length);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Certifications</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={addEntry}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {entries.length === 0 && (
          <p className="text-sm text-muted-foreground">No certifications yet.</p>
        )}
        {entries.map((entry, index) => (
          <div key={index} className="rounded-md border p-3">
            {editingIndex === index ? (
              <CertificationEntryForm
                entry={entry}
                onSave={(updated) => {
                  updateEntry(index, updated);
                  setEditingIndex(null);
                }}
                onCancel={() => setEditingIndex(null)}
              />
            ) : (
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium">{entry.name || "Untitled"}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.issuer}
                    {entry.date ? ` · ${entry.date}` : ""}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setEditingIndex(index)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => deleteEntry(index)}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function CertificationEntryForm({
  entry,
  onSave,
  onCancel,
}: {
  readonly entry: CertificationEntry;
  readonly onSave: (entry: CertificationEntry) => void;
  readonly onCancel: () => void;
}) {
  const [name, setName] = useState(entry.name);
  const [issuer, setIssuer] = useState(entry.issuer);
  const [date, setDate] = useState(entry.date ?? "");

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">Certification Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Issuer</Label>
          <Input
            value={issuer}
            onChange={(e) => setIssuer(e.target.value)}
            placeholder="Google, AWS, etc."
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Date (optional)</Label>
          <Input value={date} onChange={(e) => setDate(e.target.value)} placeholder="2023" />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          <X className="mr-1 h-3.5 w-3.5" />
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() =>
            onSave({
              name: name.trim(),
              issuer: issuer.trim(),
              ...(date.trim() ? { date: date.trim() } : {}),
            })
          }
        >
          <Check className="mr-1 h-3.5 w-3.5" />
          Save
        </Button>
      </div>
    </div>
  );
}

// ── Projects Editor ──────────────────────────────────────────────────

interface ProjectsEditorProps {
  readonly entries: readonly ProjectEntry[];
  readonly onChange: (entries: readonly ProjectEntry[]) => void;
}

export function ProjectsEditor({ entries, onChange }: ProjectsEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  function updateEntry(index: number, updated: ProjectEntry) {
    onChange(entries.map((e, i) => (i === index ? updated : e)));
  }

  function deleteEntry(index: number) {
    if (editingIndex === index) setEditingIndex(null);
    else if (editingIndex !== null && editingIndex > index)
      setEditingIndex(editingIndex - 1);
    onChange(entries.filter((_, i) => i !== index));
  }

  function addEntry() {
    const newEntry: ProjectEntry = { name: "", description: "" };
    onChange([...entries, newEntry]);
    setEditingIndex(entries.length);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Projects</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={addEntry}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {entries.length === 0 && (
          <p className="text-sm text-muted-foreground">No projects yet.</p>
        )}
        {entries.map((entry, index) => (
          <div key={index} className="rounded-md border p-3">
            {editingIndex === index ? (
              <ProjectEntryForm
                entry={entry}
                onSave={(updated) => {
                  updateEntry(index, updated);
                  setEditingIndex(null);
                }}
                onCancel={() => setEditingIndex(null)}
              />
            ) : (
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{entry.name || "Untitled"}</p>
                  {(entry.dates ?? entry.url) && (
                    <p className="text-xs text-muted-foreground">
                      {entry.dates}
                      {entry.dates && entry.url ? " · " : ""}
                      {entry.url}
                    </p>
                  )}
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                    {entry.description}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setEditingIndex(index)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => deleteEntry(index)}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ProjectEntryForm({
  entry,
  onSave,
  onCancel,
}: {
  readonly entry: ProjectEntry;
  readonly onSave: (entry: ProjectEntry) => void;
  readonly onCancel: () => void;
}) {
  const [name, setName] = useState(entry.name);
  const [dates, setDates] = useState(entry.dates ?? "");
  const [url, setUrl] = useState(entry.url ?? "");
  const [description, setDescription] = useState(entry.description);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">Project Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Dates (optional)</Label>
          <Input
            value={dates}
            onChange={(e) => setDates(e.target.value)}
            placeholder="2023 - Present"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">URL (optional)</Label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="github.com/user/project"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Description</Label>
        <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          <X className="mr-1 h-3.5 w-3.5" />
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() =>
            onSave({
              name: name.trim(),
              description: description.trim(),
              ...(dates.trim() ? { dates: dates.trim() } : {}),
              ...(url.trim() ? { url: url.trim() } : {}),
            })
          }
        >
          <Check className="mr-1 h-3.5 w-3.5" />
          Save
        </Button>
      </div>
    </div>
  );
}

// ── Awards Editor ────────────────────────────────────────────────────

interface AwardsEditorProps {
  readonly entries: readonly AwardEntry[];
  readonly onChange: (entries: readonly AwardEntry[]) => void;
}

export function AwardsEditor({ entries, onChange }: AwardsEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  function updateEntry(index: number, updated: AwardEntry) {
    onChange(entries.map((e, i) => (i === index ? updated : e)));
  }

  function deleteEntry(index: number) {
    if (editingIndex === index) setEditingIndex(null);
    else if (editingIndex !== null && editingIndex > index)
      setEditingIndex(editingIndex - 1);
    onChange(entries.filter((_, i) => i !== index));
  }

  function addEntry() {
    const newEntry: AwardEntry = { title: "", awarder: "" };
    onChange([...entries, newEntry]);
    setEditingIndex(entries.length);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Awards & Honors</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={addEntry}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {entries.length === 0 && (
          <p className="text-sm text-muted-foreground">No awards yet.</p>
        )}
        {entries.map((entry, index) => (
          <div key={index} className="rounded-md border p-3">
            {editingIndex === index ? (
              <AwardEntryForm
                entry={entry}
                onSave={(updated) => {
                  updateEntry(index, updated);
                  setEditingIndex(null);
                }}
                onCancel={() => setEditingIndex(null)}
              />
            ) : (
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium">{entry.title || "Untitled"}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.awarder}
                    {entry.date ? ` · ${entry.date}` : ""}
                  </p>
                  {entry.summary && (
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                      {entry.summary}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setEditingIndex(index)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => deleteEntry(index)}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AwardEntryForm({
  entry,
  onSave,
  onCancel,
}: {
  readonly entry: AwardEntry;
  readonly onSave: (entry: AwardEntry) => void;
  readonly onCancel: () => void;
}) {
  const [title, setTitle] = useState(entry.title);
  const [awarder, setAwarder] = useState(entry.awarder);
  const [date, setDate] = useState(entry.date ?? "");
  const [summary, setSummary] = useState(entry.summary ?? "");

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">Award Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Awarder / Organization</Label>
          <Input value={awarder} onChange={(e) => setAwarder(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Date (optional)</Label>
          <Input value={date} onChange={(e) => setDate(e.target.value)} placeholder="2023" />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Summary (optional)</Label>
        <Textarea rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          <X className="mr-1 h-3.5 w-3.5" />
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() =>
            onSave({
              title: title.trim(),
              awarder: awarder.trim(),
              ...(date.trim() ? { date: date.trim() } : {}),
              ...(summary.trim() ? { summary: summary.trim() } : {}),
            })
          }
        >
          <Check className="mr-1 h-3.5 w-3.5" />
          Save
        </Button>
      </div>
    </div>
  );
}

// ── Publications Editor ──────────────────────────────────────────────

interface PublicationsEditorProps {
  readonly entries: readonly PublicationEntry[];
  readonly onChange: (entries: readonly PublicationEntry[]) => void;
}

export function PublicationsEditor({ entries, onChange }: PublicationsEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  function updateEntry(index: number, updated: PublicationEntry) {
    onChange(entries.map((e, i) => (i === index ? updated : e)));
  }

  function deleteEntry(index: number) {
    if (editingIndex === index) setEditingIndex(null);
    else if (editingIndex !== null && editingIndex > index)
      setEditingIndex(editingIndex - 1);
    onChange(entries.filter((_, i) => i !== index));
  }

  function addEntry() {
    const newEntry: PublicationEntry = { title: "" };
    onChange([...entries, newEntry]);
    setEditingIndex(entries.length);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Publications</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={addEntry}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {entries.length === 0 && (
          <p className="text-sm text-muted-foreground">No publications yet.</p>
        )}
        {entries.map((entry, index) => (
          <div key={index} className="rounded-md border p-3">
            {editingIndex === index ? (
              <PublicationEntryForm
                entry={entry}
                onSave={(updated) => {
                  updateEntry(index, updated);
                  setEditingIndex(null);
                }}
                onCancel={() => setEditingIndex(null)}
              />
            ) : (
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{entry.title || "Untitled"}</p>
                  {entry.authors && (
                    <p className="text-xs text-muted-foreground">{entry.authors}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {entry.venue}
                    {entry.venue && entry.date ? " · " : ""}
                    {entry.date}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setEditingIndex(index)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => deleteEntry(index)}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function PublicationEntryForm({
  entry,
  onSave,
  onCancel,
}: {
  readonly entry: PublicationEntry;
  readonly onSave: (entry: PublicationEntry) => void;
  readonly onCancel: () => void;
}) {
  const [title, setTitle] = useState(entry.title);
  const [authors, setAuthors] = useState(entry.authors ?? "");
  const [venue, setVenue] = useState(entry.venue ?? "");
  const [date, setDate] = useState(entry.date ?? "");
  const [url, setUrl] = useState(entry.url ?? "");

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">Authors (optional)</Label>
          <Input
            value={authors}
            onChange={(e) => setAuthors(e.target.value)}
            placeholder="A. Smith, B. Jones"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Venue / Journal (optional)</Label>
          <Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="NeurIPS 2023" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Date (optional)</Label>
          <Input value={date} onChange={(e) => setDate(e.target.value)} placeholder="2023" />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">URL (optional)</Label>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          <X className="mr-1 h-3.5 w-3.5" />
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() =>
            onSave({
              title: title.trim(),
              ...(authors.trim() ? { authors: authors.trim() } : {}),
              ...(venue.trim() ? { venue: venue.trim() } : {}),
              ...(date.trim() ? { date: date.trim() } : {}),
              ...(url.trim() ? { url: url.trim() } : {}),
            })
          }
        >
          <Check className="mr-1 h-3.5 w-3.5" />
          Save
        </Button>
      </div>
    </div>
  );
}

// ── Languages Editor ─────────────────────────────────────────────────

interface LanguagesEditorProps {
  readonly languages: readonly string[];
  readonly onChange: (languages: readonly string[]) => void;
}

export function LanguagesEditor({ languages, onChange }: LanguagesEditorProps) {
  const [newLang, setNewLang] = useState("");

  function addLanguage() {
    const trimmed = newLang.trim();
    if (trimmed && !languages.includes(trimmed)) {
      onChange([...languages, trimmed]);
      setNewLang("");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Languages</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {languages.map((lang) => (
            <Badge key={lang} variant="outline" className="gap-1 pr-1 text-xs">
              {lang}
              <button
                type="button"
                onClick={() => onChange(languages.filter((l) => l !== lang))}
                className="ml-0.5 rounded-sm p-0.5 hover:bg-muted"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newLang}
            onChange={(e) => setNewLang(e.target.value)}
            placeholder='e.g. "English (Native)"'
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addLanguage();
              }
            }}
          />
          <Button type="button" size="sm" onClick={addLanguage} disabled={!newLang.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Interests Editor ─────────────────────────────────────────────────

interface InterestsEditorProps {
  readonly interests: readonly string[];
  readonly onChange: (interests: readonly string[]) => void;
}

export function InterestsEditor({ interests, onChange }: InterestsEditorProps) {
  const [newItem, setNewItem] = useState("");

  function addItem() {
    const trimmed = newItem.trim();
    if (trimmed && !interests.includes(trimmed)) {
      onChange([...interests, trimmed]);
      setNewItem("");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Interests & Hobbies</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {interests.map((item) => (
            <Badge key={item} variant="outline" className="gap-1 pr-1 text-xs">
              {item}
              <button
                type="button"
                onClick={() => onChange(interests.filter((i) => i !== item))}
                className="ml-0.5 rounded-sm p-0.5 hover:bg-muted"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder='e.g. "Open-source contributing"'
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addItem();
              }
            }}
          />
          <Button type="button" size="sm" onClick={addItem} disabled={!newItem.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Volunteers Editor ─────────────────────────────────────────────────

interface VolunteersEditorProps {
  readonly entries: readonly VolunteerEntry[];
  readonly onChange: (entries: readonly VolunteerEntry[]) => void;
}

export function VolunteersEditor({ entries, onChange }: VolunteersEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  function updateEntry(index: number, updated: VolunteerEntry) {
    onChange(entries.map((e, i) => (i === index ? updated : e)));
  }

  function deleteEntry(index: number) {
    if (editingIndex === index) setEditingIndex(null);
    else if (editingIndex !== null && editingIndex > index)
      setEditingIndex(editingIndex - 1);
    onChange(entries.filter((_, i) => i !== index));
  }

  function addEntry() {
    const newEntry: VolunteerEntry = { organization: "", role: "" };
    onChange([...entries, newEntry]);
    setEditingIndex(entries.length);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Volunteering</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={addEntry}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {entries.length === 0 && (
          <p className="text-sm text-muted-foreground">No volunteer entries yet.</p>
        )}
        {entries.map((entry, index) => (
          <div key={index} className="rounded-md border p-3">
            {editingIndex === index ? (
              <VolunteerEntryForm
                entry={entry}
                onSave={(updated) => {
                  updateEntry(index, updated);
                  setEditingIndex(null);
                }}
                onCancel={() => setEditingIndex(null)}
              />
            ) : (
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium">{entry.role || "Role"}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.organization}
                    {entry.dates ? ` · ${entry.dates}` : ""}
                  </p>
                  {entry.description && (
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                      {entry.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button type="button" variant="ghost" size="icon-xs" onClick={() => setEditingIndex(index)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-xs" onClick={() => deleteEntry(index)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function VolunteerEntryForm({
  entry,
  onSave,
  onCancel,
}: {
  readonly entry: VolunteerEntry;
  readonly onSave: (entry: VolunteerEntry) => void;
  readonly onCancel: () => void;
}) {
  const [organization, setOrganization] = useState(entry.organization);
  const [role, setRole] = useState(entry.role);
  const [dates, setDates] = useState(entry.dates ?? "");
  const [description, setDescription] = useState(entry.description ?? "");

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">Organization</Label>
          <Input value={organization} onChange={(e) => setOrganization(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Role / Position</Label>
          <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Volunteer Coordinator" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Dates (optional)</Label>
          <Input value={dates} onChange={(e) => setDates(e.target.value)} placeholder="Jan 2023 - May 2023" />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Description (optional)</Label>
        <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          <X className="mr-1 h-3.5 w-3.5" />
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() =>
            onSave({
              organization: organization.trim(),
              role: role.trim(),
              ...(dates.trim() ? { dates: dates.trim() } : {}),
              ...(description.trim() ? { description: description.trim() } : {}),
            })
          }
        >
          <Check className="mr-1 h-3.5 w-3.5" />
          Save
        </Button>
      </div>
    </div>
  );
}

// ── Affiliations Editor ───────────────────────────────────────────────

interface AffiliationsEditorProps {
  readonly entries: readonly AffiliationEntry[];
  readonly onChange: (entries: readonly AffiliationEntry[]) => void;
}

export function AffiliationsEditor({ entries, onChange }: AffiliationsEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  function updateEntry(index: number, updated: AffiliationEntry) {
    onChange(entries.map((e, i) => (i === index ? updated : e)));
  }

  function deleteEntry(index: number) {
    if (editingIndex === index) setEditingIndex(null);
    else if (editingIndex !== null && editingIndex > index)
      setEditingIndex(editingIndex - 1);
    onChange(entries.filter((_, i) => i !== index));
  }

  function addEntry() {
    const newEntry: AffiliationEntry = { organization: "" };
    onChange([...entries, newEntry]);
    setEditingIndex(entries.length);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Affiliations & Memberships</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={addEntry}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {entries.length === 0 && (
          <p className="text-sm text-muted-foreground">No affiliations yet.</p>
        )}
        {entries.map((entry, index) => (
          <div key={index} className="rounded-md border p-3">
            {editingIndex === index ? (
              <AffiliationEntryForm
                entry={entry}
                onSave={(updated) => {
                  updateEntry(index, updated);
                  setEditingIndex(null);
                }}
                onCancel={() => setEditingIndex(null)}
              />
            ) : (
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium">{entry.organization || "Organization"}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.role}
                    {entry.role && entry.dates ? " · " : ""}
                    {entry.dates}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button type="button" variant="ghost" size="icon-xs" onClick={() => setEditingIndex(index)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-xs" onClick={() => deleteEntry(index)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AffiliationEntryForm({
  entry,
  onSave,
  onCancel,
}: {
  readonly entry: AffiliationEntry;
  readonly onSave: (entry: AffiliationEntry) => void;
  readonly onCancel: () => void;
}) {
  const [organization, setOrganization] = useState(entry.organization);
  const [role, setRole] = useState(entry.role ?? "");
  const [dates, setDates] = useState(entry.dates ?? "");

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">Organization</Label>
          <Input value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="ACM, IEEE, etc." />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Role (optional)</Label>
          <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Member, Chair, etc." />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Dates (optional)</Label>
          <Input value={dates} onChange={(e) => setDates(e.target.value)} placeholder="2021 — Present" />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          <X className="mr-1 h-3.5 w-3.5" />
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() =>
            onSave({
              organization: organization.trim(),
              ...(role.trim() ? { role: role.trim() } : {}),
              ...(dates.trim() ? { dates: dates.trim() } : {}),
            })
          }
        >
          <Check className="mr-1 h-3.5 w-3.5" />
          Save
        </Button>
      </div>
    </div>
  );
}

// ── References Editor ─────────────────────────────────────────────────

interface ReferencesEditorProps {
  readonly entries: readonly ReferenceEntry[];
  readonly onChange: (entries: readonly ReferenceEntry[]) => void;
}

export function ReferencesEditor({ entries, onChange }: ReferencesEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  function updateEntry(index: number, updated: ReferenceEntry) {
    onChange(entries.map((e, i) => (i === index ? updated : e)));
  }

  function deleteEntry(index: number) {
    if (editingIndex === index) setEditingIndex(null);
    else if (editingIndex !== null && editingIndex > index)
      setEditingIndex(editingIndex - 1);
    onChange(entries.filter((_, i) => i !== index));
  }

  function addEntry() {
    const newEntry: ReferenceEntry = { name: "" };
    onChange([...entries, newEntry]);
    setEditingIndex(entries.length);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">References</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={addEntry}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {entries.length === 0 && (
          <p className="text-sm text-muted-foreground">No references yet.</p>
        )}
        {entries.map((entry, index) => (
          <div key={index} className="rounded-md border p-3">
            {editingIndex === index ? (
              <ReferenceEntryForm
                entry={entry}
                onSave={(updated) => {
                  updateEntry(index, updated);
                  setEditingIndex(null);
                }}
                onCancel={() => setEditingIndex(null)}
              />
            ) : (
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium">{entry.name || "Name"}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.title}
                    {entry.title && entry.institution ? ", " : ""}
                    {entry.institution}
                  </p>
                  {entry.email && (
                    <p className="text-xs text-muted-foreground">{entry.email}</p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button type="button" variant="ghost" size="icon-xs" onClick={() => setEditingIndex(index)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-xs" onClick={() => deleteEntry(index)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ReferenceEntryForm({
  entry,
  onSave,
  onCancel,
}: {
  readonly entry: ReferenceEntry;
  readonly onSave: (entry: ReferenceEntry) => void;
  readonly onCancel: () => void;
}) {
  const [name, setName] = useState(entry.name);
  const [title, setTitle] = useState(entry.title ?? "");
  const [institution, setInstitution] = useState(entry.institution ?? "");
  const [email, setEmail] = useState(entry.email ?? "");
  const [phone, setPhone] = useState(entry.phone ?? "");

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">Full Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Title / Role (optional)</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Professor, CTO, etc." />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Institution (optional)</Label>
          <Input value={institution} onChange={(e) => setInstitution(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Email (optional)</Label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ref@example.com" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Phone (optional)</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          <X className="mr-1 h-3.5 w-3.5" />
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() =>
            onSave({
              name: name.trim(),
              ...(title.trim() ? { title: title.trim() } : {}),
              ...(institution.trim() ? { institution: institution.trim() } : {}),
              ...(email.trim() ? { email: email.trim() } : {}),
              ...(phone.trim() ? { phone: phone.trim() } : {}),
            })
          }
        >
          <Check className="mr-1 h-3.5 w-3.5" />
          Save
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, FileText, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { useResumes } from "@/hooks/use-resumes";
import { useGenerateCoverLetter } from "@/hooks/use-cover-letter";

function CoverLetterGenerator() {
  const { data: resumes = [] } = useResumes();
  const defaultResume = resumes.find((r) => r.isDefault) ?? resumes[0];
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const resumeId = selectedResumeId || defaultResume?.id || "";

  const [jobDescription, setJobDescription] = useState("");
  const [copied, setCopied] = useState(false);
  const { generate, result, isGenerating } = useGenerateCoverLetter();
  const coverLetter = result?.content
    ? [result.content.salutation, result.content.body, result.content.closing]
        .filter(Boolean)
        .join("\n\n")
    : "";
  const generating = isGenerating;

  function handleGenerate() {
    if (!jobDescription.trim()) {
      toast.error("Please paste a job description first.");
      return;
    }
    if (!resumeId) {
      toast.error("Please select a resume first.");
      return;
    }
    void generate({ resumeId, jdText: jobDescription });
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(coverLetter);
      setCopied(true);
      toast.success("Copied to clipboard.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy. Please select and copy manually.");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Job Description</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {resumes.length > 1 && (() => {
            const selected = resumes.find((r) => r.id === resumeId);
            const label = selected
              ? `${selected.title}${selected.isDefault ? " (default)" : ""}`
              : "Select a resume";
            return (
              <div className="space-y-1.5">
                <Label>Resume</Label>
                <Select value={resumeId} onValueChange={(val) => setSelectedResumeId(val ?? "")}>
                  <SelectTrigger className="w-full">
                    <span>{label}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {resumes.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.title}{r.isDefault ? " (default)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })()}
          <div className="space-y-1.5">
            <Label>Paste the job description</Label>
            <Textarea
              rows={12}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here..."
            />
          </div>
          <Button
            onClick={handleGenerate}
            disabled={generating || !jobDescription.trim()}
            className="w-full"
          >
            {generating ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="mr-1.5 h-4 w-4" />
                Generate Cover Letter
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Cover Letter</CardTitle>
          {coverLetter && (
            <Button variant="ghost" size="sm" onClick={() => void handleCopy()}>
              {copied ? (
                <Check className="mr-1 h-3.5 w-3.5" />
              ) : (
                <Copy className="mr-1 h-3.5 w-3.5" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {coverLetter ? (
            <div className="whitespace-pre-wrap rounded-md border bg-background/80 backdrop-blur-sm p-4 text-sm">
              {coverLetter}
            </div>
          ) : (
            <div className="flex items-center justify-center rounded-md border border-dashed py-20">
              <p className="text-sm text-muted-foreground">
                Your generated cover letter will appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function CoverLetterPage() {
  return (
    <div className="space-y-6 bg-dot-grid">
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-[oklch(0.45_0.2_260)] to-[oklch(0.45_0.2_300)] bg-clip-text text-transparent">
          Cover Letter Generator
        </h1>
        <p className="text-sm text-muted-foreground">
          Generate a tailored cover letter from any job description.
        </p>
      </div>

      <CoverLetterGenerator />
    </div>
  );
}

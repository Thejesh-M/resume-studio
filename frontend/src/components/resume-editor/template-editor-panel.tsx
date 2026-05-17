"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  File as FileIcon,
  FolderOpen,
  Save,
  Loader2,
  SendHorizonal,
  Sparkles,
  RotateCcw,
  AlertCircle,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  useTemplateFiles,
  useTemplateFileContent,
  useWriteTemplateFile,
  useResetTemplate,
  useAiEditTemplate,
} from "@/hooks/use-resumes";
import { cn } from "@/lib/utils";

interface TemplateEditorPanelProps {
  readonly resumeId: string;
  readonly onFileChanged?: () => void;
}

// Only show editable files in the sidebar
const EDITABLE_EXTENSIONS = new Set([".typ", ".json"]);

function isEditable(path: string): boolean {
  const ext = path.includes(".") ? `.${path.split(".").pop()}` : "";
  return EDITABLE_EXTENSIONS.has(ext);
}

export function TemplateEditorPanel({
  resumeId,
  onFileChanged,
}: TemplateEditorPanelProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [aiInput, setAiInput] = useState("");
  const [contentHistory, setContentHistory] = useState<string[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: files, isLoading: filesLoading } = useTemplateFiles(resumeId);
  const { data: fileData, isLoading: fileLoading } = useTemplateFileContent(
    resumeId,
    selectedFile
  );
  const writeMutation = useWriteTemplateFile();
  const resetMutation = useResetTemplate();
  const aiEditMutation = useAiEditTemplate();

  // Filter to only editable files
  const editableFiles = (files ?? []).filter((f) => isEditable(f.path));

  // Auto-select first file
  useEffect(() => {
    if (!selectedFile && editableFiles.length > 0) {
      const main = editableFiles.find((f) => f.path === "template.typ");
      setSelectedFile(main ? main.path : editableFiles[0].path);
    }
  }, [editableFiles, selectedFile]);

  // Load file content when selected
  useEffect(() => {
    if (fileData) {
      setEditorContent(fileData.content);
      setOriginalContent(fileData.content);
      setContentHistory([]);
    }
  }, [fileData]);

  const isDirty = editorContent !== originalContent;

  const handleSave = useCallback(async () => {
    if (!selectedFile) return;
    try {
      await writeMutation.mutateAsync({
        resumeId,
        filePath: selectedFile,
        content: editorContent,
      });
      setOriginalContent(editorContent);
      toast.success(`Saved ${selectedFile}`);
      onFileChanged?.();
    } catch {
      toast.error("Failed to save file.");
    }
  }, [resumeId, selectedFile, editorContent, writeMutation, onFileChanged]);

  const handleAiEdit = useCallback(async () => {
    const trimmed = aiInput.trim();
    if (!trimmed) return;

    try {
      const result = await aiEditMutation.mutateAsync({
        resumeId,
        message: trimmed,
        targetFile: selectedFile ?? undefined,
      });

      // Push current content to history for undo
      setContentHistory((prev) => [editorContent, ...prev].slice(0, 5));

      // Apply the first change that matches the selected file, or any change
      const relevantChange = result.changes.find(
        (c) => c.file_path === selectedFile
      );
      if (relevantChange) {
        setEditorContent(relevantChange.content);
        setOriginalContent(relevantChange.content); // AI edits are auto-saved
      }

      toast.success(result.reply);
      setAiInput("");
      onFileChanged?.();
    } catch {
      toast.error("AI edit failed. Please try again.");
    }
  }, [
    resumeId,
    selectedFile,
    aiInput,
    editorContent,
    aiEditMutation,
    onFileChanged,
  ]);

  function handleUndo() {
    if (contentHistory.length === 0) return;
    const [prev, ...rest] = contentHistory;
    setEditorContent(prev);
    setContentHistory(rest);
    toast.success("Reverted to previous version.");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Cmd/Ctrl+S to save
    if ((e.metaKey || e.ctrlKey) && e.key === "s") {
      e.preventDefault();
      void handleSave();
    }
  }

  function handleAiKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleAiEdit();
    }
  }

  // Tab key inserts 2 spaces in the code editor
  function handleEditorKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    handleKeyDown(e);
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newValue =
        editorContent.substring(0, start) +
        "  " +
        editorContent.substring(end);
      setEditorContent(newValue);
      // Restore cursor position after React re-render
      requestAnimationFrame(() => {
        target.selectionStart = start + 2;
        target.selectionEnd = start + 2;
      });
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* File sidebar + code editor */}
      <div className="flex min-h-0 flex-1">
        {/* File list */}
        <div className="w-44 shrink-0 overflow-y-auto border-r border-border/50 bg-muted/20">
          <div className="flex items-center justify-between border-b border-border/30 px-3 py-2">
            <div className="flex items-center gap-1.5">
              <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                Template Files
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
              title="Reset template to default"
              disabled={resetMutation.isPending}
              onClick={() => {
                if (!confirm("Reset template to default? This will discard all customizations.")) return;
                void resetMutation.mutateAsync(resumeId).then(() => {
                  toast.success("Template reset to default.");
                  setSelectedFile(null);
                  onFileChanged?.();
                }).catch(() => toast.error("Failed to reset template."));
              }}
            >
              {resetMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCcw className="h-3 w-3" />
              )}
            </Button>
          </div>
          {filesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : editableFiles.length === 0 ? (
            <div className="px-3 py-4 text-xs text-muted-foreground">
              No editable files found.
            </div>
          ) : (
            <div className="py-1">
              {editableFiles.map((f) => (
                <button
                  key={f.path}
                  type="button"
                  onClick={() => setSelectedFile(f.path)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors",
                    selectedFile === f.path
                      ? "bg-[oklch(0.55_0.2_260_/_10%)] text-[oklch(0.45_0.2_260)] font-medium"
                      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  )}
                >
                  <FileIcon className="h-3 w-3 shrink-0" />
                  <span className="truncate">{f.path}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Code editor */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Editor toolbar */}
          {selectedFile && (
            <div className="flex items-center justify-between border-b border-border/30 px-3 py-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">{selectedFile}</span>
                {isDirty && (
                  <span className="h-2 w-2 rounded-full bg-amber-400" title="Unsaved changes" />
                )}
              </div>
              <div className="flex items-center gap-1">
                {contentHistory.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 gap-1 text-xs"
                    onClick={handleUndo}
                  >
                    <RotateCcw className="h-3 w-3" />
                    Undo
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 gap-1 text-xs"
                  onClick={() => void handleSave()}
                  disabled={!isDirty || writeMutation.isPending}
                >
                  {writeMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Save className="h-3 w-3" />
                  )}
                  Save
                </Button>
              </div>
            </div>
          )}

          {/* File content */}
          {!selectedFile ? (
            <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
              Select a file to edit
            </div>
          ) : fileLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={editorContent}
              onChange={(e) => setEditorContent(e.target.value)}
              onKeyDown={handleEditorKeyDown}
              className="flex-1 resize-none bg-background p-3 font-mono text-xs leading-relaxed outline-none"
              spellCheck={false}
            />
          )}
        </div>
      </div>

      {/* AI edit bar */}
      <div className="border-t border-border/50 p-3">
        <div className="mb-1.5 flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-[oklch(0.55_0.2_260)]" />
          <span className="text-[10px] font-medium text-muted-foreground">
            AI Template Editor
          </span>
          {aiEditMutation.isError && (
            <span className="flex items-center gap-1 text-[10px] text-destructive">
              <AlertCircle className="h-3 w-3" /> Edit failed
            </span>
          )}
        </div>
        <div className="flex items-end gap-2">
          <Textarea
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            onKeyDown={handleAiKeyDown}
            placeholder="Ask AI to modify the template (e.g., &quot;Make headings blue&quot;, &quot;Increase margins&quot;)..."
            className="min-h-[48px] max-h-[100px] resize-none text-xs"
            disabled={aiEditMutation.isPending}
          />
          <Button
            size="icon"
            className="h-9 w-9 shrink-0 bg-gradient-to-br from-[oklch(0.55_0.2_260)] to-[oklch(0.55_0.2_300)] text-white hover:opacity-90"
            onClick={() => void handleAiEdit()}
            disabled={!aiInput.trim() || aiEditMutation.isPending}
            title="Send (Enter)"
          >
            {aiEditMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SendHorizonal className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="mt-1 text-center text-[10px] text-muted-foreground">
          Enter to send · Ctrl/Cmd+S to save file
        </p>
      </div>
    </div>
  );
}

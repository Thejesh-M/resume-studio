"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResumeContentEditor } from "@/components/resume/resume-content-editor";
import { EditorTopbar } from "./editor-topbar";
import { ChatPanel } from "./chat-panel";
import { PdfPreviewPanel } from "./pdf-preview-panel";
import { useUpdateResume, useCompileResume, useChatResume } from "@/hooks/use-resumes";
import type { ChatMsg } from "./chat-message";
import type { UserResume } from "@/types/resume";
import type { ResumeContent } from "@/types/resume";

// ── State ─────────────────────────────────────────────────────────────

interface EditorState {
  readonly content: ResumeContent;
  readonly contentHistory: readonly ResumeContent[]; // up to 5 snapshots
  readonly messages: readonly ChatMsg[];
  readonly pdfBlobUrl: string | null;
  readonly isDirty: boolean;
}

type EditorAction =
  | { type: "UPDATE_CONTENT"; content: ResumeContent }
  | { type: "AI_EDIT"; content: ResumeContent; reply: string; changed: readonly string[]; msgId: string }
  | { type: "UNDO" }
  | { type: "ADD_USER_MSG"; id: string; text: string }
  | { type: "SET_PDF_URL"; url: string }
  | { type: "MARK_SAVED" };

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "UPDATE_CONTENT":
      return { ...state, content: action.content, isDirty: true };

    case "AI_EDIT": {
      const snapshot = state.content;
      const history = [snapshot, ...state.contentHistory].slice(0, 5);
      const aiMsg: ChatMsg = {
        id: `ai-${action.msgId}`,
        role: "assistant",
        content: action.reply,
        changed: action.changed,
      };
      return {
        ...state,
        content: action.content,
        contentHistory: history,
        messages: [...state.messages, aiMsg],
        isDirty: true,
      };
    }

    case "UNDO": {
      if (state.contentHistory.length === 0) return state;
      const [prev, ...rest] = state.contentHistory;
      return { ...state, content: prev, contentHistory: rest, isDirty: true };
    }

    case "ADD_USER_MSG": {
      const userMsg: ChatMsg = {
        id: action.id,
        role: "user",
        content: action.text,
      };
      return { ...state, messages: [...state.messages, userMsg] };
    }

    case "SET_PDF_URL":
      return { ...state, pdfBlobUrl: action.url };

    case "MARK_SAVED":
      return { ...state, isDirty: false };

    default:
      return state;
  }
}

// ── Component ─────────────────────────────────────────────────────────

interface ResumeEditorShellProps {
  readonly resume: UserResume;
  readonly allResumes?: readonly UserResume[];
  readonly onResumeChange?: (id: string) => void;
}

const EMPTY_CONTENT: ResumeContent = {
  contact: { name: "", email: "" },
  summary: "",
  experience: [],
  education: [],
  skills: [],
};

export function ResumeEditorShell({ resume, allResumes, onResumeChange }: ResumeEditorShellProps) {
  const [state, dispatch] = useReducer(editorReducer, {
    content: resume.content ?? EMPTY_CONTENT,
    contentHistory: [],
    messages: [],
    pdfBlobUrl: null,
    isDirty: false,
  });

  const updateResume = useUpdateResume();
  const compileMutation = useCompileResume();
  const chatMutation = useChatResume();

  // ── Drag-to-resize ──────────────────────────────────────────────────
  const [leftPct, setLeftPct] = useState(50); // percentage width of left panel
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  function onDividerMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    isDraggingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!isDraggingRef.current || !splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      const rawPct = ((e.clientX - rect.left) / rect.width) * 100;
      // Clamp between 20% and 70%
      setLeftPct(Math.min(70, Math.max(20, rawPct)));
    }

    function onMouseUp() {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  // Revoke old blob URLs to prevent memory leaks
  const prevBlobUrl = useRef<string | null>(null);
  useEffect(() => {
    return () => {
      if (prevBlobUrl.current) URL.revokeObjectURL(prevBlobUrl.current);
    };
  }, []);

  // Debounced compile on content change (500ms)
  const compileTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (compileTimerRef.current) clearTimeout(compileTimerRef.current);
    compileTimerRef.current = setTimeout(() => {
      void triggerCompile(state.content);
    }, 500);
    return () => {
      if (compileTimerRef.current) clearTimeout(compileTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.content]);

  // Debounced auto-save on content change (2s) — only when dirty
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSaveContent = useRef<ResumeContent | null>(resume.content);
  useEffect(() => {
    if (!state.isDirty) return;
    autoSaveContent.current = state.content;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void updateResume.mutateAsync({
        id: resume.id,
        payload: { content: autoSaveContent.current ?? undefined },
      }).then(() => {
        dispatch({ type: "MARK_SAVED" });
      }).catch(() => {
        // Auto-save failures are silent — user can still manually save
      });
    }, 2000);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.content, state.isDirty]);

  async function triggerCompile(content: ResumeContent) {
    try {
      const blob = await compileMutation.mutateAsync({ id: resume.id, content });
      if (blob.size === 0) return; // mock mode — empty blob
      if (prevBlobUrl.current) URL.revokeObjectURL(prevBlobUrl.current);
      const url = URL.createObjectURL(blob);
      prevBlobUrl.current = url;
      dispatch({ type: "SET_PDF_URL", url });
    } catch {
      // Silently ignore compile errors in preview — don't toast on every keystroke
    }
  }

  async function handleSave() {
    try {
      await updateResume.mutateAsync({
        id: resume.id,
        payload: { content: state.content },
      });
      dispatch({ type: "MARK_SAVED" });
      toast.success("Resume saved.");
    } catch {
      toast.error("Failed to save resume.");
    }
  }

  async function handleDownload() {
    const blob = await compileMutation.mutateAsync({ id: resume.id, content: state.content });
    if (blob.size === 0) {
      toast.info("PDF download is not available in mock mode.");
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${resume.title}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const handleSend = useCallback(
    async (message: string) => {
      const msgId = Date.now().toString();
      dispatch({ type: "ADD_USER_MSG", id: `user-${msgId}`, text: message });

      try {
        const result = await chatMutation.mutateAsync({
          id: resume.id,
          message,
          currentContent: state.content,
        });

        dispatch({
          type: "AI_EDIT",
          content: result.updatedContent,
          reply: result.reply,
          changed: result.changed,
          msgId,
        });

        // Template file edits don't change content, so the debounced compile
        // won't fire. Force a recompile to pick up the .typ changes.
        if (result.templateChanged) {
          void triggerCompile(state.content);
        }
      } catch {
        toast.error("AI edit failed. Please try again.");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resume.id, state.content]
  );

  function handleUndo() {
    dispatch({ type: "UNDO" });
    toast.success("Reverted to previous version.");
  }

  // The app layout main has p-6 (24px) padding and h-14 (56px) topbar.
  // We break out of the padding with negative margins so the editor fills the
  // visible viewport below the topbar: calc(100vh - 56px).
  return (
    <div className="-mx-6 -mt-6 -mb-6 flex h-[calc(100vh-3.5rem)] flex-col overflow-hidden">
      <EditorTopbar
        resume={resume}
        allResumes={allResumes}
        onResumeChange={onResumeChange}
        isSaving={updateResume.isPending}
        isDirty={state.isDirty}
        isCompiling={compileMutation.isPending}
        onSave={() => void handleSave()}
        onDownload={() => void handleDownload()}
      />

      {/* Split pane */}
      <div ref={splitContainerRef} className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left: Tabs (Chat | Edit) */}
        <div className="flex min-w-[220px] flex-col overflow-hidden" style={{ width: `${leftPct}%` }}>
          <Tabs defaultValue="chat" className="flex h-full flex-col">
            <TabsList className="mx-3 mt-2 h-8 shrink-0 self-start rounded-lg">
              <TabsTrigger value="chat" className="text-xs">Edit with AI</TabsTrigger>
              <TabsTrigger value="edit" className="text-xs">Edit Form</TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="mt-0 flex-1 overflow-hidden">
              <ChatPanel
                messages={state.messages}
                isSending={chatMutation.isPending}
                onSend={(msg) => void handleSend(msg)}
                onUndo={handleUndo}
                canUndo={state.contentHistory.length > 0}
              />
            </TabsContent>

            <TabsContent value="edit" className="mt-0 flex-1 overflow-y-auto">
              <div className="p-3">
                <ResumeContentEditor
                  content={state.content}
                  onChange={(c) => dispatch({ type: "UPDATE_CONTENT", content: c })}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Drag handle */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize panels"
          onMouseDown={onDividerMouseDown}
          className="group relative flex w-1.5 shrink-0 cursor-col-resize items-center justify-center bg-border/30 hover:bg-[oklch(0.55_0.2_260_/_20%)] active:bg-[oklch(0.55_0.2_260_/_30%)] transition-colors"
        >
          {/* Visual grip dots */}
          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-1 w-1 rounded-full bg-[oklch(0.55_0.2_260)]" />
            ))}
          </div>
        </div>

        {/* Right: PDF preview */}
        <div className="min-w-[200px] flex-1 overflow-hidden">
          <PdfPreviewPanel
            pdfBlobUrl={state.pdfBlobUrl}
            isCompiling={compileMutation.isPending}
          />
        </div>
      </div>
    </div>
  );
}

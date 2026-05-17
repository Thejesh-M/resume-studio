"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { SendHorizonal, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatMessage } from "./chat-message";
import { QuickActionChips } from "./quick-action-chips";
import type { ChatMsg } from "./chat-message";

interface ChatPanelProps {
  readonly messages: readonly ChatMsg[];
  readonly isSending: boolean;
  readonly onSend: (message: string) => void;
  readonly onUndo: () => void;
  readonly canUndo: boolean;
}

export function ChatPanel({
  messages,
  isSending,
  onSend,
  onUndo,
  canUndo,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;
    onSend(trimmed);
    setInput("");
  }, [input, isSending, onSend]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleQuickAction(action: string) {
    onSend(action);
  }

  const showEmptyState = messages.length === 0;

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {showEmptyState ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[oklch(0.55_0.2_260)] to-[oklch(0.55_0.2_300)]">
              <span className="text-xl">✨</span>
            </div>
            <div>
              <p className="text-sm font-medium">AI Resume Editor</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Ask me to improve your resume, add keywords, strengthen bullets, or anything else.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isSending && (
              <div className="flex gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[oklch(0.55_0.2_260)] to-[oklch(0.55_0.2_300)]">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-muted px-3.5 py-2.5">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Quick actions — only shown when no messages yet */}
      {showEmptyState && (
        <QuickActionChips onSelect={handleQuickAction} disabled={isSending} />
      )}

      {/* Input area */}
      <div className="border-t border-border/50 p-3">
        {canUndo && (
          <div className="mb-2 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 gap-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={onUndo}
            >
              <RotateCcw className="h-3 w-3" />
              Undo last change
            </Button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI to edit your resume…"
            className="min-h-[60px] max-h-[140px] resize-none text-sm"
            disabled={isSending}
          />
          <Button
            size="icon"
            className="h-9 w-9 shrink-0 bg-gradient-to-br from-[oklch(0.55_0.2_260)] to-[oklch(0.55_0.2_300)] text-white hover:opacity-90"
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            title="Send (Enter)"
          >
            <SendHorizonal className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

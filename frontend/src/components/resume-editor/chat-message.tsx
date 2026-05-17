"use client";

import { Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChatMsg {
  readonly id: string;
  readonly role: "user" | "assistant";
  readonly content: string;
  readonly changed?: readonly string[];
}

interface ChatMessageProps {
  readonly message: ChatMsg;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-2.5 select-none", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs",
          isUser
            ? "bg-muted text-muted-foreground"
            : "bg-gradient-to-br from-[oklch(0.55_0.2_260)] to-[oklch(0.55_0.2_300)] text-white"
        )}
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
      </div>

      {/* Bubble */}
      <div className={cn("max-w-[85%] space-y-1", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
            isUser
              ? "rounded-tr-sm bg-[oklch(0.55_0.2_260)] text-white"
              : "rounded-tl-sm bg-muted text-foreground"
          )}
        >
          <span className="select-text">{message.content}</span>
        </div>

        {/* Changed sections badge */}
        {message.changed && message.changed.length > 0 && (
          <div className="flex flex-wrap gap-1 px-1">
            {message.changed.map((section) => (
              <span
                key={section}
                className="inline-flex items-center rounded-full border border-[oklch(0.55_0.2_260_/_30%)] bg-[oklch(0.55_0.2_260_/_8%)] px-2 py-0.5 text-[10px] font-medium text-[oklch(0.45_0.2_260)]"
              >
                {section}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

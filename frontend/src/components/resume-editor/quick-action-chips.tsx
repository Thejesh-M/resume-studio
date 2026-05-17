"use client";

const QUICK_ACTIONS = [
  "Improve my summary",
  "Strengthen bullet points",
  "Quantify achievements",
  "Make headings blue",
  "Change font to Times New Roman",
  "Increase page margins",
];

interface QuickActionChipsProps {
  readonly onSelect: (action: string) => void;
  readonly disabled?: boolean;
}

export function QuickActionChips({ onSelect, disabled }: QuickActionChipsProps) {
  return (
    <div className="flex flex-wrap gap-1.5 px-3 py-2">
      {QUICK_ACTIONS.map((action) => (
        <button
          key={action}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(action)}
          className="rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-[oklch(0.55_0.2_260_/_40%)] hover:bg-[oklch(0.55_0.2_260_/_8%)] hover:text-[oklch(0.45_0.2_260)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {action}
        </button>
      ))}
    </div>
  );
}

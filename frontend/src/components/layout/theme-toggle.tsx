"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/providers/theme-provider";

const CYCLE: ReadonlyArray<"system" | "light" | "dark"> = [
  "system",
  "light",
  "dark",
];

const LABELS: Record<string, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

const ICONS: Record<string, typeof Sun> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const handleCycle = () => {
    const currentIndex = CYCLE.indexOf(theme);
    const nextIndex = (currentIndex + 1) % CYCLE.length;
    setTheme(CYCLE[nextIndex]);
  };

  const Icon = ICONS[theme];

  return (
    <button
      type="button"
      onClick={handleCycle}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
      aria-label={`Theme: ${LABELS[theme]}. Click to switch.`}
      title={`Theme: ${LABELS[theme]}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

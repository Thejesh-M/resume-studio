"use client";

import { useState } from "react";
import { ThemeToggle } from "./theme-toggle";
import { MobileNav } from "./mobile-nav";
import { Menu, PanelLeft } from "lucide-react";

interface TopbarProps {
  readonly sidebarCollapsed?: boolean;
  readonly onToggleSidebar?: () => void;
}

export function Topbar({ sidebarCollapsed, onToggleSidebar }: TopbarProps = {}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <header className="flex h-14 items-center justify-between border-b border-border/40 bg-background/80 px-6 backdrop-blur-sm">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        {sidebarCollapsed && onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="hidden lg:inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            title="Expand sidebar"
          >
            <PanelLeft className="h-5 w-5" />
          </button>
        )}
      </div>

      <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />

      <div className="flex items-center gap-3">
        <ThemeToggle />
      </div>
    </header>
  );
}

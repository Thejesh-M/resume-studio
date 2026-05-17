"use client";

import { useState, type ReactNode } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

interface AppLayoutProps {
  readonly children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-muted/20">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
      />
      <div className="relative flex flex-1 flex-col overflow-hidden rounded-l-2xl border-l border-border/30 bg-background shadow-sm">
        <div className="aurora-bg pointer-events-none absolute inset-0" aria-hidden="true" />
        <Topbar
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((v) => !v)}
        />
        <main className="relative flex-1 overflow-y-auto p-6">
          <div className="bg-dot-grid absolute inset-0 opacity-[0.08] pointer-events-none" />
          <div className="relative z-10">
            <ErrorBoundary>{children}</ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}

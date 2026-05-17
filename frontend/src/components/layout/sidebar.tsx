"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  Wand2,
  FileText,
  Palette,
  FileEdit,
  FilePlus,
  BookOpen,
  Sparkles,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";

interface NavItem {
  readonly label: string;
  readonly href: string;
  readonly icon: React.ElementType;
  readonly accent?: boolean;
}

const NAV_ITEMS: readonly NavItem[] = [
  { label: "Dashboard", href: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { label: "Build a Resume", href: ROUTES.ONBOARDING, icon: FilePlus, accent: true },
  { label: "AI Editor", href: ROUTES.EDITOR, icon: Sparkles, accent: true },
  { label: "All Resumes", href: ROUTES.RESUMES, icon: FileText },
  { label: "Templates", href: ROUTES.TEMPLATES, icon: Palette },
  { label: "Cover Letter", href: ROUTES.COVER_LETTER, icon: FileEdit },
  { label: "Tailor Resume", href: ROUTES.TAILOR, icon: Wand2 },
];

const BOTTOM_ITEMS: readonly NavItem[] = [
  { label: "Docs", href: ROUTES.DOCS, icon: BookOpen },
];

function NavLink({
  item,
  pathname,
  collapsed,
}: {
  readonly item: NavItem;
  readonly pathname: string;
  readonly collapsed: boolean;
}) {
  const isActive =
    pathname === item.href ||
    pathname.startsWith(`${item.href}/`) ||
    // Mark AI Editor active when on any /resumes/*/editor route
    (item.href === ROUTES.EDITOR && pathname.endsWith("/editor"));

  const link = (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center rounded-lg text-sm font-medium transition-all duration-200",
        collapsed ? "h-9 w-9 justify-center px-0 py-0" : "gap-3 px-3 py-2",
        isActive
          ? "bg-gradient-to-r from-[oklch(0.55_0.2_260_/_12%)] to-[oklch(0.55_0.2_300_/_8%)] text-foreground shadow-sm"
          : item.accent
            ? "text-[oklch(0.45_0.2_260)] hover:bg-[oklch(0.55_0.2_260_/_8%)] hover:text-[oklch(0.4_0.2_260)]"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      )}
    >
      {isActive && !collapsed && (
        <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-[oklch(0.55_0.2_260)] to-[oklch(0.55_0.2_300)]" />
      )}
      <item.icon
        className={cn(
          "h-4 w-4 shrink-0 transition-colors",
          isActive
            ? "text-[oklch(0.45_0.2_260)]"
            : item.accent
              ? "text-[oklch(0.45_0.2_260)]"
              : "group-hover:text-foreground"
        )}
      />
      {!collapsed && item.label}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger render={link} />
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

interface SidebarProps {
  readonly collapsed: boolean;
  readonly onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <TooltipProvider delay={300}>
      <aside
        className={cn(
          "hidden lg:flex h-full flex-col bg-muted/30 transition-all duration-200 ease-in-out overflow-hidden",
          collapsed ? "w-14" : "w-64"
        )}
      >
        {/* Logo + toggle */}
        <div className={cn("flex h-14 items-center", collapsed ? "justify-center px-0" : "justify-between px-4")}>
          {!collapsed && (
            <Link href={ROUTES.DASHBOARD} className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[oklch(0.45_0.2_260)] to-[oklch(0.45_0.2_300)] shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-base font-bold tracking-tight">
                Open Resume{" "}
                <span className="text-[oklch(0.45_0.2_260)]">Studio</span>
              </span>
            </Link>
          )}

          {collapsed && (
            <Link href={ROUTES.DASHBOARD} className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[oklch(0.45_0.2_260)] to-[oklch(0.45_0.2_300)] shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </Link>
          )}

          {!collapsed && (
            <button
              type="button"
              onClick={onToggle}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Main nav */}
        <nav className={cn("flex-1 pt-4", collapsed ? "px-2" : "px-3")}>
          <div className={cn("space-y-1", collapsed && "flex flex-col items-center")}>
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} collapsed={collapsed} />
            ))}
          </div>
        </nav>

        {/* Bottom nav */}
        <div className={cn("space-y-1 pb-4", collapsed ? "flex flex-col items-center px-2" : "px-3")}>
          <div className={cn("mb-2 h-px bg-border/50", collapsed && "w-8")} />
          {BOTTOM_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} collapsed={collapsed} />
          ))}

          {/* Expand button at the bottom when collapsed */}
          {collapsed && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={onToggle}
                    className="mt-1 flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                    title="Expand sidebar"
                  >
                    <PanelLeft className="h-4 w-4" />
                  </button>
                }
              />
              <TooltipContent side="right">Expand sidebar</TooltipContent>
            </Tooltip>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}

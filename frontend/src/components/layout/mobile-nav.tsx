"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Wand2,
  FileText,
  Palette,
  FileEdit,
  FilePlus,
  BookOpen,
  Sparkles,
} from "lucide-react";

interface NavItem {
  readonly label: string;
  readonly href: string;
  readonly icon: React.ElementType;
}

const NAV_ITEMS: readonly NavItem[] = [
  { label: "Dashboard", href: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { label: "Build a Resume", href: ROUTES.ONBOARDING, icon: FilePlus },
  { label: "AI Editor", href: ROUTES.EDITOR, icon: Sparkles },
  { label: "All Resumes", href: ROUTES.RESUMES, icon: FileText },
  { label: "Templates", href: ROUTES.TEMPLATES, icon: Palette },
  { label: "Cover Letter", href: ROUTES.COVER_LETTER, icon: FileEdit },
  { label: "Tailor Resume", href: ROUTES.TAILOR, icon: Wand2 },
];

const BOTTOM_ITEMS: readonly NavItem[] = [
  { label: "Docs", href: ROUTES.DOCS, icon: BookOpen },
];

function MobileNavLink({
  item,
  pathname,
  onNavigate,
}: {
  readonly item: NavItem;
  readonly pathname: string;
  readonly onNavigate: () => void;
}) {
  const isActive =
    pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-gradient-to-r from-[oklch(0.55_0.2_260_/_12%)] to-[oklch(0.55_0.2_300_/_8%)] text-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      )}
    >
      {isActive && (
        <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-[oklch(0.55_0.2_260)] to-[oklch(0.55_0.2_300)]" />
      )}
      <item.icon
        className={cn(
          "h-4 w-4 transition-colors",
          isActive ? "text-[oklch(0.45_0.2_260)]" : "group-hover:text-foreground"
        )}
      />
      {item.label}
    </Link>
  );
}

interface MobileNavProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const pathname = usePathname();

  const handleNavigate = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" showCloseButton={false} className="w-64 p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>

        {/* Logo */}
        <div className="flex h-14 items-center gap-2 px-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[oklch(0.45_0.2_260)] to-[oklch(0.45_0.2_300)] shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <Link
            href={ROUTES.DASHBOARD}
            onClick={handleNavigate}
            className="text-base font-bold tracking-tight"
          >
            Open Resume{" "}
            <span className="text-[oklch(0.45_0.2_260)]">Studio</span>
          </Link>
        </div>

        {/* Main nav */}
        <nav className="flex-1 px-3 pt-4">
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <MobileNavLink
                key={item.href}
                item={item}
                pathname={pathname}
                onNavigate={handleNavigate}
              />
            ))}
          </div>
        </nav>

        {/* Bottom nav */}
        <div className="space-y-1 px-3 pb-4">
          <div className="mb-2 h-px bg-border/50" />
          {BOTTOM_ITEMS.map((item) => (
            <MobileNavLink
              key={item.href}
              item={item}
              pathname={pathname}
              onNavigate={handleNavigate}
            />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

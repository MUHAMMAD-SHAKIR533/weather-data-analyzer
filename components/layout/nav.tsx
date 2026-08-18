"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import {
  BarChart3,
  BookOpenText,
  ChartColumnIncreasing,
  Gauge,
  Table2,
  Info,
} from "lucide-react";
import { cn } from "@/lib/cn";

export const desktopNavItems = [
  { href: "/", label: "Dashboard", icon: Gauge },
  { href: "/data", label: "Weather Data", icon: Table2 },
  { href: "/analysis", label: "Analysis", icon: ChartColumnIncreasing },
  { href: "/statistics", label: "Statistics", icon: BarChart3 },
  { href: "/about", label: "About Project", icon: BookOpenText },
];

export const mobileNavItems = desktopNavItems.slice(0, 4);

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition",
        active
          ? "bg-surface-container-low text-primary"
          : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-background",
      )}
    >
      <span className={cn("flex h-9 w-9 items-center justify-center rounded-md", active && "bg-primary/10")}>
        <Icon className="h-4 w-4" />
      </span>
      <span>{label}</span>
      {active ? <span className="ml-auto h-8 w-1 rounded-full bg-primary" /> : null}
    </Link>
  );
}

export function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-[260px] shrink-0 border-r border-outline-variant bg-surface/95 px-4 py-5 lg:flex lg:flex-col">
      <div className="mb-8 flex items-center gap-3 px-2">
        <BrandMark />
        <div>
          <div className="text-lg font-semibold tracking-[-0.01em] text-on-background">
            Weather Data Analyzer
          </div>
          <div className="text-xs uppercase tracking-[0.05em] text-on-surface-variant">
            Atmospheric Intelligence
          </div>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {desktopNavItems.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={pathname === item.href}
          />
        ))}
      </nav>
    </aside>
  );
}

export function TabletRail() {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-[72px] shrink-0 border-r border-outline-variant bg-surface/95 px-2 py-4 md:flex lg:hidden">
      <div className="mb-6 flex justify-center">
        <BrandMark compact />
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {desktopNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-lg text-on-surface-variant transition hover:bg-surface-container-low",
              pathname === item.href && "bg-surface-container-low text-primary",
            )}
          >
            <item.icon className="h-4 w-4" />
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-outline-variant bg-surface/95 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 shadow-surface md:hidden">
      <div className="grid grid-cols-4 gap-1">
        {mobileNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-[11px] font-medium",
              pathname === item.href ? "text-primary" : "text-on-surface-variant",
            )}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-lg bg-primary/10 text-primary",
        compact ? "h-10 w-10" : "h-11 w-11",
      )}
      aria-hidden="true"
    >
      <div className="absolute h-6 w-6 rounded-full border-2 border-current" />
      <div className="absolute left-2 top-5 h-px w-4 bg-current" />
      <div className="absolute right-2 top-3 h-4 w-px bg-current" />
    </div>
  );
}

export function AboutLink() {
  const pathname = usePathname();
  return (
    <Link
      href="/about"
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-on-surface-variant transition hover:bg-surface-container-low hover:text-on-background",
        pathname === "/about" && "bg-surface-container-low text-primary",
      )}
    >
      <Info className="h-4 w-4" />
      <span>About Project</span>
    </Link>
  );
}

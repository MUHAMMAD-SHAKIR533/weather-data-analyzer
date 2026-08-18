"use client";

import { Menu } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";

export function Header({
  onMenuClick,
}: {
  onMenuClick: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-outline-variant bg-background/90 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-4 lg:px-6">
        <div className="flex items-center gap-3">
          <Button variant="icon" className="md:hidden" aria-label="Open navigation" onClick={onMenuClick}>
            <Menu className="h-4 w-4" />
          </Button>
          <div className="md:hidden">
            <div className="text-lg font-semibold tracking-[-0.01em] text-on-background">
              Weather Data Analyzer
            </div>
            <div className="text-xs uppercase tracking-[0.05em] text-on-surface-variant">
              Atmospheric Intelligence
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}


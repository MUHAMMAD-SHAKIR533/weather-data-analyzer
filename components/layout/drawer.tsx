"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AboutLink, desktopNavItems } from "@/components/layout/nav";
import { cn } from "@/lib/cn";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function MobileDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "fixed inset-0 z-40 bg-black/35 transition md:hidden",
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
      )}
      aria-hidden={!open}
    >
      <button
        type="button"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={onClose}
        aria-label="Close navigation drawer"
      />
      <aside
        className={cn(
          "absolute left-0 top-0 h-full w-[82vw] max-w-[320px] border-r border-outline-variant bg-surface p-5 shadow-overlay transition-transform",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-on-background">Weather Data Analyzer</div>
            <div className="text-xs uppercase tracking-[0.05em] text-on-surface-variant">
              Atmospheric Intelligence
            </div>
          </div>
          <Button variant="icon" aria-label="Close navigation" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          {desktopNavItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium",
                  active
                    ? "bg-surface-container-low text-primary"
                    : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-background",
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
                {active ? <span className="ml-auto h-2 w-2 rounded-full bg-primary" /> : null}
              </Link>
            );
          })}
          <div className="mt-2 border-t border-outline-variant pt-2">
            <AboutLink />
          </div>
        </div>
      </aside>
    </div>
  );
}


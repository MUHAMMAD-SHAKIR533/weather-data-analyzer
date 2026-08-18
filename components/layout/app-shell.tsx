"use client";

import React, { useState } from "react";
import type { ReactNode } from "react";
import { BottomTabBar, DesktopSidebar, TabletRail } from "@/components/layout/nav";
import { Header } from "@/components/layout/header";
import { MobileDrawer } from "@/components/layout/drawer";
import { cn } from "@/lib/cn";

export function AppShell({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-on-background">
      <div className="flex min-h-screen">
        <DesktopSidebar />
        <TabletRail />
        <div className="flex min-h-screen flex-1 flex-col">
          <Header onMenuClick={() => setDrawerOpen(true)} />
          <main className={cn("flex-1 px-4 pb-24 pt-5 md:px-6 md:pb-8 lg:px-6")}>{children}</main>
          <footer className="border-t border-outline-variant px-4 py-4 text-center text-xs text-on-surface-variant md:px-6">
            Built by Muhammad Shakir Student at PUCIT,
          </footer>
        </div>
      </div>
      <BottomTabBar />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <OfflineToast />
    </div>
  );
}

function OfflineToast() {
  const offline = React.useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("online", onStoreChange);
      window.addEventListener("offline", onStoreChange);
      return () => {
        window.removeEventListener("online", onStoreChange);
        window.removeEventListener("offline", onStoreChange);
      };
    },
    () => !navigator.onLine,
    () => false,
  );

  if (!offline) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 rounded-lg border border-outline-variant bg-surface px-4 py-3 text-sm text-on-background shadow-overlay md:bottom-6">
      You&apos;re offline. Some data may be out of date.
    </div>
  );
}

import { cn } from "@/lib/cn";
import type { CSSProperties, ReactNode } from "react";

export function Badge({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.05em]",
        className,
      )}
      style={style}
    >
      {children}
    </span>
  );
}

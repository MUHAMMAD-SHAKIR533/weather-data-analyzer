import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export function ChartCard({
  title,
  subtitle,
  children,
  className,
  summary,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  summary: string;
}) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-on-background">{title}</h3>
          {subtitle ? <p className="text-sm text-on-surface-variant">{subtitle}</p> : null}
        </div>
      </CardHeader>
      <CardBody>
        <p className="sr-only">{summary}</p>
        {children}
      </CardBody>
    </Card>
  );
}


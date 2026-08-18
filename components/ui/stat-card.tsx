import { Card, CardBody } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  unit,
  helper,
  icon,
  accentClassName,
}: {
  label: string;
  value: string;
  unit?: string;
  helper?: string;
  icon?: ReactNode;
  accentClassName?: string;
}) {
  return (
    <Card className="h-full">
      <CardBody className="flex h-full flex-col gap-3">
        <div className={cn("flex items-center justify-between text-on-surface-variant", accentClassName)}>
          <span className="text-xl">{icon}</span>
          <span className="text-xs font-semibold uppercase tracking-[0.05em]">{label}</span>
        </div>
        <div className="flex items-end gap-2">
          <div className="text-[32px] font-bold leading-tight tracking-[-0.01em] text-on-background">
            {value}
          </div>
          {unit ? <div className="pb-1 text-sm text-on-surface-variant">{unit}</div> : null}
        </div>
        {helper ? <p className="text-sm text-on-surface-variant">{helper}</p> : null}
      </CardBody>
    </Card>
  );
}


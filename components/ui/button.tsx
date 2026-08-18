import * as React from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", type = "button", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center gap-2 rounded-md text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50";

    const variants: Record<ButtonVariant, string> = {
      primary: "bg-primary px-4 py-3 text-on-primary hover:bg-primary-hover",
      secondary: "border border-outline-variant bg-transparent px-4 py-3 text-on-surface-variant hover:bg-surface-container-low",
      ghost: "bg-transparent px-3 py-2 text-on-surface-variant hover:bg-surface-container-low",
      icon: "h-10 w-10 rounded-full border border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-container-low",
    };

    return <button ref={ref} type={type} className={cn(base, variants[variant], className)} {...props} />;
  },
);

Button.displayName = "Button";


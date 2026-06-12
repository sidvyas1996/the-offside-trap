import React from "react";
import { cn } from "../../lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "outline" | "transparent";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center rounded-lg text-sm font-medium px-4 py-2 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
                    variant === "default"
                        ? "bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--on-primary)] font-semibold"
                        : variant === "outline"
                        ? "border border-[var(--theme-border-btn)] text-[var(--theme-secondary-text)] hover:bg-white/5 hover:text-[var(--on-surface)] hover:border-[var(--hairline-strong)]"
                        : "bg-transparent text-[var(--on-surface-variant)] hover:bg-white/5 hover:text-[var(--on-surface)]",
                    className
                )}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

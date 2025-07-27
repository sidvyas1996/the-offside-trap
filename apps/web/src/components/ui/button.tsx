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
                    "inline-flex items-center justify-center rounded-md text-sm font-medium px-4 py-2 transition-colors",
                    variant === "default"
                        ? "bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white"
                        : variant === "outline"
                        ? "border border-white text-white hover:bg-white/10"
                        : "bg-transparent text-white hover:bg-white/10",
                    className
                )}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

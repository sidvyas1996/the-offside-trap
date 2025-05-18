import React from "react";
import { cn } from "../../lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Avatar({ className, ...props }: AvatarProps) {
    return (
        <div
            className={cn(
                "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted",
                className
            )}
            {...props}
        />
    );
}

interface AvatarFallbackProps extends React.HTMLAttributes<HTMLSpanElement> {}

export function AvatarFallback({ className, children, ...props }: AvatarFallbackProps) {
    return (
        <span
            className={cn(
                "flex h-full w-full items-center justify-center rounded-full bg-[var(--primary)] text-sm font-medium text-white",
                className
            )}
            {...props}
        >
      {children}
    </span>
    );
}

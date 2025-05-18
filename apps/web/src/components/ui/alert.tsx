import { AlertCircle } from "lucide-react";
import { cn } from "../../lib/utils";
import React from "react";

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "destructive";
    icon?: React.ReactNode;
}

export function Alert({ variant = "default", icon, className, children, ...props }: AlertProps) {
    return (
        <div
            className={cn(
                "w-full rounded-lg border p-4 flex items-start gap-3",
                variant === "destructive" ? "border-[var(--primary)] bg-red-900/30 text-red-300" : "border-gray-700 bg-[#1f1f1f]",
                className
            )}
            {...props}
        >
            {icon || <AlertCircle className="h-5 w-5 flex-shrink-0" />}
            <div>{children}</div>
        </div>
    );
}

export const AlertDescription = ({ children }: { children: React.ReactNode }) => (
    <p className="text-sm text-gray-300">{children}</p>
);

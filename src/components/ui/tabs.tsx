import React from "react";
import { cn } from "../../lib/utils";

export function Tabs({ children, className }: { children: React.ReactNode; className?: string }) {
    return <div className={cn("space-y-4", className)}>{children}</div>;
}

export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
    return <div className={cn("inline-flex bg-[#222] rounded-md p-1", className)}>{children}</div>;
}

export function TabsTrigger({
                                children,
                                value,
                                isActive,
                                onClick,
                                className,
                            }: {
    children: React.ReactNode;
    value: string;
    isActive?: boolean;
    onClick?: () => void;
    className?: string;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-3 py-1.5 text-sm rounded-md transition-colors",
                isActive ? "bg-[#333] text-white" : "text-gray-400 hover:text-white",
                className
            )}
        >
            {children}
        </button>
    );
}

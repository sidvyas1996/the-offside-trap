
import React, { createContext, useContext, useState } from "react";
import { cn } from "../../lib/utils";

interface TabsContextType {
    value: string;
    onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export function Tabs({
                         children,
                         className,
                         value,
                         defaultValue,
                         onValueChange
                     }: {
    children: React.ReactNode;
    className?: string;
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
}) {
    const [internalValue, setInternalValue] = useState(defaultValue || '');

    const contextValue = {
        value: value !== undefined ? value : internalValue,
        onValueChange: (newValue: string) => {
            if (value === undefined) {
                setInternalValue(newValue);
            }
            onValueChange?.(newValue);
        }
    };

    return (
        <TabsContext.Provider value={contextValue}>
            <div className={cn("space-y-4", className)}>{children}</div>
        </TabsContext.Provider>
    );
}

export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
    return <div className={cn("inline-flex bg-[#222] rounded-md p-1", className)}>{children}</div>;
}

export function TabsTrigger({
                                children,
                                value,
                                className,
                            }: {
    children: React.ReactNode;
    value: string;
    className?: string;
}) {
    const context = useContext(TabsContext);
    if (!context) {
        throw new Error('TabsTrigger must be used within Tabs');
    }

    const isActive = context.value === value;

    return (
        <button
            onClick={() => context.onValueChange(value)}
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
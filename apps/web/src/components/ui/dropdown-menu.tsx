import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "../../lib/utils";
import React from "react";

export const DropdownMenu = DropdownMenuPrimitive.Root;

export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

export const DropdownMenuContent = React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 8, ...props }, ref) => (
    <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
            ref={ref}
            sideOffset={sideOffset}
            className={cn(
                "z-50 min-w-[10rem] rounded-md border border-[#333] bg-[#1F1F1F] p-1 text-sm shadow-lg",
                className
            )}
            {...props}
        />
    </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = "DropdownMenuContent";

export const DropdownMenuItem = React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>
>(({ className, ...props }, ref) => (
    <DropdownMenuPrimitive.Item
        ref={ref}
        className={cn(
            "cursor-pointer select-none rounded-sm px-3 py-2 text-white hover:bg-[#333] focus:bg-[#333] outline-none",
            className
        )}
        {...props}
    />
));
DropdownMenuItem.displayName = "DropdownMenuItem";

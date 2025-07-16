import * as React from "react";
import { cn } from "../../lib/utils";

export const Card = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "rounded-2xl border bg-card text-card-foreground shadow-sm p-0",
            className
        )}
        {...props}
    />
));
Card.displayName = "Card";

export const CardHeader = ({
                               className,
                               ...props
                           }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("p-6 pb-2", className)} {...props} />
);
CardHeader.displayName = "CardHeader";

export const CardTitle = ({
                              className,
                              ...props
                          }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3
        className={cn(
            "text-lg font-semibold leading-none tracking-tight",
            className
        )}
        {...props}
    />
);
CardTitle.displayName = "CardTitle";

export const CardContent = ({
                                className,
                                ...props
                            }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("p-6 pt-0 text-sm text-muted-foreground", className)} {...props} />
);
CardContent.displayName = "CardContent";

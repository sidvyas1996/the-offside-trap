import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

// Badge variants using class-variance-authority for better type safety and variants
const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
                secondary:
                    "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
                destructive:
                    "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
                outline:
                    "text-foreground border-border hover:bg-accent hover:text-accent-foreground",
                // Custom variants for your football tactics theme
                tactical:
                    "border-transparent bg-emerald-500 text-white hover:bg-emerald-600",
                formation:
                    "border-transparent bg-blue-500 text-white hover:bg-blue-600",
                tag:
                    "bg-[#333] hover:bg-[#444] border-none text-[var(--text-primary)] hover:text-white",
            },
            size: {
                default: "px-2.5 py-0.5 text-xs",
                sm: "px-2 py-0.25 text-xs rounded-md",
                lg: "px-3 py-1 text-sm rounded-lg",
            }
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

// TypeScript interface for Badge props
export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof badgeVariants> {
    // Additional custom props can be added here
    children: React.ReactNode;
}

// Badge component
const Badge: React.FC<BadgeProps> = ({
                                         className,
                                         variant,
                                         size,
                                         children,
                                         ...props
                                     }) => {
    return (
        <div
            className={cn(badgeVariants({ variant, size }), className)}
            {...props}
        >
            {children}
        </div>
    );
};

// Export the Badge component and variants for external use
export { Badge, badgeVariants };

// Utility function for creating badges with icons
export const BadgeWithIcon: React.FC<BadgeProps & {
    icon?: React.ReactNode;
    iconPosition?: "left" | "right";
}> = ({
          icon,
          iconPosition = "left",
          children,
          className,
          ...props
      }) => {
    return (
        <Badge className={cn("gap-1", className)} {...props}>
            {icon && iconPosition === "left" && (
                <span className="w-3 h-3 flex items-center justify-center">
          {icon}
        </span>
            )}
            {children}
            {icon && iconPosition === "right" && (
                <span className="w-3 h-3 flex items-center justify-center">
          {icon}
        </span>
            )}
        </Badge>
    );
};

// Utility function for creating removable badges
export const RemovableBadge: React.FC<BadgeProps & {
    onRemove?: () => void;
    removeIcon?: React.ReactNode;
}> = ({
          onRemove,
          removeIcon,
          children,
          className,
          ...props
      }) => {
    const defaultRemoveIcon = (
        <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3"
        >
            <path
                d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );

    return (
        <Badge className={cn("pr-1 gap-1", className)} {...props}>
            {children}
            {onRemove && (
                <button
                    onClick={onRemove}
                    className="ml-1 hover:bg-black/20 rounded-full p-0.5 transition-colors"
                    type="button"
                >
                    {removeIcon || defaultRemoveIcon}
                </button>
            )}
        </Badge>
    );
};

// Example usage components for demonstration
export const TacticTagBadge: React.FC<{ tag: string; onRemove?: () => void }> = ({
                                                                                     tag,
                                                                                     onRemove
                                                                                 }) => {
    if (onRemove) {
        return (
            <RemovableBadge
                variant="tag"
                onRemove={onRemove}
                className="font-normal"
            >
                {tag}
            </RemovableBadge>
        );
    }

    return (
        <Badge variant="tag" className="font-normal">
            {tag}
        </Badge>
    );
};

export const FormationBadge: React.FC<{ formation: string }> = ({ formation }) => (
    <Badge variant="formation" size="sm" className="font-mono">
        {formation}
    </Badge>
);

export const FeaturedBadge: React.FC = () => (
    <BadgeWithIcon
        variant="tactical"
        icon={
            <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        }
    >
        FEATURED
    </BadgeWithIcon>
);

export default Badge;
import * as React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input: React.FC<InputProps> = ({ className = "", ...props }) => {
    return (
        <input
            {...props}
            className={`w-full rounded-xl px-3 py-2 bg-[var(--surface-high)] text-[var(--on-surface)] placeholder:text-[var(--outline)] border-2 border-[var(--ink)] focus:outline-none focus:ring-4 focus:ring-[var(--primary)] ${className}`}
        />
    );
};

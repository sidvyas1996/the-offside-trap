import * as React from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea: React.FC<TextareaProps> = ({ className = "", ...props }) => {
    return (
        <textarea
            {...props}
            className={`w-full bg-[var(--surface-high)] border border-[var(--border)] rounded-xl p-4 text-[var(--on-surface)] placeholder:text-[var(--outline)] resize-none focus:outline-none focus:border-[var(--primary)] transition-colors font-normal ${className}`}

        />
    );
};

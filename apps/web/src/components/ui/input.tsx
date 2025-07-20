import * as React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input: React.FC<InputProps> = ({ className = "", ...props }) => {
    return (
        <input
            {...props}
            className={`w-full rounded-md px-3 py-2 bg-[#333] text-white border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] ${className}`}
        />
    );
};

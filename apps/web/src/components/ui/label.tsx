import * as React from "react";

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
    children: React.ReactNode;
}

export const Label: React.FC<LabelProps> = ({ children, className = "", ...props }) => {
    return (
        <label
            {...props}
            className={`block text-sm font-semibold text-white mb-2 ${className}`}
        >
            {children}
        </label>
    );
};

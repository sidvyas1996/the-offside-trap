import * as React from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea: React.FC<TextareaProps> = ({ className = "", ...props }) => {
    return (
        <textarea
            {...props}
            className={`w-full bg-[#1a1a1a] border border-[rgb(49,54,63)] rounded-xl p-4 text-white resize-none focus:outline-none focus:border-green-500 transition-colors font-normal ${className}`}

        />
    );
};

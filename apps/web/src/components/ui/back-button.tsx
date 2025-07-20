import {ChevronLeft} from "lucide-react";

export const renderBackButton = (onClick: () => void, label: string = "Back") => (
    <ChevronLeft
        className="h-6 w-6 text-gray-400 cursor-pointer hover:text-white"
        onClick={onClick}
    >
        {label}
    </ChevronLeft>
);

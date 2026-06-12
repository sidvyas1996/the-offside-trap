import {ChevronLeft} from "lucide-react";

export const renderBackButton = (onClick: () => void, label: string = "Back") => (
    <button
        type="button"
        className="icon-btn"
        onClick={onClick}
        title={label}
        aria-label={label}
    >
        <ChevronLeft size={18} />
    </button>
);

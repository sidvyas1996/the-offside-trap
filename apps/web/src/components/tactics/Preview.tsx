import React from "react";
import { Target } from "lucide-react";
import MiniTacticCard from "../MiniTacticCard";

const Preview: React.FC = () => {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Target className="h-5 w-5 text-[var(--primary)]" />
        Preview
      </h2>
      <MiniTacticCard />
    </div>
  );
};

export default Preview; 
import React from "react";
import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

const LineupOptions: React.FC = () => {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Users className="h-5 w-5 text-[var(--primary)]" />
        Lineup Options
      </h2>
      <div className="space-y-3">
        <Card className="bg-[var(--card)] border-[var(--border)] cursor-pointer hover:bg-[var(--card-hover)] transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-[var(--primary)]" />
              Single Team
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-[var(--text-secondary)]">
              Focus on your team's formation and tactical setup
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[var(--card)] border-[var(--border)] cursor-pointer hover:bg-[var(--card-hover)] transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-cyan-400" />
              With Opposition
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-[var(--text-secondary)]">
              Show both teams' formations and tactical interactions
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LineupOptions; 
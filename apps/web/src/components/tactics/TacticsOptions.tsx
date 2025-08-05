import React from "react";
import { Target, Settings, Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

const TacticsOptions: React.FC = () => {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Target className="h-5 w-5 text-[var(--primary)]" />
        Tactics Options
      </h2>
      <div className="space-y-3">
        <Card className="bg-[var(--card)] border-[var(--border)] cursor-pointer hover:bg-[var(--card-hover)] transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings className="h-4 w-4 text-amber-500" />
              Still Graphic Tactics
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-[var(--text-secondary)]">
              Create static tactical diagrams with formations and positioning
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[var(--card)] border-[var(--border)] cursor-pointer hover:bg-[var(--card-hover)] transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Video className="h-4 w-4 text-purple-500" />
              Motion Graphic Tactics
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-[var(--text-secondary)]">
              Build animated tactical movements and player sequences
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TacticsOptions; 
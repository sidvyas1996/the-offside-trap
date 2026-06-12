import React from "react";
import { Users, Swords } from "lucide-react";

const OPTIONS = [
  {
    icon: Users,
    title: "Single Team",
    description: "Focus on your team's formation and tactical setup",
    accent: "var(--accent-mint)",
    accentBg: "var(--pastel-mint)",
  },
  {
    icon: Swords,
    title: "With Opposition",
    description: "Show both teams' formations and tactical interactions",
    accent: "var(--accent-lavender)",
    accentBg: "var(--pastel-lavender)",
  },
];

const LineupOptions: React.FC = () => {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "var(--surface-container)", border: "1px solid var(--hairline)", boxShadow: "var(--card-shadow)" }}
    >
      <h2 className="panel-title mb-4">
        <span className="icon-chip"><Users size={14} /></span>
        Lineup Options
      </h2>
      <div className="space-y-2.5">
        {OPTIONS.map(({ icon: Icon, title, description, accent, accentBg }) => (
          <div
            key={title}
            className="flex items-start gap-3 rounded-xl p-3 cursor-pointer transition-all hover:translate-y-[-1px]"
            style={{ background: "var(--surface-low)", border: "1px solid var(--hairline)" }}
          >
            <span
              className="flex items-center justify-center rounded-lg flex-shrink-0"
              style={{ width: 30, height: 30, background: accentBg, color: accent }}
            >
              <Icon size={15} />
            </span>
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--on-surface)" }}>{title}</div>
              <p className="text-xs mt-0.5" style={{ color: "var(--on-surface-variant)", lineHeight: 1.5 }}>
                {description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LineupOptions;

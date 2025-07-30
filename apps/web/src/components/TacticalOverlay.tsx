import React, { useState } from "react";

interface TacticalOverlayProps {
  showHorizontalZones?: boolean;
  showVerticalSpaces?: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}

const TacticalOverlay: React.FC<TacticalOverlayProps> = ({
  showHorizontalZones = false,
  showVerticalSpaces = false,
  x,
  y,
  width,
  height,
}) => {
  const [hoveredArea, setHoveredArea] = useState<string | null>(null);

  if (!showHorizontalZones && !showVerticalSpaces) {
    return null;
  }

  return (
    <svg
      x={x}
      y={y}
      width={width}
      height={height}
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      style={{ zIndex: 4 }}
    >
      {/* Horizontal Zones (Thirds) - Aligned with field markings */}
      {showHorizontalZones && (
        <g>
          {/* Defensive Third - Left penalty box area */}
          <rect 
            x="0" y="0" width="25" height="100" 
            fill="rgba(255, 255, 255, 0.05)" 
            stroke="rgba(255, 255, 255, 0.2)" 
            strokeWidth="0.5" 
            strokeDasharray="2,2"
            className="cursor-pointer hover:fill-[rgba(255,255,255,0.15)] transition-colors"
            onMouseEnter={() => setHoveredArea("defensive")}
            onMouseLeave={() => setHoveredArea(null)}
          />
          <text x="12.5" y="50" textAnchor="middle" fill="white" fontSize="1.8" dominantBaseline="middle" fontWeight="bold">Defensive third</text>
          
          {/* Middle Third - Center area between penalty boxes */}
          <rect 
            x="25" y="0" width="50" height="100" 
            fill="rgba(255, 255, 255, 0.05)" 
            stroke="rgba(255, 255, 255, 0.2)" 
            strokeWidth="0.5" 
            strokeDasharray="2,2"
            className="cursor-pointer hover:fill-[rgba(255,255,255,0.15)] transition-colors"
            onMouseEnter={() => setHoveredArea("middle")}
            onMouseLeave={() => setHoveredArea(null)}
          />
          <text x="50" y="50" textAnchor="middle" fill="white" fontSize="1.8" dominantBaseline="middle" fontWeight="bold">Middle third</text>
          
          {/* Final Third - Right penalty box area */}
          <rect 
            x="75" y="0" width="25" height="100" 
            fill="rgba(255, 255, 255, 0.05)" 
            stroke="rgba(255, 255, 255, 0.2)" 
            strokeWidth="0.5" 
            strokeDasharray="2,2"
            className="cursor-pointer hover:fill-[rgba(255,255,255,0.15)] transition-colors"
            onMouseEnter={() => setHoveredArea("final")}
            onMouseLeave={() => setHoveredArea(null)}
          />
          <text x="87.5" y="50" textAnchor="middle" fill="white" fontSize="1.8" dominantBaseline="middle" fontWeight="bold">Final third</text>
        </g>
      )}
      
      {/* Vertical Lanes (Spaces) - Aligned with field markings */}
      {showVerticalSpaces && (
        <g>
          {/* Wide Area Left - Outside penalty box */}
          <rect 
            x="0" y="0" width="15" height="100" 
            fill="rgba(255, 255, 255, 0.1)" 
            stroke="rgba(255, 255, 255, 0.3)" 
            strokeWidth="0.5"
            className="cursor-pointer hover:fill-[rgba(255,255,255,0.2)] transition-colors"
            onMouseEnter={() => setHoveredArea("wide-left")}
            onMouseLeave={() => setHoveredArea(null)}
          />
          <text x="7.5" y="50" textAnchor="middle" fill="white" fontSize="2" dominantBaseline="middle" fontWeight="bold">Wide area</text>
          
          {/* Half-space Left - Inside penalty box */}
          <rect 
            x="15" y="0" width="10" height="100" 
            fill="rgba(255, 255, 255, 0.15)" 
            stroke="rgba(255, 255, 255, 0.3)" 
            strokeWidth="0.5"
            className="cursor-pointer hover:fill-[rgba(255,255,255,0.25)] transition-colors"
            onMouseEnter={() => setHoveredArea("half-left")}
            onMouseLeave={() => setHoveredArea(null)}
          />
          <text x="20" y="50" textAnchor="middle" fill="white" fontSize="1.8" dominantBaseline="middle" fontWeight="bold">Half-space</text>
          
          {/* Center - Center circle area */}
          <rect 
            x="25" y="0" width="50" height="100" 
            fill="rgba(255, 255, 255, 0.1)" 
            stroke="rgba(255, 255, 255, 0.3)" 
            strokeWidth="0.5"
            className="cursor-pointer hover:fill-[rgba(255,255,255,0.2)] transition-colors"
            onMouseEnter={() => setHoveredArea("center")}
            onMouseLeave={() => setHoveredArea(null)}
          />
          <text x="50" y="50" textAnchor="middle" fill="white" fontSize="2.5" dominantBaseline="middle" fontWeight="bold">Centre</text>
          
          {/* Half-space Right - Inside penalty box */}
          <rect 
            x="75" y="0" width="10" height="100" 
            fill="rgba(255, 255, 255, 0.15)" 
            stroke="rgba(255, 255, 255, 0.3)" 
            strokeWidth="0.5"
            className="cursor-pointer hover:fill-[rgba(255,255,255,0.25)] transition-colors"
            onMouseEnter={() => setHoveredArea("half-right")}
            onMouseLeave={() => setHoveredArea(null)}
          />
          <text x="80" y="50" textAnchor="middle" fill="white" fontSize="1.8" dominantBaseline="middle" fontWeight="bold">Half-space</text>
          
          {/* Wide Area Right - Outside penalty box */}
          <rect 
            x="85" y="0" width="15" height="100" 
            fill="rgba(255, 255, 255, 0.1)" 
            stroke="rgba(255, 255, 255, 0.3)" 
            strokeWidth="0.5"
            className="cursor-pointer hover:fill-[rgba(255,255,255,0.2)] transition-colors"
            onMouseEnter={() => setHoveredArea("wide-right")}
            onMouseLeave={() => setHoveredArea(null)}
          />
          <text x="92.5" y="50" textAnchor="middle" fill="white" fontSize="2" dominantBaseline="middle" fontWeight="bold">Wide area</text>
        </g>
      )}

      {/* Tooltip */}
      {hoveredArea && (
        <foreignObject x="50" y="10" width="200" height="40" style={{ transform: 'translateX(-100px)' }}>
          <div className="bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded pointer-events-none">
            {hoveredArea === "defensive" && "Defensive third - Your team's defensive area"}
            {hoveredArea === "middle" && "Middle third - Transition and midfield area"}
            {hoveredArea === "final" && "Final third - Attacking and goal-scoring area"}
            {hoveredArea === "wide-left" && "Wide area - Left flank for crosses and width"}
            {hoveredArea === "half-left" && "Half-space - Left channel for creative play"}
            {hoveredArea === "center" && "Centre - Central corridor for build-up play"}
            {hoveredArea === "half-right" && "Half-space - Right channel for creative play"}
            {hoveredArea === "wide-right" && "Wide area - Right flank for crosses and width"}
          </div>
        </foreignObject>
      )}
    </svg>
  );
};

export default TacticalOverlay; 
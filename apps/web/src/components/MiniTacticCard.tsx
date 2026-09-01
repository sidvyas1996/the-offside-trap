import React from 'react';

interface FootballFieldProps {
    className?: string;
}

const MiniTacticCard: React.FC<FootballFieldProps> = ({ className = '' }) => {
    return (
        <div className={`football-field ${className}`}>
            <svg
                viewBox="0 0 400 250"
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    <pattern id="miniMownStripes" width="72.72" height="250" patternUnits="userSpaceOnUse">
                        <rect x="0" width="36.36" height="250" fill="rgba(255,255,255,0.05)" />
                        <rect x="36.36" width="36.36" height="250" fill="rgba(0,0,0,0.05)" />
                    </pattern>
                </defs>

                {/* Field background */}
                <rect width="400" height="250" fill="#19a974" />
                <rect width="400" height="250" fill="url(#miniMownStripes)" />

                <g opacity="0.32">
                    {/* Outer boundary */}
                    <rect
                        x="10"
                        y="10"
                        width="380"
                        height="230"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                    />

                    {/* Center line */}
                    <line
                        x1="200"
                        y1="10"
                        x2="200"
                        y2="240"
                        stroke="white"
                        strokeWidth="2"
                    />

                    {/* Center circle */}
                    <circle
                        cx="200"
                        cy="125"
                        r="40"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                    />

                    {/* Center spot */}
                    <circle
                        cx="200"
                        cy="125"
                        r="2"
                        fill="white"
                    />

                    {/* Left penalty area */}
                    <rect
                        x="10"
                        y="75"
                        width="65"
                        height="100"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                    />

                    {/* Right penalty area */}
                    <rect
                        x="325"
                        y="75"
                        width="65"
                        height="100"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                    />

                    {/* Left goal area */}
                    <rect
                        x="10"
                        y="100"
                        width="25"
                        height="50"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                    />

                    {/* Right goal area */}
                    <rect
                        x="365"
                        y="100"
                        width="25"
                        height="50"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                    />

                    {/* Left penalty spot */}
                    <circle
                        cx="55"
                        cy="125"
                        r="2"
                        fill="white"
                    />

                    {/* Right penalty spot */}
                    <circle
                        cx="345"
                        cy="125"
                        r="2"
                        fill="white"
                    />

                    {/* Corner arcs */}
                    <path
                        d="M 10,10 A 10,10 0 0,1 20,20"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                    />
                    <path
                        d="M 390,10 A 10,10 0 0,0 380,20"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                    />
                    <path
                        d="M 10,240 A 10,10 0 0,0 20,230"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                    />
                    <path
                        d="M 390,240 A 10,10 0 0,1 380,230"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                    />
                </g>
            </svg>

            {/* Gradient overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20"></div>
        </div>
    );
};

export default MiniTacticCard;
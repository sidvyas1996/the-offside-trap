import React from "react";
import type { ArrowType } from "../../../../../packages/shared/src";

/**
 * The arrows you can draw: a straight and a curved one for the ball, and the
 * same pair for a run.
 *
 * The other types (carry, target, second run, press) still render and animate,
 * since saved tactics contain them — they just can't be picked any more. Every
 * tool picker reads this list, so the widget, the sidebar and the phone dock
 * cannot drift apart.
 */
export interface ArrowTool {
  type: ArrowType;
  group: 'ball' | 'run';
  /** Short, for tight buttons. */
  label: string;
  /** Full name, for tooltips. */
  title: string;
  dashed: boolean;
  /** Bows to whichever side the drag swings. */
  curved: boolean;
  icon: React.FC;
}

const iconProps = { width: 28, height: 16, viewBox: "0 0 28 16", fill: "none" };

export const PassIcon: React.FC = () => (
  <svg {...iconProps}>
    <line x1="2" y1="8" x2="22" y2="8" stroke="#fbbf24" strokeWidth="1.8" strokeDasharray="4,3" />
    <polyline points="17,4 23,8 17,12" fill="none" stroke="#fbbf24" strokeWidth="1.8" />
  </svg>
);

export const CurvedPassIcon: React.FC = () => (
  <svg {...iconProps}>
    <path d="M 2 12 Q 13 1 24 8" stroke="#fbbf24" strokeWidth="1.8" fill="none" />
    <polyline points="19,4 24,8 20,12" fill="none" stroke="#fbbf24" strokeWidth="1.8" />
  </svg>
);

export const StraightRunIcon: React.FC = () => (
  <svg {...iconProps}>
    <line x1="2" y1="8" x2="22" y2="8" stroke="#60a5fa" strokeWidth="2.5" />
    <polygon points="18,4 26,8 18,12" fill="#60a5fa" />
  </svg>
);

export const BendyRunIcon: React.FC = () => (
  <svg {...iconProps}>
    <path d="M 2 13 Q 13 1 24 8" stroke="#60a5fa" strokeWidth="2.5" fill="none" />
    <polygon points="20,5 26,8 21,12" fill="#60a5fa" />
  </svg>
);

export const ARROW_TOOLS: ArrowTool[] = [
  { type: 'pass', group: 'ball', label: 'Pass', title: 'Simple pass', dashed: true, curved: false, icon: PassIcon },
  { type: 'long-ball', group: 'ball', label: 'Curved', title: 'Curved pass', dashed: false, curved: true, icon: CurvedPassIcon },
  { type: 'direct-run', group: 'run', label: 'Straight', title: 'Straight run', dashed: false, curved: false, icon: StraightRunIcon },
  { type: 'curved-run', group: 'run', label: 'Bendy', title: 'Bendy run', dashed: false, curved: true, icon: BendyRunIcon },
];

export const BALL_TOOLS = ARROW_TOOLS.filter(t => t.group === 'ball');
export const RUN_TOOLS = ARROW_TOOLS.filter(t => t.group === 'run');

/** Shown while a curved tool is picked, since the side is a gesture, not a button. */
export const BEND_HINT = 'Swing the drag to either side to choose the bend';

import React, { useEffect, useRef, useState } from 'react';
import {
    PITCH_MARKINGS,
    PITCH_STRIPE_PCT,
    PITCH_VIEWBOX,
    arcPath,
    pctToSvgX,
    pctToSvgY,
    projectMarking,
} from '../utils/pitch.ts';
import { normalizeFieldColor } from '../utils/colors.ts';
import type { TacticPreview } from '../../../../packages/shared';

interface MiniTacticCardProps {
    className?: string;
    /** Markers, colours and (if animated) the sampled replay. Absent draws a bare pitch. */
    preview?: TacticPreview;
    /** Hovered: an animated tactic replays its move; a lineup's markers lift. */
    playing?: boolean;
    /** 0–1 through the replay, for the card's progress line. */
    onProgress?: (p: number) => void;
}

/**
 * A teaser, not a replay — like a video thumbnail scrubbing on hover.
 *
 * It jump-cuts through a few moments from the opening of the move and then cuts
 * back to the start, so the card shows the shape of the idea without giving away
 * how it ends. The stops are fractions of the move; the last one is well short of
 * the finish on purpose.
 */
const TEASER_STOPS = [0.12, 0.28, 0.45];
/** Quick glide into each stop: a cut, softened just enough to read as movement. */
const CUT_MS = 380;
/** Hold on each stop so the moment registers. */
const STOP_HOLD_MS = 520;
/** Pause on the starting shape before the teaser begins again. */
const RESTART_HOLD_MS = 450;
/** Easing back to the starting shape when the pointer leaves. */
const RETURN_MS = 250;

const MARKER_R = 11;

type Pose = { home: [number, number][]; away?: [number, number][]; ball?: [number, number] };

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpPts = (a: [number, number][], b: [number, number][], t: number): [number, number][] =>
    a.map((p, i) => [lerp(p[0], b[i]?.[0] ?? p[0], t), lerp(p[1], b[i]?.[1] ?? p[1], t)]);
const lerpPose = (a: Pose, b: Pose, t: number): Pose => ({
    home: lerpPts(a.home, b.home, t),
    ...(a.away && b.away && { away: lerpPts(a.away, b.away, t) }),
    ...(a.ball && b.ball && { ball: [lerp(a.ball[0], b.ball[0], t), lerp(a.ball[1], b.ball[1], t)] as [number, number] }),
});

/** The pose `u` (0–1) of the way through the sampled frames, eased between neighbours. */
function poseAt(frames: NonNullable<TacticPreview['frames']>, u: number): Pose {
    if (u <= frames[0].t) return frames[0];
    for (let i = 1; i < frames.length; i++) {
        const a = frames[i - 1], b = frames[i];
        if (u <= b.t) return lerpPose(a, b, ease((u - a.t) / Math.max(1e-6, b.t - a.t)));
    }
    return frames[frames.length - 1];
}

const prefersReducedMotion = () =>
    typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);

/**
 * A tactic's thumbnail: the real pitch, its markers, and a short replay on hover.
 *
 * The lines come from the same PITCH_MARKINGS data the studio board draws, on the
 * same 622×350 viewBox, so a card cannot disagree with the board about where the
 * box is. The replay is a distillation — at most a dozen sampled poses, eased
 * between and compressed into a few seconds — because a card is a hint of the
 * move, not a player.
 */
const MiniTacticCard: React.FC<MiniTacticCardProps> = ({ className = '', preview, playing = false, onProgress }) => {
    const frames = preview?.kind === 'animated' ? preview.frames : undefined;
    const start: Pose | null = preview
        ? frames?.[0] ?? {
              home: preview.home.map(m => [m.x, m.y] as [number, number]),
              ...(preview.away && { away: preview.away.map(m => [m.x, m.y] as [number, number]) }),
              ...(preview.ball && { ball: [preview.ball.x, preview.ball.y] as [number, number] }),
          }
        : null;

    const [pose, setPose] = useState<Pose | null>(start);
    const poseRef = useRef(pose);
    poseRef.current = pose;
    const onProgressRef = useRef(onProgress);
    onProgressRef.current = onProgress;
    const reduced = useRef(prefersReducedMotion()).current;

    // Keep the resting pose in step with the data (a list refresh, say).
    useEffect(() => {
        if (!playing) setPose(start);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [preview]);

    useEffect(() => {
        if (!frames || frames.length < 2 || !start || reduced) return;
        let raf = 0;
        const t0 = performance.now();

        if (playing) {
            // One cycle: rest on the start, then cut → hold at each stop, then snap
            // back to the start (a hard cut, like a thumbnail looping).
            const stops = [0, ...TEASER_STOPS];
            const step = CUT_MS + STOP_HOLD_MS;
            const cycle = RESTART_HOLD_MS + TEASER_STOPS.length * step;
            const tick = (now: number) => {
                const e = (now - t0) % cycle;
                let u = 0;
                if (e >= RESTART_HOLD_MS) {
                    const k = e - RESTART_HOLD_MS;
                    const i = Math.min(TEASER_STOPS.length - 1, Math.floor(k / step));
                    const into = Math.min(1, (k - i * step) / CUT_MS);
                    u = lerp(stops[i], stops[i + 1], ease(into));
                }
                setPose(poseAt(frames, u));
                // The bar shows how far the teaser got — visibly short of the end.
                onProgressRef.current?.(u);
                raf = requestAnimationFrame(tick);
            };
            raf = requestAnimationFrame(tick);
        } else {
            // Ease from wherever the replay was back to the starting shape.
            const from = poseRef.current ?? start;
            onProgressRef.current?.(0);
            const tick = (now: number) => {
                const t = Math.min(1, (now - t0) / RETURN_MS);
                setPose(lerpPose(from, start, ease(t)));
                if (t < 1) raf = requestAnimationFrame(tick);
            };
            raf = requestAnimationFrame(tick);
        }
        return () => cancelAnimationFrame(raf);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playing, frames, reduced]);

    const fieldColor = normalizeFieldColor(preview?.colors.fieldColor ?? '');
    const background = `repeating-linear-gradient(90deg,
        rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.05) ${PITCH_STRIPE_PCT}%,
        rgba(0,0,0,0.05) ${PITCH_STRIPE_PCT}%, rgba(0,0,0,0.05) ${PITCH_STRIPE_PCT * 2}%
    ), ${fieldColor}`;

    // A lineup has nothing to replay, so on hover its markers lift in a ripple
    // instead — every card answers the pointer, only animated ones move.
    const lift = playing && !frames && !reduced;

    const markers = (
        team: 'home' | 'away',
        list: TacticPreview['home'] | undefined,
        pts: [number, number][] | undefined,
    ) => {
        if (!list || !pts || !preview) return null;
        const kit = preview.colors[team];
        return list.map((m, i) => {
            const [x, y] = pts[i] ?? [m.x, m.y];
            const label = m.label.length > 3 ? m.label.slice(0, 3) : m.label;
            return (
                <g
                    key={`${team}-${i}`}
                    transform={`translate(${pctToSvgX(x)} ${pctToSvgY(y)})`}
                >
                    <g
                        style={{
                            transform: lift ? 'translateY(-3px)' : 'none',
                            transition: 'transform 220ms ease-out',
                            transitionDelay: lift ? `${i * 25}ms` : '0ms',
                        }}
                    >
                        <circle r={MARKER_R} fill={kit.bg} stroke={kit.border} strokeWidth={2} />
                        <text
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize={label.length > 2 ? 7.5 : 9.5}
                            fontWeight={800}
                            fill={kit.text}
                            style={{ fontFamily: 'var(--font-display)' }}
                        >
                            {label}
                        </text>
                    </g>
                </g>
            );
        });
    };

    return (
        <div className={`relative w-full ${className}`} style={{ background }}>
            <svg viewBox={PITCH_VIEWBOX} className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
                <g opacity={0.32}>
                    {PITCH_MARKINGS.map((marking, i) => {
                        const m = projectMarking(marking, false);
                        const stroke = { stroke: 'white', strokeWidth: 2.5, fill: 'none' } as const;
                        switch (m.kind) {
                            case 'rect':
                                return <rect key={i} x={m.x} y={m.y} width={m.w} height={m.h} {...stroke} />;
                            case 'line':
                                return <line key={i} x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2} stroke="white" strokeWidth={2.5} />;
                            case 'circle':
                                return <circle key={i} cx={m.cx} cy={m.cy} r={m.r} {...stroke} />;
                            case 'dot':
                                return <circle key={i} cx={m.cx} cy={m.cy} r={m.r} fill="white" />;
                            case 'arc':
                                return <path key={i} d={arcPath(m)} {...stroke} />;
                        }
                    })}
                </g>

                {pose && (
                    <>
                        {markers('away', preview?.away, pose.away)}
                        {markers('home', preview?.home, pose.home)}
                        {pose.ball && (
                            <circle
                                cx={pctToSvgX(pose.ball[0])}
                                cy={pctToSvgY(pose.ball[1])}
                                r={5}
                                fill="#ffffff"
                                stroke="#111827"
                                strokeWidth={1.5}
                            />
                        )}
                    </>
                )}
            </svg>
        </div>
    );
};

export default MiniTacticCard;

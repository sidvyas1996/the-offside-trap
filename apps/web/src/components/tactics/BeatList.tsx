import React from "react";
import { X, ArrowRight, Wind, Target, CornerUpRight } from "lucide-react";
import type { MovementTempo, Player, TacticArrow } from "../../../../../packages/shared/src";

interface BeatListProps {
  arrows: TacticArrow[];
  players: Player[];
  oppositionPlayers: Player[];
  /** The beat being authored, highlighted so you can see where a new arrow lands. */
  currentBeat?: number;
  onSetBeat: (arrowId: string, beat: number) => void;
  onSetTempo: (arrowId: string, tempo: MovementTempo) => void;
  onRemove: (arrowId: string) => void;
}

const TEMPOS: MovementTempo[] = ['jog', 'run', 'sprint'];

/** Ball arrows move the ball; the rest move a player. */
const BALL_TYPES = new Set(['pass', 'dribble', 'long-ball', 'target-zone']);

const IMPLIED_TEMPO: Record<string, MovementTempo> = {
  'direct-run': 'run',
  'secondary-run': 'jog',
  'curved-run': 'run',
  'press-run': 'sprint',
};

const chip = (active: boolean): React.CSSProperties => ({
  fontFamily: 'var(--font-display)',
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: '0.03em',
  textTransform: 'uppercase',
  color: active ? 'var(--ink)' : 'var(--text-secondary)',
  background: active ? 'var(--primary)' : 'transparent',
  border: `1.5px solid ${active ? 'var(--ink)' : 'var(--border)'}`,
  borderRadius: 999,
  padding: '2px 8px',
  cursor: 'pointer',
  lineHeight: 1.6,
});

const CIRCLED = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];
export const circled = (n: number) => CIRCLED[n - 1] ?? `(${n})`;

/**
 * The running order.
 *
 * Grouped by beat rather than listed flat, because that grouping *is* the answer
 * to what happens together versus what happens after what — two arrows under one
 * heading move simultaneously, and the headings play in order. A flat list can't
 * say that, which is why sequencing was previously invisible.
 */
const BeatList: React.FC<BeatListProps> = ({
  arrows,
  players,
  oppositionPlayers,
  currentBeat,
  onSetBeat,
  onSetTempo,
  onRemove,
}) => {
  const motion = arrows.filter(a => a.points.length >= 2);
  const markers = arrows.filter(a => a.type === 'target-zone');

  if (motion.length === 0) {
    return (
      <p className="text-xs text-[var(--text-secondary)] py-2" style={{ lineHeight: 1.55 }}>
        Draw an arrow and it moves. Pick a <strong>run</strong> for a player or a
        <strong> pass</strong> for the ball, then give arrows the same <strong>beat</strong> to
        make them happen together, or different beats to put them in order.
      </p>
    );
  }

  const beatOf = (a: TacticArrow) => Math.max(1, Math.floor(a.beat ?? 1));
  const beats = [...new Set(motion.map(beatOf))].sort((x, y) => x - y);

  const nameAt = (pt: { x: number; y: number } | undefined, ref?: TacticArrow['from']) => {
    if (ref) {
      const roster = ref.team === 'home' ? players : oppositionPlayers;
      const p = roster.find(pl => pl.id === ref.playerId);
      const who = p?.position || p?.name || `#${p?.number ?? '?'}`;
      return ref.team === 'away' ? `${who} (opp)` : who;
    }
    void pt;
    return 'space';
  };

  const describe = (a: TacticArrow) => {
    switch (a.type) {
      case 'pass':
      case 'long-ball':
        return <>pass to {nameAt(a.points[1], a.endsAtPlayer ? a.to : undefined)}</>;
      case 'dribble':
        return <>{nameAt(a.points[0], a.from)} carries it</>;
      default:
        return <>{nameAt(a.points[0], a.from)} runs</>;
    }
  };

  const glyph = (a: TacticArrow) =>
    a.type === 'dribble' ? <Wind size={11} />
      : BALL_TYPES.has(a.type) ? <ArrowRight size={11} />
        : a.type === 'curved-run' ? <CornerUpRight size={11} />
          : <ArrowRight size={11} />;

  return (
    <div className="space-y-2">
      {beats.map(beat => (
        <div
          key={beat}
          style={{
            border: 'var(--border-w) solid var(--ink)',
            borderRadius: 12,
            // The beat you are standing on is the one a new arrow joins, so it reads
            // as active rather than being just another group in a list.
            background: beat === currentBeat ? 'var(--surface-container)' : 'var(--surface-low)',
            padding: '8px 10px',
            boxShadow: beat === currentBeat ? '3px 3px 0 var(--primary)' : 'var(--card-shadow)',
          }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 12.5, fontWeight: 800, color: 'var(--on-surface)',
            }}>
              {circled(beat)} Beat {beat}
            </span>
            {motion.filter(a => beatOf(a) === beat).length > 1 && (
              <span
                style={{ ...chip(false), fontSize: 9, cursor: 'default' }}
                title="Everything in a beat happens at the same time"
              >
                together
              </span>
            )}
          </div>

          {motion.filter(a => beatOf(a) === beat).map(a => (
            <div key={a.id} style={{ padding: '3px 0' }}>
              <div className="flex items-center gap-1.5">
                <span
                  className="flex items-center gap-1"
                  style={{ fontFamily: 'var(--font-body)', fontSize: 11.5, color: 'var(--on-surface)' }}
                >
                  {glyph(a)}
                  {describe(a)}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(a.id)}
                  title="Delete this arrow"
                  className="ml-auto"
                  style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', padding: 2,
                  }}
                >
                  <X size={12} />
                </button>
              </div>

              <div className="flex items-center gap-1 flex-wrap mt-1">
                <span className="field-label" style={{ fontSize: 9 }}>beat</span>
                {[1, 2, 3, 4].map(b => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => onSetBeat(a.id, b)}
                    style={chip(beatOf(a) === b)}
                    title={`Move this to beat ${b}`}
                  >
                    {b}
                  </button>
                ))}

                {/* Only a player's run has a tempo — a pass travels as drawn. */}
                {!BALL_TYPES.has(a.type) && (
                  <div className="flex items-center gap-1 ml-1">
                    {TEMPOS.map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => onSetTempo(a.id, t)}
                        style={chip((a.tempo ?? IMPLIED_TEMPO[a.type] ?? 'run') === t)}
                        title={
                          t === 'jog' ? 'Covers the ground steadily'
                            : t === 'run' ? 'Normal running speed'
                              : 'Flat out'
                        }
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}

      {markers.length > 0 && (
        <p
          className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]"
          style={{ paddingLeft: 2 }}
        >
          <Target size={11} />
          {markers.length} target {markers.length === 1 ? 'marker' : 'markers'} — drawn, but
          nothing moves to them.
        </p>
      )}
    </div>
  );
};

export default BeatList;

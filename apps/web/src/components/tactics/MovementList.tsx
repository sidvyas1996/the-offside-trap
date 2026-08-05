import React from "react";
import { X, Repeat } from "lucide-react";
import type { Movement, MovementTempo, Player } from "../../../../../packages/shared/src";
import { describeMovement } from "../../utils/movement-compiler";

interface MovementListProps {
  movements: Movement[];
  players: Player[];
  oppositionPlayers: Player[];
  onUpdate: (id: string, patch: Partial<Movement>) => void;
  onRemove: (id: string) => void;
}

const TEMPOS: MovementTempo[] = ['jog', 'run', 'sprint'];
const REPEAT_OPTIONS = [1, 2, 3, 4];
/** Quarter-loop steps. Enough to break up unison without becoming a timeline. */
const DELAY_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: 'none' },
  { value: 0.25, label: '¼' },
  { value: 0.5, label: '½' },
];

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

/**
 * The authoring surface that replaced the keyframe scrubber.
 *
 * Everything here is football vocabulary — who moves, how they move, how hard,
 * and whether they set off with the others. There is deliberately no notion of
 * time in milliseconds: a movement occupies the whole loop, and `delay` shifts
 * its phase rather than pinning it to a clock.
 */
const MovementList: React.FC<MovementListProps> = ({
  movements,
  players,
  oppositionPlayers,
  onUpdate,
  onRemove,
}) => {
  const labelFor = (m: Movement): string => {
    const { target } = m;
    if (target.kind === 'ball') return describeMovement(m);

    const roster = target.team === 'home' ? players : oppositionPlayers;
    const player = roster.find(p => p.id === target.playerId);
    // Prefer the positional label ("RW") over the name — it is what a coach says.
    const who = player?.position || player?.name || `#${player?.number ?? '?'}`;
    return describeMovement(m, target.team === 'away' ? `${who} (opp)` : who);
  };

  if (movements.length === 0) {
    return (
      <p className="text-xs text-[var(--text-secondary)] text-center py-3">
        Turn on <strong>Movement</strong> in the toolbar, then drag a player to show what they do.
        Drag out and back to make them <strong>shuttle</strong>; drag a loop for a <strong>circuit</strong>.
        A short nudge still just repositions.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {movements.map(m => (
        <div
          key={m.id}
          className="flex items-center gap-2 flex-wrap"
          style={{
            border: '2px solid var(--ink)',
            borderRadius: 12,
            background: 'var(--surface-container)',
            padding: '7px 10px',
            boxShadow: '2px 2px 0 var(--ink)',
          }}
        >
          <span
            className="flex items-center gap-1.5"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 12,
              fontWeight: 800,
              color: 'var(--ink)',
              minWidth: 132,
            }}
          >
            <Repeat size={12} />
            {labelFor(m)}
          </span>

          <div className="flex items-center gap-1">
            {TEMPOS.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => onUpdate(m.id, { tempo: t })}
                style={chip(m.tempo === t)}
                title={
                  t === 'jog' ? 'Continuous, no pause'
                    : t === 'run' ? 'Covers the ground, short breather'
                      : 'Quick burst, then holds'
                }
              >
                {t}
              </button>
            ))}
          </div>

          {/* Repeats are meaningless for a circuit — it runs the ring once per loop */}
          {m.cycle === 'out-and-back' && (
            <div className="flex items-center gap-1">
              <span className="field-label" style={{ fontSize: 9 }}>×</span>
              {REPEAT_OPTIONS.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => onUpdate(m.id, { repeats: r })}
                  style={chip(m.repeats === r)}
                  title={r === 1 ? 'Runs it once per loop' : `Shuttles it ${r} times per loop`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1">
            <span className="field-label" style={{ fontSize: 9 }}>delay</span>
            {DELAY_OPTIONS.map(d => (
              <button
                key={d.value}
                type="button"
                onClick={() => onUpdate(m.id, { delay: d.value })}
                style={chip(Math.abs(m.delay - d.value) < 0.01)}
                title="Sets off later than the others"
              >
                {d.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onRemove(m.id)}
            title="Remove this movement"
            className="ml-auto"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default MovementList;

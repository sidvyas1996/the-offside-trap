import React from "react";
import { X, Repeat, ArrowRight, Timer, Pause, Wind } from "lucide-react";
import type { Movement, MovementTempo, PassSequence, Player } from "../../../../../packages/shared/src";
import { describeMovement } from "../../utils/movement-compiler";

interface MovementListProps {
  movements: Movement[];
  passes: PassSequence;
  players: Player[];
  oppositionPlayers: Player[];
  onUpdate: (id: string, patch: Partial<Movement>) => void;
  onRemove: (id: string) => void;
  onRemovePassNode: (index: number) => void;
  onToggleClosed: () => void;
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
  passes,
  players,
  oppositionPlayers,
  onUpdate,
  onRemove,
  onRemovePassNode,
  onToggleClosed,
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

  const nameOf = (ref?: { team: 'home' | 'away'; playerId: number }): string => {
    if (!ref) return 'space';
    const roster = ref.team === 'home' ? players : oppositionPlayers;
    const p = roster.find(pl => pl.id === ref.playerId);
    const who = p?.position || p?.name || `#${p?.number ?? '?'}`;
    return ref.team === 'away' ? `${who} (opp)` : who;
  };

  if (movements.length === 0 && passes.nodes.length === 0) {
    return (
      <p className="text-xs text-[var(--text-secondary)] py-2" style={{ lineHeight: 1.55 }}>
        Hit <strong>Draw movement</strong>, then drag a player to show what they do.
        Out and back makes them <strong>shuttle</strong>; a loop makes a <strong>circuit</strong>.
        Drag the <strong>ball</strong> to pass — onto a player, or into space to leave a
        target for someone to run onto. A short nudge still just repositions.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {/* ---- The passing move ------------------------------------------- */}
      {passes.nodes.length > 1 && (
        <div
          style={{
            border: 'var(--border-w) solid var(--ink)',
            borderRadius: 12,
            background: 'var(--surface-low)',
            padding: '8px 10px',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 12.5, fontWeight: 800, color: 'var(--on-surface)',
            }}>
              ⚽ Passing move
            </span>
            <button
              type="button"
              onClick={onToggleClosed}
              className="ml-auto"
              style={{ ...chip(passes.closed !== false), fontSize: 9 }}
              title={passes.closed !== false
                ? 'The move recycles back to the start, so the loop is seamless. Click to end it where it finishes instead.'
                : 'The move ends where it finishes, so the ball jumps when the loop restarts. Click to recycle it back to the start.'}
            >
              {passes.closed !== false ? 'recycles' : 'ends open'}
            </button>
          </div>

          {passes.nodes.map((node, i) => (
            <div key={i} className="flex items-center gap-1.5" style={{ padding: '2px 0' }}>
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 800,
                color: 'var(--text-secondary)', minWidth: 14,
              }}>
                {i + 1}
              </span>
              <span
                className="flex items-center gap-1"
                style={{ fontFamily: 'var(--font-body)', fontSize: 11.5, color: 'var(--on-surface)' }}
              >
                {i === 0 ? (
                  node.receiver ? <>starts at {nameOf(node.receiver)}</> : <>ball starts here</>
                ) : node.via === 'dribble' ? (
                  <><Wind size={11} /> {nameOf(node.carrier)} carries it</>
                ) : node.receiver ? (
                  <><ArrowRight size={11} /> pass to {nameOf(node.receiver)}</>
                ) : (
                  <><ArrowRight size={11} /> into space</>
                )}
                {node.holdMs ? (
                  <span
                    className="flex items-center gap-0.5"
                    style={{ color: 'var(--text-secondary)', fontSize: 10 }}
                    title="The ball is held here before the next pass"
                  >
                    <Pause size={9} /> held
                  </span>
                ) : null}
              </span>
              {i > 0 && (
                <button
                  type="button"
                  onClick={() => onRemovePassNode(i)}
                  title="Remove this leg"
                  className="ml-auto"
                  style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', padding: 2,
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {movements.map(m => (
        <div
          key={m.id}
          style={{
            border: 'var(--border-w) solid var(--ink)',
            borderRadius: 12,
            background: 'var(--surface-low)',
            padding: '8px 10px',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          {/* Title line, then a control line. Two lines rather than one because
              this panel now lives in the 400px rail, where a single row of label
              plus a dozen chips wraps into an unreadable pile. */}
          <div className="flex items-center gap-1.5">
            <span
              className="flex items-center gap-1.5"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 12.5,
                fontWeight: 800,
                color: 'var(--on-surface)',
              }}
            >
              {m.repeats > 1 || m.cycle === 'loop' ? <Repeat size={12} /> : <ArrowRight size={12} />}
              {labelFor(m)}
            </span>
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
                padding: 2,
              }}
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex items-center gap-1 flex-wrap mt-1.5">
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

          {/* A run linked to a pass has its delay derived, so offering chips
              would be offering a control that does nothing. */}
          {m.syncToPassNode !== undefined ? (
            <button
              type="button"
              onClick={() => onUpdate(m.id, { syncToPassNode: undefined })}
              className="flex items-center gap-1"
              style={{ ...chip(true), textTransform: 'none' }}
              title="Timed to arrive with the pass. Click to unlink and set the delay yourself."
            >
              <Timer size={10} />
              arrives with the pass
            </button>
          ) : (
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
              {/* A dwelt delay usually isn't one of the presets; showing it
                  stops a real delay from looking unset. */}
              {!DELAY_OPTIONS.some(d => Math.abs(m.delay - d.value) < 0.01) && (
                <span style={chip(true)} title="Set by holding the marker still before dragging">
                  {m.delay.toFixed(2)}
                </span>
              )}
            </div>
          )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MovementList;

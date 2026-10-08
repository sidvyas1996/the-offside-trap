import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, GripVertical, Hand, Redo2, Trash2, Undo2 } from "lucide-react";
import type { ArrowType } from "../../../../../packages/shared/src";
import { ARROW_TOOLS, BALL_TOOLS, RUN_TOOLS, BEND_HINT, type ArrowTool } from "./arrow-tools";

interface ArrowToolWidgetProps {
  arrowTool: ArrowType | null;
  onSetArrowTool: (tool: ArrowType | null) => void;
  arrowBallColor: string;
  onChangeArrowBallColor: (c: string) => void;
  arrowRunColor: string;
  onChangeArrowRunColor: (c: string) => void;
  onClearArrows: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const COLLAPSED_KEY = 'arrow-widget-collapsed';
const POSITION_KEY = 'arrow-widget-position';

/** Inset from the board's edge, and where it starts: top-right, clear of the home side. */
const EDGE = 10;
/** Pointer travel before a press on the pill counts as a drag rather than a click. */
const DRAG_SLOP = 4;

type Pos = { left: number; top: number };

const readPosition = (): Pos | null => {
  try {
    const v = JSON.parse(localStorage.getItem(POSITION_KEY) ?? 'null');
    return v && typeof v.left === 'number' && typeof v.top === 'number' ? v : null;
  } catch { return null; }
};
const writePosition = (p: Pos) => {
  try { localStorage.setItem(POSITION_KEY, JSON.stringify(p)); } catch { /* ignore */ }
};

/** Collapsed is a per-viewer convenience; storage can be missing, so never rely on it. */
const readCollapsed = (): boolean => {
  try { return localStorage.getItem(COLLAPSED_KEY) === '1'; } catch { return false; }
};
const writeCollapsed = (v: boolean) => {
  try { localStorage.setItem(COLLAPSED_KEY, v ? '1' : '0'); } catch { /* ignore */ }
};

const rowLabel: React.CSSProperties = {
  width: 46, flexShrink: 0, fontSize: 9, fontWeight: 800,
  letterSpacing: '0.1em', textTransform: 'uppercase',
};

const iconBtn = (enabled: boolean): React.CSSProperties => ({
  background: 'transparent', border: 'none', display: 'flex', padding: 2,
  color: 'var(--text-secondary)',
  cursor: enabled ? 'pointer' : 'default',
  opacity: enabled ? 1 : 0.35,
});

const Swatch: React.FC<{ color: string; label: string; onChange: (c: string) => void }> = ({ color, label, onChange }) => (
  <label title={`${label} arrow colour`} style={{ position: 'relative', display: 'inline-flex', cursor: 'pointer' }}>
    <span style={{ width: 16, height: 16, borderRadius: 5, background: color, border: 'var(--border-w) solid var(--ink)' }} />
    <input
      type="color"
      value={color}
      onChange={e => onChange(e.target.value)}
      style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
    />
  </label>
);

/**
 * The arrow palette, floating over the pitch.
 *
 * It sits on the board rather than in the toolbar below it because switching
 * between a pass and a run is the thing you do most while drawing, and the
 * toolbar is a scroll away from the pitch. Drag it by its header (or the whole
 * pill when collapsed) to wherever it is not in the way; it stays inside the
 * board and remembers where it was left.
 *
 * Positions itself against its offset parent, so the caller only has to give it
 * a `position: relative` box around the pitch.
 */
const ArrowToolWidget: React.FC<ArrowToolWidgetProps> = ({
  arrowTool,
  onSetArrowTool,
  arrowBallColor,
  onChangeArrowBallColor,
  arrowRunColor,
  onChangeArrowRunColor,
  onClearArrows,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) => {
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const toggle = () => setCollapsed(c => { writeCollapsed(!c); return !c; });

  const rootRef = useRef<HTMLDivElement>(null);
  /** Null until moved: the default corner is expressed with `right`, so it tracks the board's width. */
  const [pos, setPos] = useState<Pos | null>(readPosition);
  const drag = useRef<{ dx: number; dy: number; x0: number; y0: number; moved: boolean } | null>(null);
  /** Swallows the click that ends a drag on the pill, so moving it does not also open it. */
  const suppressClick = useRef(false);

  /** Keep a point inside the board, given the widget's current size. */
  const clamp = (p: Pos): Pos => {
    const el = rootRef.current;
    const parent = el?.offsetParent as HTMLElement | null;
    if (!el || !parent) return p;
    const maxLeft = Math.max(EDGE, parent.clientWidth - el.offsetWidth - EDGE);
    const maxTop = Math.max(EDGE, parent.clientHeight - el.offsetHeight - EDGE);
    return {
      left: Math.min(Math.max(EDGE, p.left), maxLeft),
      top: Math.min(Math.max(EDGE, p.top), maxTop),
    };
  };

  // The board resizes with the window, and expanding the widget makes it bigger:
  // either can push a saved position off the edge, so pull it back in.
  useEffect(() => {
    const parent = rootRef.current?.offsetParent as HTMLElement | null;
    if (!parent || !pos) return;
    const fit = () => setPos(p => {
      if (!p) return p;
      const c = clamp(p);
      return c.left === p.left && c.top === p.top ? p : c;
    });
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(parent);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collapsed, pos === null]);

  const onHandleDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const el = rootRef.current;
    const parent = el?.offsetParent as HTMLElement | null;
    if (!el || !parent) return;
    const r = el.getBoundingClientRect();
    drag.current = { dx: e.clientX - r.left, dy: e.clientY - r.top, x0: e.clientX, y0: e.clientY, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onHandleMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < DRAG_SLOP) return;
    d.moved = true;
    const parent = rootRef.current?.offsetParent as HTMLElement | null;
    if (!parent) return;
    const pr = parent.getBoundingClientRect();
    setPos(clamp({ left: e.clientX - pr.left - d.dx, top: e.clientY - pr.top - d.dy }));
  };
  const onHandleUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    if (d?.moved) {
      suppressClick.current = true;
      setPos(p => { if (p) writePosition(p); return p; });
    }
  };
  const handleProps = {
    onPointerDown: onHandleDown,
    onPointerMove: onHandleMove,
    onPointerUp: onHandleUp,
    onPointerCancel: onHandleUp,
  };

  // Above the pitch's drawing overlay (z 45), which covers the whole board while a
  // tool is active and would otherwise swallow every click after the first; below
  // the bottom sheets and player editor (90+).
  const place: React.CSSProperties = {
    position: 'absolute',
    zIndex: 60,
    ...(pos ? { left: pos.left, top: pos.top } : { top: EDGE, right: EDGE }),
  };

  const active = ARROW_TOOLS.find(t => t.type === arrowTool);

  const card: React.CSSProperties = {
    background: 'var(--surface-high)',
    border: 'var(--border-w) solid var(--ink)',
    borderRadius: 12,
    boxShadow: 'var(--shadow-sm)',
    color: 'var(--on-surface)',
  };

  if (collapsed) {
    const Icon = active?.icon;
    return (
      <div ref={rootRef} style={place}>
        <button
          type="button"
          {...handleProps}
          onClick={() => {
            if (suppressClick.current) { suppressClick.current = false; return; }
            toggle();
          }}
          title="Show arrow tools — drag to move"
          className="flex items-center gap-1.5"
          style={{ ...card, padding: '5px 9px', cursor: 'grab', touchAction: 'none', fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}
        >
          {Icon ? <Icon /> : <Hand size={13} />}
          {active ? active.title : 'Move'}
          <ChevronDown size={13} />
        </button>
      </div>
    );
  }

  const toolButton = (t: ArrowTool) => {
    const Icon = t.icon;
    return (
      <button
        key={t.type}
        type="button"
        title={t.title}
        onClick={() => onSetArrowTool(arrowTool === t.type ? null : t.type)}
        className={`tool-btn${arrowTool === t.type ? ' active' : ''}`}
        style={{ flexDirection: 'column', gap: 2, padding: '3px 6px', minWidth: 52 }}
      >
        <Icon />
        <span style={{ fontSize: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{t.label}</span>
      </button>
    );
  };

  return (
    <div ref={rootRef} style={{ ...place, ...card, padding: '7px 9px 8px', width: 'max-content', maxWidth: 260 }}>
      <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
        {/* The drag handle: the title, so the buttons beside it still click. */}
        <span
          {...handleProps}
          title="Drag to move"
          className="flex items-center gap-1 flex-1"
          style={{ cursor: 'grab', touchAction: 'none', userSelect: 'none', fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--theme-muted)' }}
        >
          <GripVertical size={12} style={{ marginLeft: -3 }} />
          Arrows
        </span>
        <span className="flex items-center gap-1.5">
          <button type="button" onClick={onUndo} disabled={!canUndo} title="Undo (⌘Z)" style={iconBtn(canUndo)}>
            <Undo2 size={13} />
          </button>
          <button type="button" onClick={onRedo} disabled={!canRedo} title="Redo (⇧⌘Z)" style={iconBtn(canRedo)}>
            <Redo2 size={13} />
          </button>
          <Swatch color={arrowBallColor} label="Ball" onChange={onChangeArrowBallColor} />
          <Swatch color={arrowRunColor} label="Run" onChange={onChangeArrowRunColor} />
          <button
            type="button"
            onClick={onClearArrows}
            title="Clear all arrows"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: 2 }}
          >
            <Trash2 size={13} />
          </button>
          <button
            type="button"
            onClick={toggle}
            title="Hide arrow tools"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: 2 }}
          >
            <ChevronUp size={14} />
          </button>
        </span>
      </div>

      {/* Move is "no arrow tool": players drag again, and since a later beat is a
          preview where drags are ignored, picking it also returns to beat 1. */}
      <div className="flex items-center gap-1" style={{ marginBottom: 4 }}>
        <span style={{ ...rowLabel, color: 'var(--theme-muted)' }}>Players</span>
        <button
          type="button"
          title="Move players — returns to the starting positions"
          onClick={() => onSetArrowTool(null)}
          className={`tool-btn${arrowTool === null ? ' active' : ''}`}
          style={{ flexDirection: 'column', gap: 2, padding: '3px 6px', minWidth: 52 }}
        >
          <Hand size={15} />
          <span style={{ fontSize: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Move</span>
        </button>
      </div>
      <div className="flex items-center gap-1" style={{ marginBottom: 4 }}>
        <span style={{ ...rowLabel, color: '#fbbf24' }}>Ball</span>
        {BALL_TOOLS.map(toolButton)}
      </div>
      <div className="flex items-center gap-1">
        <span style={{ ...rowLabel, color: '#60a5fa' }}>Run</span>
        {RUN_TOOLS.map(toolButton)}
      </div>

      {/* Wraps to the buttons' width rather than widening the card: anchored to the
          right, a wider card would shift every button left under the cursor the
          moment a curved tool is picked, and the next click would miss. */}
      {active?.curved && (
        <p style={{ marginTop: 6, width: 0, minWidth: '100%', fontSize: 9.5, lineHeight: 1.35, color: 'var(--text-secondary)' }}>
          {BEND_HINT}
        </p>
      )}
    </div>
  );
};

export default ArrowToolWidget;

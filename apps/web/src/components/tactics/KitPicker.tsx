import React from "react";
import { Shirt, ChevronLeft, ChevronRight } from "lucide-react";
import { KIT_SETS, getKitSetIndex } from "../../data/kits";

interface KitPickerProps {
  /** Currently applied kit id; nothing is selected when unset. */
  value?: string;
  onChange: (kitId: string) => void;
  /**
   * Which team the chosen kit dresses. Home and away pick independently, so the
   * panel says which one it is editing rather than leaving it to be guessed.
   */
  team?: 'home' | 'away';
}

const KitPicker: React.FC<KitPickerProps> = ({ value, onChange, team }) => {
  // Open on the set holding the applied kit, so reopening the panel does not
  // land somewhere that fails to show the current selection.
  const [setIndex, setSetIndex] = React.useState(() => getKitSetIndex(value));

  // Follow the selection when it moves to another set — which happens when the
  // team tab switches and the other team wears a kit from a different set.
  // Keyed on `value` alone, so paging by hand is not undone on every render.
  React.useEffect(() => {
    if (value) setSetIndex(getKitSetIndex(value));
  }, [value]);

  const step = (delta: number) =>
    setSetIndex((i) => (i + delta + KIT_SETS.length) % KIT_SETS.length);

  const activeSet = KIT_SETS[setIndex];
  const kitScale = activeSet.scale ?? 1;

  const navBtn: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 24,
    height: 24,
    borderRadius: 7,
    background: "var(--surface-low)",
    border: "var(--border-w) solid var(--ink)",
    color: "var(--on-surface)",
    cursor: "pointer",
    flexShrink: 0,
  };

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: "var(--surface-container)",
        border: "var(--border-w) solid var(--ink)",
        boxShadow: "var(--card-shadow)",
      }}
    >
      <div className="flex items-center justify-between mb-1 gap-2">
        <h2 className="panel-title" style={{ marginBottom: 0 }}>
          <span className="icon-chip"><Shirt size={14} /></span>
          Kit
        </h2>
        {/* Set pager — only earns its place once there is more than one set. */}
        {KIT_SETS.length > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => step(-1)}
              title="Previous set"
              aria-label="Previous kit set"
              style={navBtn}
            >
              <ChevronLeft size={14} />
            </button>
            <span
              className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: "var(--on-surface-variant)", minWidth: 38, textAlign: "center" }}
            >
              {activeSet.name}
            </span>
            <button
              type="button"
              onClick={() => step(1)}
              title="Next set"
              aria-label="Next kit set"
              style={navBtn}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
      <p className="text-xs mb-4" style={{ color: "var(--on-surface-variant)", lineHeight: 1.5 }}>
        {team === 'away'
          ? "Pick the shirt worn by the away markers."
          : "Pick the shirt worn by your markers."}
      </p>

      <div
        // Fixed height with its own scroll: a full set would otherwise push the
        // rest of the rail off-screen.
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
          gap: 8,
          maxHeight: 264,
          overflowY: "auto",
          paddingRight: 2,
        }}
      >
        {activeSet.kits.map((kit) => {
          const selected = kit.id === value;
          return (
            <button
              key={kit.id}
              type="button"
              title={kit.name}
              aria-label={kit.name}
              aria-pressed={selected}
              onClick={() => onChange(kit.id)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                aspectRatio: "1 / 1",
                // A scaled-up set gives its padding up as headroom, so the
                // larger artwork does not bleed over the swatch border.
                padding: kitScale > 1 ? 0 : 4,
                borderRadius: 10,
                cursor: "pointer",
                background: selected ? "var(--pastel-mint)" : "var(--surface-low)",
                border: `var(--border-w) solid ${selected ? "var(--accent-mint)" : "var(--ink)"}`,
                boxShadow: selected ? "0 0 0 2px var(--accent-mint) inset" : "none",
                transition: "background 120ms ease, border-color 120ms ease",
              }}
            >
              <img
                src={kit.src}
                alt=""
                draggable={false}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  ...(kitScale !== 1 && { transform: `scale(${kitScale})` }),
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default KitPicker;

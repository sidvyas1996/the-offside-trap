import React from "react";
import { Wand2 } from "lucide-react";
import { ANIMATION_PRESETS } from "../../utils/animation-presets";

interface PresetPickerProps {
  onApplyPreset: (presetId: string) => void;
}

/**
 * One-click tactical presets. Rendered as a visible chip row rather than a
 * dropdown: there are only a handful, so showing them all makes them
 * discoverable, and it matches the studio's cream/ink chip styling (the shared
 * dropdown-menu component is hard-coded to a dark theme).
 */
const PresetPicker: React.FC<PresetPickerProps> = ({ onApplyPreset }) => (
  <div className="flex items-center gap-2 flex-wrap">
    <span
      className="flex items-center gap-1.5"
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--text-secondary)',
      }}
    >
      <Wand2 size={13} />
      Presets
    </span>

    {ANIMATION_PRESETS.map(preset => (
      <button
        key={preset.id}
        type="button"
        onClick={() => onApplyPreset(preset.id)}
        title={preset.description}
        className="shadow-[2px_2px_0_var(--ink)] hover:shadow-[3px_3px_0_var(--ink)] hover:-translate-y-px active:shadow-[1px_1px_0_var(--ink)] active:translate-y-0 transition-all"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.02em',
          color: 'var(--ink)',
          background: 'var(--surface-container)',
          border: '2px solid var(--ink)',
          borderRadius: 999,
          padding: '4px 12px',
          cursor: 'pointer',
        }}
      >
        {preset.name}
      </button>
    ))}
  </div>
);

export default PresetPicker;

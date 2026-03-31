import React, { useState, useEffect } from 'react';
import { X, Star, Shield } from 'lucide-react';
import type { Player } from '../../../../../packages/shared';

const POSITIONS = ['GK', 'CB', 'LB', 'RB', 'LWB', 'RWB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST', 'CF'];

interface PlayerEditorPanelProps {
  player: Player | null;
  allPlayers: Player[];
  onClose: () => void;
  onApply: (id: number, updates: Partial<Player>) => void;
  onNameChange?: (id: number, name: string) => void;
}

interface StatusChipProps {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
  activeColor: string;
  activeBg: string;
}

const StatusChip: React.FC<StatusChipProps> = ({
  active, onClick, disabled, icon, label, activeColor, activeBg,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '5px 10px',
      borderRadius: 20,
      border: `1px solid ${active ? activeColor + '55' : 'var(--theme-border-btn)'}`,
      background: active ? activeBg : 'transparent',
      color: active ? activeColor : 'var(--theme-muted)',
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.4 : 1,
      transition: 'all 0.15s ease',
      whiteSpace: 'nowrap',
    }}
  >
    {icon}
    {label}
  </button>
);

const sectionLabel: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--theme-muted)',
  marginBottom: 12,
};

const fieldLabel: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--theme-muted)',
  display: 'block',
  marginBottom: 5,
};

const inputBase: React.CSSProperties = {
  width: '100%',
  background: 'var(--theme-stage)',
  border: '1px solid var(--theme-border)',
  borderRadius: 6,
  padding: '7px 10px',
  fontSize: 13,
  color: 'var(--theme-bright-text)',
  outline: 'none',
  boxSizing: 'border-box',
};

const PlayerEditorPanel: React.FC<PlayerEditorPanelProps> = ({
  player,
  allPlayers,
  onClose,
  onApply,
  onNameChange,
}) => {
  const [draft, setDraft] = useState<Partial<Player>>({});
  const [snapshot, setSnapshot] = useState<Partial<Player>>({});

  useEffect(() => {
    if (player) {
      const snap = { ...player };
      setDraft(snap);
      setSnapshot(snap);
    }
  }, [player?.id]);

  const isOpen = player !== null;

  const handleApply = () => {
    if (!player) return;
    onApply(player.id, draft);
    onClose();
  };

  const toggle = (key: 'isStarPlayer' | 'isCaptain' | 'hasYellowCard' | 'hasRedCard') => {
    setDraft(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const hasCaptainElsewhere = allPlayers.some(p => p.isCaptain && p.id !== player?.id);

  return (
    <>
      {/* Sliding panel */}
      <div
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          bottom: 0,
          width: 300,
          background: 'var(--theme-card)',
          borderLeft: '1px solid var(--theme-border)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: '-12px 0 40px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          borderBottom: '1px solid var(--theme-border)',
          background: 'var(--theme-panel)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--theme-secondary-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--theme-bright-text)' }}>
              Player Editor
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--theme-muted)', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center', lineHeight: 1 }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* General Profile */}
          <section>
            <div style={sectionLabel}>General Profile</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={fieldLabel}>Name</label>
                <input
                  type="text"
                  value={draft.name || ''}
                  onChange={e => {
                    const name = e.target.value;
                    setDraft(prev => ({ ...prev, name }));
                    if (player && onNameChange) onNameChange(player.id, name);
                  }}
                  style={inputBase}
                  placeholder="Player name"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={fieldLabel}>Number</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={draft.number ?? ''}
                    onChange={e => {
                      const n = parseInt(e.target.value);
                      if (!isNaN(n)) setDraft(prev => ({ ...prev, number: n }));
                    }}
                    style={inputBase}
                  />
                </div>
                <div>
                  <label style={fieldLabel}>Position</label>
                  <select
                    value={draft.position || ''}
                    onChange={e => setDraft(prev => ({ ...prev, position: e.target.value }))}
                    style={{ ...inputBase, appearance: 'none' as any, cursor: 'pointer' }}
                  >
                    <option value="" style={{ background: '#0f1930' }}>—</option>
                    {POSITIONS.map(pos => (
                      <option key={pos} value={pos} style={{ background: '#0f1930' }}>{pos}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--theme-border)' }} />

          {/* Operational Status */}
          <section>
            <div style={sectionLabel}>Operational Status</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <StatusChip
                active={!!draft.isStarPlayer}
                onClick={() => toggle('isStarPlayer')}
                icon={<Star size={11} fill={draft.isStarPlayer ? 'currentColor' : 'none'} />}
                label="Star"
                activeColor="#facc15"
                activeBg="rgba(250,204,21,0.12)"
              />
              <StatusChip
                active={!!draft.isCaptain}
                onClick={() => toggle('isCaptain')}
                disabled={hasCaptainElsewhere && !draft.isCaptain}
                icon={<Shield size={11} fill={draft.isCaptain ? 'currentColor' : 'none'} />}
                label="Captain"
                activeColor="#818cf8"
                activeBg="rgba(129,140,248,0.12)"
              />
              <StatusChip
                active={!!draft.hasYellowCard}
                onClick={() => toggle('hasYellowCard')}
                icon={<div style={{ width: 10, height: 10, background: '#eab308', borderRadius: 2, flexShrink: 0 }} />}
                label="Yellow"
                activeColor="#eab308"
                activeBg="rgba(234,179,8,0.12)"
              />
              <StatusChip
                active={!!draft.hasRedCard}
                onClick={() => toggle('hasRedCard')}
                icon={<div style={{ width: 10, height: 10, background: '#ef4444', borderRadius: 2, flexShrink: 0 }} />}
                label="Red Card"
                activeColor="#ef4444"
                activeBg="rgba(239,68,68,0.12)"
              />
            </div>
          </section>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--theme-border)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          flexShrink: 0,
          background: 'var(--theme-panel)',
        }}>
          <button
            type="button"
            onClick={() => setDraft({ ...snapshot })}
            style={{
              padding: '9px 0',
              background: 'transparent',
              border: '1px solid var(--theme-border-btn)',
              borderRadius: 7,
              color: 'var(--theme-secondary-text)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Revert
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="btn-primary"
            style={{
              padding: '9px 0',
              borderRadius: 7,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              border: 'none',
            }}
          >
            Apply
          </button>
        </div>
      </div>
    </>
  );
};

export default PlayerEditorPanel;

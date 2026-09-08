import React from "react";
import { Wand2 } from "lucide-react";
import { useFootballField } from "../../contexts/FootballFieldContext";
import type { MarkerDesign } from "../../contexts/FootballFieldContext";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

export interface LineupOptionsProps {
  title: string;
  onTitleChange: (val: string) => void;
  description: string;
  onDescriptionChange: (val: string) => void;
  formation: string;
  onFormationChange: (val: string) => void;
  onSnapToFormation: (formationName: string) => void;
  onSelectPlayer?: (player: any) => void;
  selectedPlayerId?: number | null;
}

export const FORMATIONS_LIST = ["4-3-3", "4-4-2", "4-2-3-1", "3-5-2", "5-3-2"];

export const FORMATION_PRESETS: Record<string, { x: number; y: number; position: string }[]> = {
  "4-3-3": [
    { x: 5, y: 50, position: "Goalkeeper" },
    { x: 20, y: 85, position: "Defender" },
    { x: 20, y: 65, position: "Defender" },
    { x: 20, y: 35, position: "Defender" },
    { x: 20, y: 15, position: "Defender" },
    { x: 45, y: 65, position: "Midfielder" },
    { x: 45, y: 50, position: "Midfielder" },
    { x: 45, y: 35, position: "Midfielder" },
    { x: 65, y: 80, position: "Forward" },
    { x: 65, y: 50, position: "Forward" },
    { x: 65, y: 20, position: "Forward" },
  ],
  "4-4-2": [
    { x: 5, y: 50, position: "Goalkeeper" },
    { x: 20, y: 85, position: "Defender" },
    { x: 20, y: 65, position: "Defender" },
    { x: 20, y: 35, position: "Defender" },
    { x: 20, y: 15, position: "Defender" },
    { x: 45, y: 85, position: "Midfielder" },
    { x: 45, y: 65, position: "Midfielder" },
    { x: 45, y: 35, position: "Midfielder" },
    { x: 45, y: 15, position: "Midfielder" },
    { x: 68, y: 60, position: "Forward" },
    { x: 68, y: 40, position: "Forward" },
  ],
  "4-2-3-1": [
    { x: 5, y: 50, position: "Goalkeeper" },
    { x: 20, y: 85, position: "Defender" },
    { x: 20, y: 65, position: "Defender" },
    { x: 20, y: 35, position: "Defender" },
    { x: 20, y: 15, position: "Defender" },
    { x: 38, y: 62, position: "Midfielder" },
    { x: 38, y: 38, position: "Midfielder" },
    { x: 60, y: 80, position: "Midfielder" },
    { x: 60, y: 50, position: "Midfielder" },
    { x: 60, y: 20, position: "Midfielder" },
    { x: 76, y: 50, position: "Forward" },
  ],
  "3-5-2": [
    { x: 5, y: 50, position: "Goalkeeper" },
    { x: 20, y: 75, position: "Defender" },
    { x: 20, y: 50, position: "Defender" },
    { x: 20, y: 25, position: "Defender" },
    { x: 45, y: 88, position: "Midfielder" },
    { x: 45, y: 68, position: "Midfielder" },
    { x: 40, y: 50, position: "Midfielder" },
    { x: 45, y: 32, position: "Midfielder" },
    { x: 45, y: 12, position: "Midfielder" },
    { x: 72, y: 60, position: "Forward" },
    { x: 72, y: 40, position: "Forward" },
  ],
  "5-3-2": [
    { x: 5, y: 50, position: "Goalkeeper" },
    { x: 22, y: 88, position: "Defender" },
    { x: 20, y: 70, position: "Defender" },
    { x: 20, y: 50, position: "Defender" },
    { x: 20, y: 30, position: "Defender" },
    { x: 22, y: 12, position: "Defender" },
    { x: 45, y: 70, position: "Midfielder" },
    { x: 45, y: 50, position: "Midfielder" },
    { x: 45, y: 30, position: "Midfielder" },
    { x: 72, y: 60, position: "Forward" },
    { x: 72, y: 40, position: "Forward" },
  ],
};

const OUTFIELD_KITS = [
  { id: 'lime', name: 'Home Lime', bg: '#c6f24e', secondary: '#c6f24e', design: 'solid' as MarkerDesign },
  { id: 'blue', name: 'Royal Blue', bg: '#2563eb', secondary: '#2563eb', design: 'solid' as MarkerDesign },
  { id: 'orange-stripes', name: 'Orange Stripes', bg: '#ea580c', secondary: '#15140f', design: 'stripes' as MarkerDesign },
  { id: 'green-split', name: 'Green Split', bg: '#10b981', secondary: '#064e3b', design: 'vertical-split' as MarkerDesign },
  { id: 'bw-stripes', name: 'Ref Stripes', bg: '#111827', secondary: '#ffffff', design: 'stripes' as MarkerDesign },
  { id: 'red', name: 'Striker Red', bg: '#ef4444', secondary: '#ef4444', design: 'solid' as MarkerDesign },
];

const KEEPER_KITS = [
  { id: 'keeper-lime', name: 'Keeper Lime', bg: '#c6f24e', secondary: '#c6f24e', design: 'solid' as MarkerDesign },
  { id: 'keeper-blue', name: 'Keeper Blue', bg: '#2563eb', secondary: '#2563eb', design: 'solid' as MarkerDesign },
  { id: 'keeper-orange', name: 'Keeper Orange', bg: '#ea580c', secondary: '#ea580c', design: 'solid' as MarkerDesign },
  { id: 'keeper-green', name: 'Keeper Green', bg: '#10b981', secondary: '#10b981', design: 'solid' as MarkerDesign },
  { id: 'keeper-bw', name: 'Keeper Dark', bg: '#111827', secondary: '#ffffff', design: 'stripes' as MarkerDesign },
  { id: 'keeper-pink', name: 'Keeper Pink', bg: '#ff6fae', secondary: '#ff6fae', design: 'solid' as MarkerDesign },
];

const LineupOptions: React.FC<LineupOptionsProps> = ({
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  formation,
  onFormationChange,
  onSnapToFormation,
  onSelectPlayer,
  selectedPlayerId,
}) => {
  const { players, setPlayers, options, setOptions, actions } = useFootballField();

  const getPlayerRole = (player: any, index: number): string => {
    if (player.position && player.position.length > 2) return player.position;
    if (player.number === 1 || index === 0) return "Goalkeeper";
    if (index >= 1 && index <= 4) return "Defender";
    if (index >= 5 && index <= 7) return "Midfielder";
    return "Forward";
  };

  const handleSelectOutfieldKit = (kit: typeof OUTFIELD_KITS[0]) => {
    setOptions(prev => ({
      ...prev,
      markerBgColor: kit.bg,
      markerSecondaryColor: kit.secondary,
      markerDesign: kit.design,
    }));
  };

  const handleSelectKeeperKit = (kit: typeof KEEPER_KITS[0]) => {
    // Apply keeper kit styling or primary color
    setOptions(prev => ({
      ...prev,
      markerBorderColor: kit.bg,
    }));
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* 01 LINEUP DETAILS */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: "var(--surface-container)",
          border: "var(--border-w) solid var(--ink)",
          boxShadow: "var(--card-shadow)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-black tracking-widest uppercase flex items-center gap-2" style={{ color: "var(--on-surface-variant)" }}>
            <span style={{ color: "var(--primary)", fontFamily: "var(--font-display)" }}>01</span>
            LINEUP DETAILS
          </h3>
          <span
            className="px-2.5 py-0.5 rounded-full text-xs font-extrabold"
            style={{
              background: "var(--primary)",
              color: "var(--ink)",
              border: "var(--border-w) solid var(--ink)",
              boxShadow: "var(--shadow-sm)",
              fontFamily: "var(--font-display)",
            }}
          >
            {formation || "4-3-3"}
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider block mb-1.5" style={{ color: "var(--outline)" }}>
              TITLE
            </label>
            <Input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Matchday XI — Press high, trap late"
              className="w-full"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider block mb-1.5" style={{ color: "var(--outline)" }}>
              DESCRIPTION
            </label>
            <Textarea
              rows={3}
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Notes on the shape, pressing triggers, build-up patterns..."
              className="w-full text-sm"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider block mb-2" style={{ color: "var(--outline)" }}>
              FORMATION
            </label>
            <div className="flex items-center gap-2 flex-wrap mb-3">
              {FORMATIONS_LIST.map((f) => {
                const isSelected = formation === f;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => {
                      onFormationChange(f);
                      onSnapToFormation(f);
                    }}
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 12,
                      fontWeight: 800,
                      padding: "6px 14px",
                      borderRadius: 12,
                      cursor: "pointer",
                      background: isSelected ? "var(--primary)" : "var(--surface-high)",
                      color: isSelected ? "var(--ink)" : "var(--on-surface)",
                      border: "var(--border-w) solid var(--ink)",
                      boxShadow: isSelected ? "var(--card-shadow)" : "none",
                      transition: "all 0.12s ease",
                    }}
                  >
                    {f}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => onSnapToFormation(formation || "4-3-3")}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all"
              style={{
                background: "var(--surface-high)",
                color: "var(--on-surface)",
                border: "var(--border-w) solid var(--ink)",
                boxShadow: "var(--card-shadow)",
                fontFamily: "var(--font-display)",
                cursor: "pointer",
              }}
            >
              <Wand2 size={14} />
              SNAP TO FORMATION
            </button>
          </div>
        </div>
      </div>

      {/* 02 KIT PICKER */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: "var(--surface-container)",
          border: "var(--border-w) solid var(--ink)",
          boxShadow: "var(--card-shadow)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-black tracking-widest uppercase flex items-center gap-2" style={{ color: "var(--on-surface-variant)" }}>
            <span style={{ color: "var(--primary)", fontFamily: "var(--font-display)" }}>02</span>
            KIT PICKER
          </h3>
          <span
            className="px-2.5 py-0.5 rounded-full text-xs font-extrabold"
            style={{
              background: "var(--primary)",
              color: "var(--ink)",
              border: "var(--border-w) solid var(--ink)",
              boxShadow: "var(--shadow-sm)",
              fontFamily: "var(--font-display)",
            }}
          >
            HOME LIME
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider block mb-2" style={{ color: "var(--outline)" }}>
              OUTFIELD
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {OUTFIELD_KITS.map((kit) => {
                const active = options.markerBgColor === kit.bg;
                return (
                  <button
                    key={kit.id}
                    type="button"
                    title={kit.name}
                    onClick={() => handleSelectOutfieldKit(kit)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 9,
                      background: kit.design === 'stripes'
                        ? `repeating-linear-gradient(90deg, ${kit.bg} 0px, ${kit.bg} 5px, ${kit.secondary} 5px, ${kit.secondary} 10px)`
                        : kit.design === 'vertical-split'
                        ? `linear-gradient(90deg, ${kit.bg} 50%, ${kit.secondary} 50%)`
                        : kit.bg,
                      border: active ? "2.5px solid var(--primary)" : "var(--border-w) solid var(--ink)",
                      boxShadow: active ? "0 0 0 2px var(--ink)" : "var(--shadow-sm)",
                      cursor: "pointer",
                      transition: "transform 0.1s ease",
                    }}
                  />
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider block mb-2" style={{ color: "var(--outline)" }}>
              KEEPER
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {KEEPER_KITS.map((kit) => {
                const active = options.markerBorderColor === kit.bg;
                return (
                  <button
                    key={kit.id}
                    type="button"
                    title={kit.name}
                    onClick={() => handleSelectKeeperKit(kit)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 9,
                      background: kit.bg,
                      border: active ? "2.5px solid var(--primary)" : "var(--border-w) solid var(--ink)",
                      boxShadow: active ? "0 0 0 2px var(--ink)" : "var(--shadow-sm)",
                      cursor: "pointer",
                      transition: "transform 0.1s ease",
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 03 SQUAD */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: "var(--surface-container)",
          border: "var(--border-w) solid var(--ink)",
          boxShadow: "var(--card-shadow)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-black tracking-widest uppercase flex items-center gap-2" style={{ color: "var(--on-surface-variant)" }}>
            <span style={{ color: "var(--primary)", fontFamily: "var(--font-display)" }}>03</span>
            SQUAD
          </h3>
          <span
            className="px-2.5 py-0.5 rounded-full text-xs font-extrabold"
            style={{
              background: "var(--primary)",
              color: "var(--ink)",
              border: "var(--border-w) solid var(--ink)",
              boxShadow: "var(--shadow-sm)",
              fontFamily: "var(--font-display)",
            }}
          >
            {players.length || 11} PLAYERS
          </span>
        </div>

        <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
          {players.map((player, idx) => {
            const isSelected = selectedPlayerId === player.id;
            const roleName = getPlayerRole(player, idx);

            return (
              <div
                key={player.id}
                onClick={() => onSelectPlayer && onSelectPlayer(player)}
                className="flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all hover:translate-x-0.5"
                style={{
                  background: isSelected ? "var(--surface-high)" : "var(--surface-low)",
                  border: isSelected ? "1.5px solid var(--primary)" : "var(--border-w) solid var(--ink)",
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-xs flex-shrink-0"
                    style={{
                      background: "var(--primary)",
                      color: "var(--ink)",
                      border: "var(--border-w) solid var(--ink)",
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    {player.number}
                  </span>
                  <input
                    type="text"
                    value={player.name || `Player ${player.number}`}
                    onChange={(e) => {
                      if (actions.onPlayerNameChange) {
                        actions.onPlayerNameChange(player.id, e.target.value);
                      } else {
                        setPlayers((prev) =>
                          prev.map((p) => (p.id === player.id ? { ...p, name: e.target.value } : p))
                        );
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-transparent text-xs font-bold border-none outline-none focus:bg-[var(--surface-container)] px-1.5 py-0.5 rounded truncate"
                    style={{ color: "var(--on-surface)", width: 140 }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-right" style={{ color: "var(--on-surface-variant)" }}>
                  {roleName}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LineupOptions;


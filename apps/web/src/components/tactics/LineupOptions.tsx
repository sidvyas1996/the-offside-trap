import React from "react";
import { Wand2 } from "lucide-react";
import { useFootballField } from "../../contexts/FootballFieldContext";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { KitGrid } from "./KitPicker";
import { KITS } from "../../data/kits";

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
  /** Marker style in force, so the kit picker knows whether a kit would show. */
  markerType: 'circle' | 'shirt';
  /** Switch the board over to shirt markers so a chosen kit is visible. */
  onUseShirtMarkers: () => void;
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
  markerType,
  onUseShirtMarkers,
}) => {
  const { players, setPlayers, options, setOptions, actions } = useFootballField();

  const getPlayerRole = (player: any, index: number): string => {
    if (player.position && player.position.length > 2) return player.position;
    if (player.number === 1 || index === 0) return "Goalkeeper";
    if (index >= 1 && index <= 4) return "Defender";
    if (index >= 5 && index <= 7) return "Midfielder";
    return "Forward";
  };

  // A kit is artwork on a shirt marker, so a circle has nowhere to wear it —
  // picking one turns the markers into shirts rather than doing nothing.
  const handleSelectKit = (kitId: string) => {
    setOptions(prev => ({ ...prev, shirtKitId: kitId }));
    if (markerType !== 'shirt') onUseShirtMarkers();
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
          <h3 className="panel-num-title">
            <span className="num">01</span>
            Lineup details
          </h3>
          <span className="chip-mono">{formation || "4-3-3"}</span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="field-label" style={{ fontSize: 10, letterSpacing: "0.1em" }}>
              Title
            </label>
            <Input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Matchday XI — Press high, trap late"
              className="w-full"
            />
          </div>

          <div>
            <label className="field-label" style={{ fontSize: 10, letterSpacing: "0.1em" }}>
              Description
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
            <label className="field-label" style={{ fontSize: 10, letterSpacing: "0.1em", marginBottom: 8 }}>
              Formation
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
              Snap to formation
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
          <h3 className="panel-num-title">
            <span className="num">02</span>
            Kit picker
          </h3>
          <span className="chip-count">
            {KITS.find(k => k.id === options.shirtKitId)?.name ?? "No kit"}
          </span>
        </div>

        <KitGrid value={options.shirtKitId} onChange={handleSelectKit} />
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
          <h3 className="panel-num-title">
            <span className="num">03</span>
            Squad
          </h3>
          <span className="chip-count">{players.length || 11} players</span>
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
                  boxShadow: isSelected ? "var(--card-shadow)" : "none",
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
                <span
                  className="text-[11px] font-semibold text-right"
                  style={{ color: isSelected ? "var(--outline)" : "var(--on-surface-variant)", fontFamily: "var(--font-display)" }}
                >
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


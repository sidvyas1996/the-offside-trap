
import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, Eye, Play, Users } from "lucide-react";
import { motion } from "framer-motion";

import MiniTacticCard from "./MiniTacticCard.tsx";
import type {TacticSummary} from "../../../../packages/shared";

interface TacticCardProps {
    tactic: TacticSummary;
}

export const TacticCard: React.FC<TacticCardProps> = ({ tactic }) => {
    const formattedDate = new Date(tactic.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });

    // Handle comments count whether it's an array or number
    const getCommentsCount = (): number => {
        if (!tactic.stats.comments) return 0;
        return tactic.stats.comments;
    };

    const [hovered, setHovered] = useState(false);
    const progressRef = useRef<HTMLDivElement>(null);
    const kind = tactic.preview?.kind;

    return (
        <motion.div
            className="tactic-card"
            whileHover={{ y: -4, background: "var(--surface-high)" }}
            style={{ background: "var(--surface-container)", borderRadius: 14, overflow: "hidden", transition: "all 0.2s" }}
        >
            <Link
                to={`/tactics/${tactic.id}`}
                onPointerEnter={() => setHovered(true)}
                onPointerLeave={() => setHovered(false)}
                onFocus={() => setHovered(true)}
                onBlur={() => setHovered(false)}
            >
                <div className="aspect-video relative overflow-hidden">
                    {tactic.image_url ? (
                        <img
                            src={tactic.image_url}
                            alt={tactic.title || "Tactic"}
                            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                        />
                    ) : (
                        <MiniTacticCard
                            className="h-full"
                            preview={tactic.preview}
                            playing={hovered}
                            // Written straight to the bar rather than through state: it
                            // changes every frame, and only this one div cares.
                            onProgress={p => {
                                if (progressRef.current) progressRef.current.style.transform = `scaleX(${p})`;
                            }}
                        />
                    )}

                    {/* Lineup or animated tactic: the one thing a card can't show at rest. */}
                    {kind && (
                        <span
                            className="absolute flex items-center gap-1"
                            style={{
                                top: 10, left: 10,
                                padding: "3px 9px 3px 7px",
                                borderRadius: 99,
                                border: "var(--border-w) solid var(--ink)",
                                boxShadow: "var(--shadow-sm)",
                                background: kind === "animated" ? "var(--primary)" : "var(--surface-high)",
                                color: kind === "animated" ? "var(--on-primary)" : "var(--on-surface)",
                                fontFamily: "var(--font-display)",
                                fontSize: 10,
                                fontWeight: 800,
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                            }}
                        >
                            {kind === "animated"
                                ? <><Play size={10} fill="currentColor" /> Animated</>
                                : <><Users size={11} /> Lineup</>}
                        </span>
                    )}

                    {/* Animated only: fills along with the hover replay. */}
                    {kind === "animated" && !tactic.image_url && (
                        <div
                            ref={progressRef}
                            aria-hidden
                            className="absolute left-0 right-0 bottom-0"
                            style={{
                                height: 3,
                                zIndex: 2,
                                background: "var(--primary)",
                                transform: "scaleX(0)",
                                transformOrigin: "left",
                            }}
                        />
                    )}
                    <div
                        className="absolute bottom-0 left-0 right-0 px-4 py-3"
                        style={{ background: "linear-gradient(to top, rgba(15,13,21,0.85), transparent)" }}
                    >
                        <p className="font-bold truncate" style={{ color: "var(--on-surface)" }}>{tactic.title || "Untitled Tactic"}</p>
                        {tactic.formation && (
                            <p className="text-sm" style={{ color: "var(--outline)", fontFamily: "var(--font-display)", fontWeight: 700 }}>{tactic.formation}</p>
                        )}
                    </div>
                </div>
            </Link>

            <div className="p-4">
                <div className="flex flex-wrap gap-2 mb-4">
                    {tactic.tags?.slice(0, 3).map((tag: string, index: number) => (
                        <span
                            key={index}
                            style={{
                                background: "var(--surface-high)",
                                color: "var(--on-surface-variant)",
                                fontSize: 10,
                                fontWeight: 600,
                                padding: "3px 10px",
                                borderRadius: 99,
                                letterSpacing: "0.04em",
                            }}
                        >
                            {tag}
                        </span>
                    ))}
                </div>

                <div className="flex items-center justify-between text-sm" style={{ color: "var(--on-surface-variant)" }}>
                    <div className="flex items-center gap-4">
                        <div className="stat-item stat-likes">
                            <Heart className="stat-icon" />
                            <span>{tactic.stats.likes || 0}</span>
                        </div>
                        <div className="stat-item">
                            <MessageCircle className="stat-icon" />
                            <span>{getCommentsCount()}</span>
                        </div>
                    </div>
                    <div className="stat-item">
                        <Eye className="stat-icon" />
                        <span>Created {formattedDate}</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
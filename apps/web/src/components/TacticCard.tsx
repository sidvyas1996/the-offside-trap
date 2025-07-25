
import React from "react";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, Eye } from "lucide-react";
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

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="tactic-card"
        >
            <Link to={`/tactics/${tactic.id}`}>
                <div className="aspect-video relative overflow-hidden">
                    {tactic.image_url ? (
                        <img
                            src={tactic.image_url}
                            alt={tactic.title || "Tactic"}
                            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                        />
                    ) : (
                        <MiniTacticCard className="h-full" />
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-3">
                        <p className="font-bold truncate text-white">{tactic.title || "Untitled Tactic"}</p>
                        {tactic.formation && (
                            <p className="text-sm text-gray-300">{tactic.formation}</p>
                        )}
                    </div>
                </div>
            </Link>

            <div className="p-4">
                <div className="flex flex-wrap gap-2 mb-4">
                    {tactic.tags?.slice(0, 3).map((tag: string, index: number) => (
                        <span
                            key={index}
                            className="tag-badge"
                        >
                            {tag}
                        </span>
                    ))}
                </div>

                <div className="flex items-center justify-between text-sm">
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
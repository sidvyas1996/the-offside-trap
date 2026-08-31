import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MessageCircle, Loader2, Play, Pause, Film, ChevronLeft } from "lucide-react";
import { TacticEntity } from "../entities/TacticEntity";
import type { Tactic, Comment, AnimationData } from "../../../../packages/shared";
import FootballField from "../components/FootballField.tsx";
import { renderBackButton } from "../components/ui/back-button.tsx";
import { Textarea } from "../components/ui/textarea.tsx";
import {
  FootballFieldProvider,
  useFootballField,
} from "../contexts/FootballFieldContext.tsx";
import { useAnimation } from "../hooks/useAnimation.ts";
import { useIsMobile } from "../hooks/useMediaQuery.ts";

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const dec = Math.floor((ms % 1000) / 100);
  return `${s}.${dec}s`;
}

interface AnimationPlayerProps {
  currentTimeMs: number;
  durationMs: number;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (timeMs: number) => void;
}

const AnimationPlayer: React.FC<AnimationPlayerProps> = ({
  currentTimeMs,
  durationMs,
  isPlaying,
  onPlay,
  onPause,
  onSeek,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);

  const posToTime = (clientX: number): number => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(ratio * durationMs);
  };

  const cursorPct = (currentTimeMs / durationMs) * 100;

  return (
    <div style={{
      margin: "12px 0 0",
      background: "var(--surface-high)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 12,
      padding: "14px 16px",
      display: "flex",
      flexDirection: "column",
      gap: 10,
    }}>
      {/* Header + controls row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Film size={14} style={{ color: "var(--primary)", flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--on-surface-variant)" }}>
          Animation
        </span>

        {/* Play / Pause */}
        <button
          onClick={isPlaying ? onPause : onPlay}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "var(--primary)", color: "var(--on-primary)",
            border: "none", borderRadius: 6, padding: "5px 12px",
            fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}
        >
          {isPlaying ? <Pause size={12} /> : <Play size={12} />}
          {isPlaying ? "Pause" : "Play"}
        </button>

        {/* Time display */}
        <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--on-surface-variant)", marginLeft: 2 }}>
          {formatTime(currentTimeMs)} / {formatTime(durationMs)}
        </span>

      </div>

      {/* Scrubber */}
      <div
        ref={trackRef}
        onClick={e => onSeek(posToTime(e.clientX))}
        style={{
          position: "relative",
          height: 28,
          background: "rgba(255,255,255,0.05)",
          borderRadius: 6,
          cursor: "pointer",
          userSelect: "none",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Progress fill */}
        <div style={{
          position: "absolute", top: 0, left: 0, height: "100%",
          width: `${cursorPct}%`,
          background: "var(--primary)",
          opacity: 0.2,
          borderRadius: 6,
          pointerEvents: "none",
        }} />


        {/* Playhead */}
        <div style={{
          position: "absolute", top: 0, left: `${cursorPct}%`,
          width: 2, height: "100%",
          background: "var(--primary)",
          pointerEvents: "none",
          zIndex: 10,
        }}>
          <div style={{
            position: "absolute", top: -3, left: "50%",
            transform: "translateX(-50%) rotate(45deg)",
            width: 8, height: 8,
            background: "var(--primary)",
          }} />
        </div>
      </div>
    </div>
  );
};


const TacticsDetailsContent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tactic data
  const [tactic, setTactic] = useState<Tactic | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // FootballField context
  const {
    setPlayers,
    setOptions,
    setActions,
    setDraggedPlayer,
    setBall,
    setIsAnimating,
  } = useFootballField();

  // Phone-width viewports get the portrait board: a 16:9 pitch letterboxed into
  // a phone's width is a strip barely tall enough to tell the markers apart.
  const isMobile = useIsMobile();
  const animation = useAnimation({
    onFrame: (framePlayers, frameFieldSettings) => {
      setPlayers(framePlayers);
      if (frameFieldSettings.ball) setBall(frameFieldSettings.ball);
      setOptions(prev => ({
        ...prev,
        fieldColor: frameFieldSettings.fieldColor,
        playerColor: frameFieldSettings.playerColor,
        showPlayerLabels: frameFieldSettings.showPlayerLabels,
        markerType: frameFieldSettings.markerType,
      }));
    },
  });

  // Markers drop their positional CSS transition while the rAF loop drives them
  useEffect(() => {
    setIsAnimating(animation.isPlaying);
  }, [animation.isPlaying, setIsAnimating]);

  // Disable movement completely for details page
  useEffect(() => {
    setActions({
      onPointerDown: () => {},
      onPointerMove: () => {},
      onPointerUp: () => {},
    });
    setOptions((prev) => ({
      ...prev,
      size: "default",
      editable: false,
      enableContextMenu: false,
    }));
    setDraggedPlayer(null);
  }, [setActions, setOptions, setDraggedPlayer]);

  // Seek without playing — update display frame when scrubbing
  const handleSeek = useCallback((timeMs: number) => {
    animation.pause();
    animation.seekTo(timeMs);
    const frame = animation.getInterpolatedFrame(timeMs);
    if (frame) {
      setPlayers(frame.players);
      if (frame.fieldSettings.ball) setBall(frame.fieldSettings.ball);
      setOptions(prev => ({
        ...prev,
        fieldColor: frame.fieldSettings.fieldColor,
        playerColor: frame.fieldSettings.playerColor,
        showPlayerLabels: frame.fieldSettings.showPlayerLabels,
        markerType: frame.fieldSettings.markerType,
      }));
    }
  }, [animation, setPlayers, setOptions, setBall]);

  // Fetch tactic data on mount
  useEffect(() => {
    if (id) {
      fetchTacticDetails();
      fetchComments();
    }
    // eslint-disable-next-line
  }, [id]);

  const fetchTacticDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await TacticEntity.getById(id!);
      setTactic(data);
      setPlayers(data.players || []);
      if (data.animation && (data.animation as AnimationData).keyframes?.length > 0) {
        animation.loadAnimation(data.animation as AnimationData);
      }
      if (data.fieldSettings) {
        setOptions(prev => ({
          ...prev,
          fieldColor: (data.fieldSettings as any)?.fieldColor || prev.fieldColor,
          playerColor: (data.fieldSettings as any)?.playerColor || prev.playerColor,
          showPlayerLabels: (data.fieldSettings as any)?.showPlayerLabels ?? prev.showPlayerLabels,
          markerType: (data.fieldSettings as any)?.markerType || prev.markerType,
        }));
        if ((data.fieldSettings as any)?.ball) setBall((data.fieldSettings as any).ball);
      }
    } catch (err) {
      console.error("Error fetching tactic:", err);
      setError(err instanceof Error ? err.message : "Failed to load tactic");
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const commentsData = await TacticEntity.getComments(id!);
      setComments(commentsData);
    } catch (err) {
      console.error("Error fetching comments:", err);
    }
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim() || isSubmittingComment) return;
    setIsSubmittingComment(true);
    try {
      const comment = await TacticEntity.addComment(id!, newComment);
      setComments([comment, ...comments]);
      setNewComment("");
    } catch (err) {
      console.error("Error posting comment:", err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--surface)", color: "var(--on-surface)" }}>
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !tactic) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--surface)", color: "var(--on-surface)" }}>
        <div className="text-center">
          <p className="text-xl text-red-500 mb-4">
            {error || "Tactic not found"}
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--surface)", color: "var(--on-surface)" }}>
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row">
          {/* Left Content - Football Field */}
          <div className="flex-1 lg:pr-8 min-w-0">
            {/* On a phone this reads as the studio header does: a bordered back
                chip, a kicker, and the document title — so moving between the
                two screens does not feel like moving between two apps. */}
            <div className="flex items-center gap-3 lg:gap-4 mb-5 lg:mb-8">
              {isMobile ? (
                <button
                  onClick={() => navigate(-1)}
                  aria-label="Back"
                  style={{
                    width: 38, height: 38, borderRadius: 11, flexShrink: 0, cursor: 'pointer',
                    background: 'var(--surface-container)',
                    border: 'var(--border-w) solid var(--ink)',
                    boxShadow: 'var(--card-shadow)',
                    color: 'var(--on-surface)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <ChevronLeft size={18} strokeWidth={2.5} />
                </button>
              ) : (
                renderBackButton(() => navigate(-1))
              )}
              <div style={{ minWidth: 0 }}>
                {isMobile && (
                  <div className="kicker" style={{ marginBottom: 1 }}>Tactic</div>
                )}
                <h1
                  className={`font-bold min-w-0 break-words${isMobile ? '' : ' text-5xl'}`}
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: isMobile ? 16 : undefined,
                    letterSpacing: isMobile ? '-0.02em' : undefined,
                  }}
                >
                  {tactic.title}
                </h1>
              </div>
            </div>
            <FootballField portrait={isMobile} />

            {/* Animation Player — only shown if tactic has animation */}
            {animation.keyframes.length > 0 && (
              <AnimationPlayer
                currentTimeMs={animation.currentTimeMs}
                durationMs={animation.durationMs}
                isPlaying={animation.isPlaying}
                onPlay={animation.play}
                onPause={animation.pause}
                onSeek={handleSeek}
              />
            )}

            {/* Formation & Tags */}
            <div className="flex flex-wrap px-0 lg:px-10 gap-3 mb-6 mt-6">
              <span className="px-4 py-2 rounded-full text-sm font-medium" style={{ background: "var(--surface-container)", border: "var(--border-w) solid var(--ink)", color: "var(--on-surface)" }}>
                {tactic.formation}
              </span>
              {tactic.tags?.map((tag, index) => (
                <span
                  key={index}
                  className="px-4 py-2 rounded-full text-sm cursor-pointer transition-colors" style={{ background: "var(--surface-container)", border: "var(--border-w) solid var(--ink)", color: "var(--on-surface)" }}
                >
                  {tag}
                </span>
              ))}
            </div>
            {/* Description */}
            <div className="mb-12 px-10">
              <h3 className="text-2xl font-bold mb-4">Description</h3>
              <div className="leading-relaxed" style={{ color: "var(--on-surface-variant)" }}>
                {tactic.description}
              </div>
            </div>
            {/* Comments Section */}
            <div>
              <h3 className="text-2xl px-10 font-bold mb-6">Comments</h3>
              {/* Add Comment */}
              <div className="flex gap-4 mb-6 px-10">
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0" style={{ background: "var(--grass-green)", color: "#fff", border: "var(--border-w) solid var(--ink)" }}>
                  U
                </div>
                <div className="flex-1 flex flex-col gap-3">
                  <Textarea
                    rows={4}
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    disabled={isSubmittingComment}
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleCommentSubmit}
                      disabled={!newComment.trim() || isSubmittingComment}
                      className="flex items-center gap-2 px-6 py-2 rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: "var(--primary)", color: "var(--on-primary)", border: "var(--border-w) solid var(--ink)" }}
                    >
                      {isSubmittingComment ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MessageCircle className="h-4 w-4" />
                      )}
                      Post Comment
                    </button>
                  </div>
                </div>
              </div>
              {/* Comments List */}
              {comments.length === 0 ? (
                <p className="text-center py-8" style={{ color: "var(--outline)" }}>
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-4 mb-4 px-10">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-md flex-shrink-0" style={{ background: "var(--surface-high)", color: "var(--on-surface)", border: "var(--border-w) solid var(--ink)" }}>
                      {comment.user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 rounded-xl p-4 flex flex-col gap-2" style={{ border: "var(--border-w) solid var(--ink)", background: "var(--surface-container)" }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">
                          {comment.user.username}
                        </span>
                        <span className="text-sm" style={{ color: "var(--outline)" }}>
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p style={{ color: "var(--on-surface-variant)" }}>{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          {/* Right Sidebar */}
          <div className="w-full lg:w-80 mt-8 lg:mt-20">
            <div className="rounded-xl p-6" style={{ background: "var(--surface-container)", border: "var(--border-w) solid var(--ink)", boxShadow: "var(--card-shadow)" }}>
              <h3 className="text-xl font-bold mb-6">About the Creator</h3>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg" style={{ background: "var(--grass-green)", color: "#fff", border: "var(--border-w) solid var(--ink)" }}>
                  {tactic.author.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-lg" style={{ color: "var(--on-surface)" }}>
                    {tactic.author.username}
                  </p>
                  <p className="text-sm" style={{ color: "var(--outline)" }}>
                    Created on {formatDate(tactic.createdAt)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate("/create")}
                className="w-full py-3 rounded-xl transition-colors font-medium" style={{ background: "var(--primary)", color: "var(--on-primary)", border: "var(--border-w) solid var(--ink)" }}
              >
                Create Your Own Tactic
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TacticsDetails: React.FC = () => (
  <FootballFieldProvider>
    <TacticsDetailsContent />
  </FootballFieldProvider>
);

export default TacticsDetails;

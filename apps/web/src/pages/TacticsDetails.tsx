import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MessageCircle, Loader2, Play, Pause, Film, ChevronLeft, Heart, Eye, Pencil } from "lucide-react";
import { TacticEntity } from "../entities/TacticEntity";
import type { Tactic, Comment, AnimationData, TacticStats } from "../../../../packages/shared";
import FootballField from "../components/FootballField.tsx";
import TopNav from "../components/TopNav.tsx";
import { renderBackButton } from "../components/ui/back-button.tsx";
import { Textarea } from "../components/ui/textarea.tsx";
import {
  FootballFieldProvider,
  useFootballField,
} from "../contexts/FootballFieldContext.tsx";
import { useAnimation } from "../hooks/useAnimation.ts";
import LoopToggle from "../components/tactics/LoopToggle.tsx";
import { useIsMobile } from "../hooks/useMediaQuery.ts";
import { useAuth } from "../contexts/AuthContext.tsx";

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
  loop: boolean;
  onSetLoop: (loop: boolean) => void;
  loopDelayRemainingMs: number;
  compact?: boolean;
}

const AnimationPlayer: React.FC<AnimationPlayerProps> = ({
  currentTimeMs,
  durationMs,
  isPlaying,
  onPlay,
  onPause,
  onSeek,
  loop,
  onSetLoop,
  loopDelayRemainingMs,
  compact = false,
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
      margin: "24px auto 0",
      maxWidth: 900,
      background: "var(--surface-high)",
      border: "var(--border-w) solid var(--ink)",
      boxShadow: "var(--card-shadow)",
      borderRadius: 12,
      padding: "14px 16px",
      display: "flex",
      flexDirection: "column",
      gap: 10,
    }}>
      {/* Header + controls row — the label gives way on phones so the controls fit on one line. */}
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: compact ? 10 : 12 }}>
        {!compact && (
          <>
            <Film size={14} style={{ color: "var(--primary)", flexShrink: 0 }} />
            <span style={{ fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--on-surface-variant)" }}>
              Animation
            </span>
          </>
        )}

        {/* Play / Pause */}
        <button
          onClick={isPlaying ? onPause : onPlay}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "var(--primary)", color: "var(--on-primary)",
            border: "var(--border-w) solid var(--ink)", borderRadius: 8, padding: "5px 12px",
            fontFamily: "var(--font-display)", fontSize: 12, fontWeight: 800, cursor: "pointer",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {isPlaying ? <Pause size={12} /> : <Play size={12} />}
          {isPlaying ? "Pause" : "Play"}
        </button>

        {/* Time display */}
        <span style={{ fontSize: 11, fontFamily: "var(--font-display)", color: "var(--on-surface-variant)", marginLeft: 2 }}>
          {formatTime(currentTimeMs)} / {formatTime(durationMs)}
        </span>

        <div style={{ marginLeft: "auto" }}>
          <LoopToggle loop={loop} onChange={onSetLoop} delayRemainingMs={loopDelayRemainingMs} />
        </div>

      </div>

      {/* Scrubber */}
      <div
        ref={trackRef}
        onClick={e => onSeek(posToTime(e.clientX))}
        style={{
          position: "relative",
          height: 28,
          background: "var(--surface-low)",
          borderRadius: 6,
          cursor: "pointer",
          userSelect: "none",
          border: "var(--border-w) solid var(--ink)",
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
            border: "var(--border-w) solid var(--ink)",
          }} />
        </div>
      </div>
    </div>
  );
};


const TacticsDetailsContent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

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
    setOppositionPlayers,
    setOppositionOptions,
    setOppositionActions,
    setShowOpposition,
  } = useFootballField();

  // Phone-width viewports get the portrait board: a 16:9 pitch letterboxed into
  // a phone's width is a strip barely tall enough to tell the markers apart.
  const isMobile = useIsMobile();
  const animation = useAnimation({
    onFrame: (framePlayers, frameFieldSettings, frameOppositionPlayers) => {
      setPlayers(framePlayers);
      if (frameOppositionPlayers) setOppositionPlayers(frameOppositionPlayers);
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
    // The opposition is read-only here too.
    setOppositionActions({});
    setOppositionOptions((prev) => ({ ...prev, editable: false, enableContextMenu: false }));
    setDraggedPlayer(null);
  }, [setActions, setOptions, setDraggedPlayer, setOppositionActions, setOppositionOptions]);

  // Seek without playing — update display frame when scrubbing
  const handleSeek = useCallback((timeMs: number) => {
    animation.pause();
    animation.seekTo(timeMs);
    const frame = animation.getInterpolatedFrame(timeMs);
    if (frame) {
      setPlayers(frame.players);
      if (frame.oppositionPlayers) setOppositionPlayers(frame.oppositionPlayers);
      if (frame.fieldSettings.ball) setBall(frame.fieldSettings.ball);
      setOptions(prev => ({
        ...prev,
        fieldColor: frame.fieldSettings.fieldColor,
        playerColor: frame.fieldSettings.playerColor,
        showPlayerLabels: frame.fieldSettings.showPlayerLabels,
        markerType: frame.fieldSettings.markerType,
      }));
    }
  }, [animation, setPlayers, setOptions, setBall, setOppositionPlayers]);

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
        animation.setLoop((data.animation as AnimationData).loop !== false);
      }
      if (data.fieldSettings) {
        const hfs = data.fieldSettings;
        setOptions(prev => ({
          ...prev,
          fieldColor: (data.fieldSettings as any)?.fieldColor || prev.fieldColor,
          playerColor: (data.fieldSettings as any)?.playerColor || prev.playerColor,
          showPlayerLabels: (data.fieldSettings as any)?.showPlayerLabels ?? prev.showPlayerLabels,
          markerType: (data.fieldSettings as any)?.markerType || prev.markerType,
          // The kit and marker dressing, as the studio saved them — without these
          // a shirt team fell back to the plain grey sprite here.
          ...(hfs.markerBgColor && { markerBgColor: hfs.markerBgColor }),
          ...(hfs.markerBorderColor && { markerBorderColor: hfs.markerBorderColor }),
          ...(hfs.markerTextColor && { markerTextColor: hfs.markerTextColor }),
          ...(hfs.markerSecondaryColor && { markerSecondaryColor: hfs.markerSecondaryColor }),
          ...(hfs.markerDesign && { markerDesign: hfs.markerDesign }),
          ...(hfs.shirtKitId && { shirtKitId: hfs.shirtKitId }),
          ...(hfs.showShirtNumbers !== undefined && { showShirtNumbers: hfs.showShirtNumbers }),
        }));
        if ((data.fieldSettings as any)?.ball) setBall((data.fieldSettings as any).ball);
      }
      // The opposition, as the studio saved it: players plus their own kit.
      const hasOpposition = !!data.oppositionPlayers && data.oppositionPlayers.length > 0;
      setOppositionPlayers(hasOpposition ? data.oppositionPlayers! : []);
      setShowOpposition(hasOpposition);
      const ofs = data.oppositionFieldSettings;
      if (ofs) {
        setOppositionOptions(prev => ({
          ...prev,
          showPlayerLabels: ofs.showPlayerLabels ?? prev.showPlayerLabels,
          markerType: ofs.markerType || prev.markerType,
          ...(ofs.markerBgColor && { markerBgColor: ofs.markerBgColor }),
          ...(ofs.markerBorderColor && { markerBorderColor: ofs.markerBorderColor }),
          ...(ofs.markerTextColor && { markerTextColor: ofs.markerTextColor }),
          ...(ofs.markerSecondaryColor && { markerSecondaryColor: ofs.markerSecondaryColor }),
          ...(ofs.markerDesign && { markerDesign: ofs.markerDesign }),
          ...(ofs.shirtKitId && { shirtKitId: ofs.shirtKitId }),
          ...(ofs.showShirtNumbers !== undefined && { showShirtNumbers: ofs.showShirtNumbers }),
        }));
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
      <div className="dot-bg min-h-screen flex items-center justify-center" style={{ color: "var(--on-surface)" }}>
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !tactic) {
    return (
      <div className="dot-bg min-h-screen flex items-center justify-center" style={{ color: "var(--on-surface)", padding: 24 }}>
        <div className="empty-state" style={{ maxWidth: 420, width: "100%" }}>
          <div className="kicker" style={{ marginBottom: 8 }}>Tactic</div>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, color: "var(--on-surface)", margin: "0 0 20px" }}>
            {error || "Tactic not found"}
          </p>
          <button onClick={() => navigate("/")} className="btn-primary">
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  // The detail endpoint returns stats alongside the tactic, but the shared
  // `Tactic` type predates that — read them optionally rather than widening the type.
  const stats = (tactic as Tactic & { stats?: TacticStats }).stats;
  const isAuthor = !!user && tactic.author?.id === user.id;
  const initialOf = (name: string) => name.charAt(0).toUpperCase();

  /** Shared width for everything under the pitch, so chips, copy and comments line up with it. */
  const column: React.CSSProperties = { maxWidth: 900, margin: "0 auto" };

  const avatar = (bg: string, fg: string, shadow = false): React.CSSProperties => ({
    width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16,
    background: bg, color: fg,
    border: "var(--border-w) solid var(--ink)",
    boxShadow: shadow ? "var(--shadow-sm)" : "none",
  });

  return (
    <div className="dot-bg" style={{ minHeight: "100vh", color: "var(--on-surface)", padding: isMobile ? "12px 14px 48px" : "22px clamp(16px, 4vw, 30px) 56px" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <TopNav />

        {/* Stacked on phones: stretch, not flex-start, or the column shrink-wraps to its content and overflows the screen. */}
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 32, alignItems: isMobile ? "stretch" : "flex-start", marginTop: isMobile ? 20 : 32 }}>
          {/* ── Left column: header · pitch · player · chips · description · comments ── */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Header: back chip, kicker, title — the same shape as the studio header. */}
            <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 12 : 16, marginBottom: isMobile ? 20 : 24 }}>
              {isMobile ? (
                <button
                  onClick={() => navigate(-1)}
                  aria-label="Back"
                  style={{
                    width: 38, height: 38, borderRadius: 11, flexShrink: 0, cursor: 'pointer',
                    background: 'var(--surface-high)',
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
                <div className="kicker" style={{ marginBottom: 4 }}>
                  Tactic{tactic.formation ? ` · ${tactic.formation}` : ""}
                </div>
                <h1
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    fontSize: isMobile ? 18 : 40,
                    lineHeight: 1,
                    letterSpacing: '-0.02em',
                    margin: 0,
                    color: 'var(--on-surface)',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {tactic.title}
                </h1>
              </div>
              {/* Only the author can save changes, so only they get the way in. */}
              {isAuthor && (
                <button
                  type="button"
                  onClick={() => navigate(`/edit-tactics/${tactic.id}`)}
                  aria-label="Edit tactic"
                  style={{
                    marginLeft: "auto", flexShrink: 0,
                    display: "flex", alignItems: "center", gap: 6,
                    padding: isMobile ? "8px 10px" : "8px 14px",
                    borderRadius: 999,
                    background: "var(--primary)", color: "var(--on-primary)",
                    border: "var(--border-w) solid var(--ink)",
                    boxShadow: "var(--shadow-sm)",
                    fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  <Pencil size={14} />
                  {!isMobile && "Edit"}
                </button>
              )}
            </div>

            <FootballField portrait={isMobile} framed={!isMobile} />

            {/* Animation Player — only shown if tactic has animation */}
            {animation.keyframes.length > 0 && (
              <AnimationPlayer
                currentTimeMs={animation.currentTimeMs}
                durationMs={animation.durationMs}
                isPlaying={animation.isPlaying}
                onPlay={animation.play}
                onPause={animation.pause}
                onSeek={handleSeek}
                loop={animation.loop}
                onSetLoop={animation.setLoop}
                loopDelayRemainingMs={animation.loopDelayRemainingMs}
                compact={isMobile}
              />
            )}

            {/* Formation & Tags */}
            <div style={{ ...column, marginTop: 24, display: "flex", flexWrap: "wrap", gap: 10 }}>
              {tactic.formation && (
                <span className="chip-mono" style={{ padding: "6px 14px" }}>{tactic.formation}</span>
              )}
              {tactic.tags?.map((tag, index) => (
                <span key={index} className="chip-tag">{tag}</span>
              ))}
            </div>

            {/* Description */}
            {tactic.description && (
              <section style={{ ...column, marginTop: 40 }}>
                <div className="kicker" style={{ marginBottom: 6 }}>About</div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--on-surface)", margin: "0 0 12px" }}>
                  Description
                </h2>
                <p style={{ fontSize: 15, lineHeight: 1.65, color: "var(--on-surface-variant)", margin: 0, maxWidth: 680, textWrap: "pretty" as React.CSSProperties["textWrap"] }}>
                  {tactic.description}
                </p>
              </section>
            )}

            {/* Comments */}
            <section style={{ ...column, marginTop: 40 }}>
              <div className="kicker" style={{ marginBottom: 6 }}>Discussion</div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--on-surface)", margin: "0 0 20px" }}>
                Comments{comments.length > 0 && <span style={{ color: "var(--caption)" }}> · {comments.length}</span>}
              </h2>

              {/* Composer */}
              <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
                <div style={avatar("var(--grass-green)", "var(--ink)", true)}>U</div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
                  <Textarea
                    rows={4}
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    disabled={isSubmittingComment}
                    style={{ fontSize: 15 }}
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      onClick={handleCommentSubmit}
                      disabled={!newComment.trim() || isSubmittingComment}
                      className="editorbar-btn editorbar-btn--primary"
                      style={{ padding: "9px 20px", fontSize: 14 }}
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
                <p style={{ textAlign: "center", padding: "24px 0", color: "var(--outline)", margin: 0 }}>
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                    <div style={{ ...avatar("var(--surface-high)", "var(--on-surface)"), fontSize: 15 }}>
                      {initialOf(comment.user.username)}
                    </div>
                    <div style={{
                      flex: 1, minWidth: 0, borderRadius: 12, padding: 16,
                      display: "flex", flexDirection: "column", gap: 6,
                      border: "var(--border-w) solid var(--ink)",
                      background: "var(--surface-container)",
                      boxShadow: "var(--shadow-sm)",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 700, color: "var(--on-surface)" }}>{comment.user.username}</span>
                        <span style={{ fontSize: 12, fontFamily: "var(--font-display)", color: "var(--outline)" }}>
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p style={{ margin: 0, color: "var(--on-surface-variant)", fontSize: 15, lineHeight: 1.55 }}>{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </section>
          </div>

          {/* ── Right rail: creator card ── */}
          <aside style={{ width: isMobile ? "100%" : 320, flexShrink: 0, marginTop: isMobile ? 0 : 74 }}>
            <div style={{
              borderRadius: 16, padding: 24,
              background: "var(--surface-container)",
              border: "var(--border-w) solid var(--ink)",
              boxShadow: "var(--card-shadow)",
            }}>
              <div className="kicker" style={{ marginBottom: 6 }}>Creator</div>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--on-surface)", margin: "0 0 20px" }}>
                About the Creator
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
                <div style={avatar("var(--grass-green)", "var(--ink)", true)}>
                  {initialOf(tactic.author.username)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 17, color: "var(--on-surface)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {tactic.author.username}
                  </p>
                  <p style={{ fontSize: 13, color: "var(--outline)", margin: "2px 0 0", fontFamily: "var(--font-display)" }}>
                    Created on {formatDate(tactic.createdAt)}
                  </p>
                </div>
              </div>

              {stats && (
                <div style={{
                  display: "flex", gap: 16, marginBottom: 24, padding: "12px 14px", borderRadius: 12,
                  background: "var(--surface-low)", border: "var(--border-w) solid var(--ink)",
                  fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14,
                }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--caption)" }}>
                    <Heart size={15} /> {stats.likes ?? 0}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--on-surface-variant)" }}>
                    <MessageCircle size={15} /> {stats.comments ?? comments.length}
                  </span>
                  {stats.views !== undefined && (
                    <span style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--on-surface-variant)" }}>
                      <Eye size={15} /> {stats.views}
                    </span>
                  )}
                </div>
              )}

              <button
                onClick={() => navigate("/create-tactics")}
                className="editorbar-btn editorbar-btn--primary"
                style={{ width: "100%", justifyContent: "center", padding: 13, fontSize: 14, boxShadow: "var(--card-shadow)" }}
              >
                Create Your Own Tactic
              </button>
            </div>
          </aside>
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

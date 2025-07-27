import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Share2, Loader2 } from "lucide-react";
import { TacticEntity } from "../entities/TacticEntity";
import type { Tactic, Player, Comment } from "../../../../packages/shared";
import FootballField from "../components/FootballField.tsx";
import { renderBackButton } from "../components/ui/back-button.tsx";
import { Textarea } from "../components/ui/textarea.tsx";
import {
  FootballFieldProvider,
  useFootballField,
} from "../contexts/FootballFieldContext.tsx";
import { usePlayerDrag } from "../hooks/usePlayerDrag.ts";

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
    players,
    setPlayers,
    setOptions,
    setActions,
    setDraggedPlayer,
    fieldRef,
  } = useFootballField();

  // Sticky drag logic for details page, use context's fieldRef
  const drag = usePlayerDrag(
    players,
    setPlayers,
    { sticky: true },
    fieldRef as React.RefObject<HTMLDivElement>,
  );
  useEffect(() => {
    setActions({
      onMouseDown: drag.handleMouseDown,
      onMouseMove: drag.handleMouseMove,
      onMouseUp: drag.handleMouseUp,
    });
    setOptions((prev) => ({
      ...prev,
      size: "default",
      editable: false,
      enableContextMenu: false,
    }));
    setDraggedPlayer(drag.draggedPlayer);
  }, [setActions, setOptions, setDraggedPlayer, drag.draggedPlayer]);

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
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !tactic) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
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
    <div className="bg-black text-white min-h-screen">
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        <div className="flex">
          {/* Left Content - Football Field */}
          <div className="flex-1 pr-8">
            <div className="flex items-center gap-4 mb-8">
              {renderBackButton(() => navigate(-1))}
              <h1 className="text-5xl font-bold ">{tactic.title}</h1>
            </div>
            <FootballField />
            {/* Formation & Tags */}
            <div className="flex flex-wrap px-10 gap-3 mb-6 mt-6">
              <span className="bg-[#1a1a1a] border border-[rgb(49,54,63)] px-4 py-2 rounded-full text-sm font-medium">
                {tactic.formation}
              </span>
              {tactic.tags?.map((tag, index) => (
                <span
                  key={index}
                  className="bg-[#1a1a1a] border border-[rgb(49,54,63)] px-4 py-2 rounded-full text-sm cursor-pointer hover:bg-gray-700 transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
            {/* Description */}
            <div className="mb-12 px-10">
              <h3 className="text-2xl font-bold mb-4">Description</h3>
              <div className="text-gray-300 leading-relaxed">
                {tactic.description}
              </div>
            </div>
            {/* Comments Section */}
            <div>
              <h3 className="text-2xl px-10 font-bold mb-6">Comments</h3>
              {/* Add Comment */}
              <div className="flex gap-4 mb-6 px-10">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
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
                      className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 rounded-xl transition-colors text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
                <p className="text-gray-500 text-center py-8">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-4 mb-4 px-10">
                    <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold text-md flex-shrink-0">
                      {comment.user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 border border-[rgb(49,54,63)] rounded-xl p-4 flex flex-col gap-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">
                          {comment.user.username}
                        </span>
                        <span className="text-sm text-gray-400">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-300">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          {/* Right Sidebar */}
          <div className="w-80 flex-shrink-2" style={{ marginTop: "5  rem" }}>
            <div className="bg-[#1a1a1a] border border-[rgb(49,54,63)] rounded-xl p-6">
              <h3 className="text-xl font-bold mb-6">About the Creator</h3>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {tactic.author.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-white text-lg">
                    {tactic.author.username}
                  </p>
                  <p className="text-sm text-gray-400">
                    Created on {formatDate(tactic.createdAt)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate("/create")}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl transition-colors font-medium"
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

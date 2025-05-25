import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Heart, MessageCircle, Save, Share2, Loader2 } from 'lucide-react';
import { TacticEntity } from '../entities/TacticEntity';
import type { Tactic, Player, Comment } from '../../../../packages/shared';

const TacticsDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Loading and error states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Tactic data
    const [tactic, setTactic] = useState<Tactic | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);

    // Interaction states
    const [likes, setLikes] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    // Drag and drop
    const [draggedPlayer, setDraggedPlayer] = useState<Player | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fieldRef = useRef<HTMLDivElement>(null);

    // Fetch tactic data on mount
    useEffect(() => {
        if (id) {
            fetchTacticDetails();
            fetchComments();
        }
    }, [id]);

    const fetchTacticDetails = async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await TacticEntity.getById(id!);
            setTactic(data);
            setPlayers(data.players || []);
            setLikes(data.stats?.likes || 0);
            setIsLiked(data.userInteraction?.isLiked || false);
            setIsSaved(data.userInteraction?.isSaved || false);

            // If comments are included in the response
            if ('comments' in data) {
                setComments((data as any).comments || []);
            }
        } catch (err) {
            console.error('Error fetching tactic:', err);
            setError(err instanceof Error ? err.message : 'Failed to load tactic');
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async () => {
        try {
            const commentsData = await TacticEntity.getComments(id!);
            setComments(commentsData);
        } catch (err) {
            console.error('Error fetching comments:', err);
        }
    };

    const handleMouseDown = (player: Player) => {
        setDraggedPlayer(player);
        setIsDragging(true);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !draggedPlayer || !fieldRef.current) return;

        const fieldRect = fieldRef.current.getBoundingClientRect();
        const x = ((e.clientX - fieldRect.left) / fieldRect.width) * 100;
        const y = ((e.clientY - fieldRect.top) / fieldRect.height) * 100;

        setPlayers(players.map(p =>
            p.id === draggedPlayer.id
                ? { ...p, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }
                : p
        ));
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setDraggedPlayer(null);
    };

    const handleLike = async () => {
        try {
            if (isLiked) {
                await TacticEntity.unlike(id!);
                setLikes(prev => prev - 1);
            } else {
                await TacticEntity.like(id!);
                setLikes(prev => prev + 1);
            }
            setIsLiked(!isLiked);
        } catch (err) {
            console.error('Error toggling like:', err);
        }
    };

    const handleSave = async () => {
        try {
            if (isSaved) {
                await TacticEntity.unsave(id!);
            } else {
                await TacticEntity.save(id!);
            }
            setIsSaved(!isSaved);
        } catch (err) {
            console.error('Error toggling save:', err);
        }
    };

    const handleCommentSubmit = async () => {
        if (!newComment.trim() || isSubmittingComment) return;

        setIsSubmittingComment(true);
        try {
            const comment = await TacticEntity.addComment(id!, newComment);
            setComments([comment, ...comments]);
            setNewComment('');
        } catch (err) {
            console.error('Error posting comment:', err);
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const formatDate = (date: string | Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
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
                    <p className="text-xl text-red-500 mb-4">{error || 'Tactic not found'}</p>
                    <button
                        onClick={() => navigate('/')}
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
            <div className="max-w-screen-xl mx-auto px-6 py-8">
                <div className="flex">
                    {/* Left Content - Football Field */}
                    <div className="flex-1 pr-8">
                        {/* Header */}
                        <div className="flex items-center gap-4 mb-8">
                            <ChevronLeft
                                className="h-6 w-6 text-gray-400 cursor-pointer hover:text-white"
                                onClick={() => navigate(-1)}
                            />
                            <h1 className="text-5xl font-bold ">{tactic.title}</h1>
                        </div>

                        {/* Football Field */}
                        <div
                            ref={fieldRef}
                            className="relative bg-green-800 rounded-xl overflow-hidden cursor-move mb-6"
                            style={{
                                aspectRatio: '11/7',
                                width: '100%',
                                maxWidth: '800px'
                            }}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        >
                            {/* Field markings SVG - Updated with smaller penalty areas */}
                            <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 550 350">
                                {/* Outer boundary */}
                                <rect x="20" y="20" width="510" height="310" stroke="white" strokeWidth="2.5" fill="none" />

                                {/* Center line */}
                                <line x1="275" y1="20" x2="275" y2="330" stroke="white" strokeWidth="2.5" />

                                {/* Center circle */}
                                <circle cx="275" cy="175" r="45" stroke="white" strokeWidth="2.5" fill="none" />
                                <circle cx="275" cy="175" r="3" fill="white" />

                                {/* Left penalty area - REDUCED WIDTH */}
                                <rect x="20" y="95" width="70" height="160" stroke="white" strokeWidth="2.5" fill="none" />

                                {/* Right penalty area - REDUCED WIDTH */}
                                <rect x="460" y="95" width="70" height="160" stroke="white" strokeWidth="2.5" fill="none" />

                                {/* Left goal area (6-yard box) - ADJUSTED */}
                                <rect x="20" y="130" width="30" height="90" stroke="white" strokeWidth="2.5" fill="none" />

                                {/* Right goal area (6-yard box) - ADJUSTED */}
                                <rect x="500" y="130" width="30" height="90" stroke="white" strokeWidth="2.5" fill="none" />

                                {/* Left penalty spot - ADJUSTED */}
                                <circle cx="65" cy="175" r="3" fill="white" />

                                {/* Right penalty spot - ADJUSTED */}
                                <circle cx="485" cy="175" r="3" fill="white" />

                                {/* Left penalty arc (D) - ADJUSTED */}
                                <path d="M 90 155 A 30 30 0 0 1 90 195" stroke="white" strokeWidth="2.5" fill="none" />

                                {/* Right penalty arc (D) - ADJUSTED */}
                                <path d="M 460 155 A 30 30 0 0 0 460 195" stroke="white" strokeWidth="2.5" fill="none" />

                                {/* Corner arcs */}
                                {/* Top-left corner */}
                                <path d="M 20 30 A 10 10 0 0 0 30 20" stroke="white" strokeWidth="2.5" fill="none" />

                                {/* Top-right corner */}
                                <path d="M 520 20 A 10 10 0 0 0 530 30" stroke="white" strokeWidth="2.5" fill="none" />

                                {/* Bottom-left corner */}
                                <path d="M 30 330 A 10 10 0 0 0 20 320" stroke="white" strokeWidth="2.5" fill="none" />

                                {/* Bottom-right corner */}
                                <path d="M 530 320 A 10 10 0 0 0 520 330" stroke="white" strokeWidth="2.5" fill="none" />
                            </svg>
                            {/* Players */}
                            {players.map((player) => (
                                <div
                                    key={player.id}
                                    className="absolute w-10 h-10 transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing"
                                    style={{
                                        left: `${player.x}%`,
                                        top: `${player.y}%`,
                                        zIndex: draggedPlayer?.id === player.id ? 50 : 10
                                    }}
                                    onMouseDown={() => handleMouseDown(player)}
                                >
                                    <div className="w-full h-full bg-green-400 rounded-full flex items-center justify-center text-black font-bold text-lg shadow-lg border-2 border-gray-300">
                                        {player.number}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Formation & Tags */}
                        <div className="flex flex-wrap gap-3 mb-6">
                            <span className="bg-[#1a1a1a] border border-[rgb(49,54,63)] px-4 py-2 rounded-full text-sm font-medium ">
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

                        {/* Action Buttons */}
                        <div className="flex items-center gap-4 mb-8">
                            <button
                                onClick={handleLike}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 border group ${
                                    isLiked
                                        ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                        : 'bg-[#1a1a1a] border border-[rgb(49,54,63)] hover:bg-gray-700 text-gray-300'
                                }`}
                            >
                                <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                                <span>{likes}</span>
                            </button>

                            <button className="flex items-center gap-2 px-3 py-2 bg-[#1a1a1a] border border-[rgb(49,54,63)] hover:bg-gray-700 rounded-xl transition-all duration-200 text-gray-300">
                                <MessageCircle className="h-5 w-5" />
                                {/*<span>{tactic.stats?.comments || 0}</span>*/}
                            </button>

                            <button
                                onClick={handleSave}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors border ${
                                    isSaved
                                        ? 'bg-green-600/10 text-green-500 border-green-500/20'
                                        : 'bg-[#1a1a1a] border border-[rgb(49,54,63)] hover:bg-gray-700 text-gray-300 '
                                }`}
                            >
                                <Save className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
                                {isSaved ? 'Saved' : 'Save'}
                            </button>

                            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-xl transition-colors text-white">
                                <Share2 className="h-5 w-5" />
                                Share
                            </button>
                        </div>

                        {/* Description */}
                        <div className="mb-12">
                            <h3 className="text-2xl font-bold mb-4">Description</h3>
                            <div className="text-gray-300 leading-relaxed">
                                    {tactic.description}
                            </div>
                        </div>

                        {/* Comments Section */}
                        <div>
                            <h3 className="text-2xl font-bold mb-6">Comments</h3>

                            {/* Add Comment */}
                            <div className="flex gap-4 mb-6">
                                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                    {/* User initial */}
                                    U
                                </div>
                                <div className="flex-1 flex flex-col gap-3">
  <textarea
      className="w-full bg-[#1a1a1a] border border-[rgb(49,54,63)] rounded-xl p-4 text-white resize-none focus:outline-none focus:border-green-500 transition-colors font-normal"
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
                                    <div key={comment.id} className="flex gap-4 mb-4">
                                        <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                            {comment.user.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold">{comment.user.username}</span>
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
                    <div className="w-80 flex-shrink-0" style={{ marginTop: '4rem' }}>
                        <div className="bg-[#1a1a1a] border border-[rgb(49,54,63)] rounded-xl p-6">
                            <h3 className="text-xl font-bold mb-6">About the Creator</h3>

                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                    {tactic.author.username.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-semibold text-white text-lg">{tactic.author.username}</p>
                                    <p className="text-sm text-gray-400">Created on {formatDate(tactic.createdAt)}</p>
                                </div>
                            </div>

                            {/*<button*/}
                            {/*    onClick={() => navigate('/create')}*/}
                            {/*    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl transition-colors font-medium"*/}
                            {/*>*/}
                            {/*    Create Your Own Tactic*/}
                            {/*</button>*/}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TacticsDetails;
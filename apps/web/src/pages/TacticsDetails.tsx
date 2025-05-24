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
                            <h1 className="text-3xl font-bold">{tactic.title}</h1>
                        </div>

                        {/* Football Field */}
                        <div
                            ref={fieldRef}
                            className="relative bg-green-800 rounded-xl overflow-hidden cursor-move mb-6"
                            style={{
                                aspectRatio: '4/3',
                                width: '100%',
                                maxWidth: '800px'
                            }}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        >
                            {/* Field markings SVG (same as before) */}
                            <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 400 300">
                                {/* Outer boundary */}
                                <rect x="10" y="10" width="380" height="280" stroke="white" strokeWidth="2" fill="none" />

                                {/* Center line */}
                                <line x1="200" y1="10" x2="200" y2="290" stroke="white" strokeWidth="2" />

                                {/* Center circle */}
                                <circle cx="200" cy="150" r="40" stroke="white" strokeWidth="2" fill="none" />
                                <circle cx="200" cy="150" r="2" fill="white" />

                                {/* Penalty areas */}
                                <rect x="10" y="85" width="60" height="130" stroke="white" strokeWidth="2" fill="none" />
                                <rect x="330" y="85" width="60" height="130" stroke="white" strokeWidth="2" fill="none" />

                                {/* Goal areas */}
                                <rect x="10" y="115" width="25" height="70" stroke="white" strokeWidth="2" fill="none" />
                                <rect x="365" y="115" width="25" height="70" stroke="white" strokeWidth="2" fill="none" />

                                {/* Corner arcs */}
                                <path d="M 10,10 A 8,8 0 0,1 18,18" stroke="white" strokeWidth="2" fill="none" />
                                <path d="M 390,10 A 8,8 0 0,0 382,18" stroke="white" strokeWidth="2" fill="none" />
                                <path d="M 10,290 A 8,8 0 0,0 18,282" stroke="white" strokeWidth="2" fill="none" />
                                <path d="M 390,290 A 8,8 0 0,1 382,282" stroke="white" strokeWidth="2" fill="none" />
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
                                    <div className="w-full h-full bg-green-400 rounded-full flex items-center justify-center text-black font-bold text-lg shadow-lg border-2 border-white">
                                        {player.number}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Formation & Tags */}
                        <div className="flex flex-wrap gap-3 mb-6">
                            <span className="bg-gray-800 px-4 py-2 rounded-full text-sm font-medium border border-gray-700">
                                {tactic.formation}
                            </span>
                            {tactic.tags?.map((tag, index) => (
                                <span
                                    key={index}
                                    className="bg-gray-800 px-4 py-2 rounded-full text-sm cursor-pointer hover:bg-gray-700 transition-colors border border-gray-700"
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
                                        : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700'
                                }`}
                            >
                                <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                                <span>{likes}</span>
                            </button>

                            <button className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all duration-200 text-gray-300 border border-gray-700">
                                <MessageCircle className="h-5 w-5" />
                                {/*<span>{tactic.stats?.comments || 0}</span>*/}
                            </button>

                            <button
                                onClick={handleSave}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors border ${
                                    isSaved
                                        ? 'bg-green-600/10 text-green-500 border-green-500/20'
                                        : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700'
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
                                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 text-white resize-none focus:outline-none focus:border-green-500 transition-colors font-normal"
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
                            {comments.map((comment) => (
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
                            ))}
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="w-80 flex-shrink-0" style={{ marginTop: '4rem' }}>
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
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

                            <button
                                onClick={() => navigate('/create')}
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

export default TacticsDetails;
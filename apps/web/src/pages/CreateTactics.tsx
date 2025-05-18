import React, { useState, useRef } from 'react';
import { ChevronLeft, Heart, MessageCircle, Save, Share2 } from 'lucide-react';

interface Player {
    id: number;
    x: number;
    y: number;
    number: number;
}

interface TacticFormData {
    title: string;
    formation: string;
    tags: string[];
    description: string;
}

const CreateTactics: React.FC = () => {
    const [formData, setFormData] = useState<TacticFormData>({
        title: 'Tiki-Taka 4-2-3-1',
        formation: '4-2-3-1',
        tags: ['Possession', 'Tiki-Taka', 'Professional'],
        description: 'This possession-based system prioritizes short passing and movement to control the game. The double pivot provides defensive cover while allowing'
    });

    const [players, setPlayers] = useState<Player[]>([
        { id: 1, x: 50, y: 85, number: 1 }, // GK
        { id: 2, x: 25, y: 70, number: 2 }, // LB
        { id: 3, x: 42, y: 75, number: 5 }, // CB
        { id: 4, x: 58, y: 75, number: 6 }, // CB
        { id: 5, x: 75, y: 70, number: 3 }, // RB
        { id: 6, x: 42, y: 55, number: 4 }, // DM
        { id: 7, x: 58, y: 55, number: 8 }, // DM
        { id: 8, x: 25, y: 35, number: 7 }, // LM
        { id: 9, x: 50, y: 40, number: 10 }, // CAM
        { id: 10, x: 75, y: 35, number: 11 }, // RM
        { id: 11, x: 50, y: 20, number: 9 }, // ST
    ]);

    const [draggedPlayer, setDraggedPlayer] = useState<Player | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fieldRef = useRef<HTMLDivElement>(null);

    const [likes, setLikes] = useState(22);
    const [comments, setComments] = useState(0);
    const [isLiked, setIsLiked] = useState(false);

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

    const handleLike = () => {
        setIsLiked(!isLiked);
        setLikes(isLiked ? likes - 1 : likes + 1);
    };

    const handleTagRemove = (tagToRemove: string) => {
        setFormData({
            ...formData,
            tags: formData.tags.filter(tag => tag !== tagToRemove)
        });
    };

    return (
        <div className="bg-black text-white min-h-screen">
            <div className="max-w-screen-xl mx-auto px-6 py-8">
                <div className="flex">
                    {/* Left Content - Football Field */}
                    <div className="flex-1 pr-8">
                        {/* Header */}
                        <div className="flex items-center gap-4 mb-8">
                            <ChevronLeft className="h-6 w-6 text-gray-400 cursor-pointer hover:text-white" />
                            <h1 className="text-3xl font-bold">{formData.title}</h1>
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
                            {/* Field markings */}
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
                                {formData.formation}
                            </span>
                            {formData.tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="bg-gray-800 px-4 py-2 rounded-full text-sm cursor-pointer hover:bg-gray-700 transition-colors border border-gray-700"
                                    onClick={() => handleTagRemove(tag)}
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
                                        : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700 hover:px-4'
                                }`}
                            >
                                <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                                <span className="transition-all duration-200">{likes}</span>
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 overflow-hidden max-w-0 group-hover:max-w-full whitespace-nowrap">
                                    {isLiked ? '' : ''}
                                </span>
                            </button>

                            <button className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all duration-200 text-gray-300 border border-gray-700 hover:px-4 group">
                                <MessageCircle className="h-5 w-5" />
                                <span className="transition-all duration-200">{comments}</span>
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 overflow-hidden max-w-0 group-hover:max-w-full whitespace-nowrap">

                                </span>
                            </button>

                            <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors text-gray-300 border border-gray-700">
                                <Save className="h-5 w-5" />
                                Save
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
                                This possession-based system prioritizes short passing and movement to control the game. The double pivot provides defensive cover while allowing full-backs to advance. The attacking midfield trio offers creative options behind a mobile center-forward who drops deep to create numeric superiority in midfield.
                            </div>
                        </div>

                        {/* Comments Section */}
                        <div>
                            <h3 className="text-2xl font-bold mb-6">Comments</h3>

                            {/* Add Comment */}
                            <div className="flex gap-4 mb-6">
                                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                    S
                                </div>
                                <div className="flex-1 flex flex-col gap-3">
                                    <textarea
                                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 text-white resize-none focus:outline-none focus:border-green-500 transition-colors font-normal"
                                        rows={4}
                                        placeholder="Add a comment..."
                                    />
                                    <div className="flex justify-end">
                                        <button className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 rounded-xl transition-colors text-white font-medium">
                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                                <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
                                            </svg>
                                            Post Comment
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="w-80 flex-shrink-0" style={{ marginTop: '4rem' }}>
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                            <h3 className="text-xl font-bold mb-6">About the Creator</h3>

                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                    S
                                </div>
                                <div>
                                    <p className="font-semibold text-white text-lg">siddyas0</p>
                                    <p className="text-sm text-gray-400">Created on 16/05/2025</p>
                                </div>
                            </div>

                            <button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl transition-colors font-medium">
                                Create Your Own Tactic
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateTactics;
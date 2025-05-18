// entities/Tactic.ts
// This file contains both the interface and the class

// Interface definition for type safety
export interface ITactic {
    id: string;
    title?: string;
    description?: string;
    formation?: string;
    tags?: string[];
    author?: {
        id: string;
        name: string;
        avatar?: string;
    };
    likes?: number;
    comments?: IComment[] | number;
    created_date: string;
    image_url?: string;
    preview_image?: string;
    featured?: boolean;
}

export interface IComment {
    id: string;
    content: string;
    author: {
        id: string;
        name: string;
        avatar?: string;
    };
    created_date: string;
}

// Mock data for demonstration
const MOCK_TACTICS: ITactic[] = [
    {
        id: "1",
        title: "Tiki-Taka 4-3-3",
        description: "A high-intensity pressing system with rapid transitions",
        formation: "4-3-3",
        tags: ["possession", "attacking"],
        author: {
            id: "user1",
            name: "Pep Guardiola",
            avatar: "https://i.pravatar.cc/150?u=pep@example.com"
        },
        likes: 312,
        comments: 24,
        created_date: "2025-03-05T11:45:00Z",
        // No image_url so it will show default football field
        featured: true
    },
    {
        id: "2",
        title: "Total Football 4-3-3",
        description: "Quick transitions from defense to attack",
        formation: "4-3-3",
        tags: ["possession", "attacking"],
        author: {
            id: "user2",
            name: "Johan Cruyff",
            avatar: "https://i.pravatar.cc/150?u=jose@example.com"
        },
        likes: 289,
        comments: 22,
        created_date: "2025-03-22T13:10:00Z",
        // No image_url so it will show default football field
    },
    {
        id: "3",
        title: "Gegenpressing 4-2-3-1",
        description: "Possession-based football with short passing and movement",
        formation: "4-2-3-1",
        tags: ["pressing", "counter"],
        author: {
            id: "user1",
            name: "Jürgen Klopp",
            avatar: "https://i.pravatar.cc/150?u=pep@example.com"
        },
        likes: 276,
        comments: 19,
        created_date: "2025-04-18T16:30:00Z",
        // No image_url so it will show default football field
        featured: true
    },
    {
        id: "4",
        title: "High Pressing 4-3-3",
        description: "Intense pressure immediately after losing possession",
        formation: "4-3-3",
        tags: ["pressing", "attacking", "possession"],
        author: {
            id: "user3",
            name: "Pep Guardiola",
            avatar: "https://i.pravatar.cc/150?u=jurgen@example.com"
        },
        likes: 245,
        comments: 18,
        created_date: "2025-04-12T09:23:00Z",
        // No image_url so it will show default football field
    },
    {
        id: "5",
        title: "Counter-Attack 4-2-3-1",
        description: "Defensive system with swift counter-attacks",
        formation: "4-2-3-1",
        tags: ["counter", "defensive"],
        author: {
            id: "user4",
            name: "José Mourinho",
            avatar: "https://i.pravatar.cc/150?u=antonio@example.com"
        },
        likes: 187,
        comments: 12,
        created_date: "2025-04-28T14:15:00Z",
        // No image_url so it will show default football field
    },
    {
        id: "6",
        title: "Catenaccio 5-3-2",
        description: "Fluid system where any outfield player can take any position",
        formation: "5-3-2",
        tags: ["defensive", "counter"],
        author: {
            id: "user5",
            name: "Antonio Conte",
            avatar: "https://i.pravatar.cc/150?u=johan@example.com"
        },
        likes: 145,
        comments: 8,
        created_date: "2025-05-01T10:20:00Z",
        // No image_url so it will show default football field
        featured: true
    }
];

// Tactic class with static methods for API operations
export class Tactic {
    // Static method to get all tactics
    static async list(): Promise<ITactic[]> {
        // In a real app, this would make an HTTP request to your API
        // For now, simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));

        return MOCK_TACTICS;
    }

    // Static method to get a single tactic by ID
    static async get(id: string): Promise<ITactic | null> {
        // In a real app, this would make an HTTP request to your API
        await new Promise(resolve => setTimeout(resolve, 300));

        const tactic = MOCK_TACTICS.find(t => t.id === id);
        return tactic || null;
    }

    // Static method to create a new tactic
    static async create(tacticData: Omit<ITactic, 'id' | 'created_date' | 'likes' | 'comments'>): Promise<ITactic> {
        // In a real app, this would make a POST request to your API
        await new Promise(resolve => setTimeout(resolve, 500));

        const newTactic: ITactic = {
            ...tacticData,
            id: Math.random().toString(36).substr(2, 9),
            created_date: new Date().toISOString(),
            likes: 0,
            comments: 0
        };

        MOCK_TACTICS.push(newTactic);
        return newTactic;
    }

    // Static method to update a tactic
    static async update(id: string, updateData: Partial<ITactic>): Promise<ITactic | null> {
        // In a real app, this would make a PUT/PATCH request to your API
        await new Promise(resolve => setTimeout(resolve, 500));

        const index = MOCK_TACTICS.findIndex(t => t.id === id);
        if (index === -1) return null;

        MOCK_TACTICS[index] = { ...MOCK_TACTICS[index], ...updateData };
        return MOCK_TACTICS[index];
    }

    // Static method to delete a tactic
    static async delete(id: string): Promise<boolean> {
        // In a real app, this would make a DELETE request to your API
        await new Promise(resolve => setTimeout(resolve, 300));

        const index = MOCK_TACTICS.findIndex(t => t.id === id);
        if (index === -1) return false;

        MOCK_TACTICS.splice(index, 1);
        return true;
    }

    // Static method to like/unlike a tactic
    static async toggleLike(id: string, isLiked: boolean): Promise<ITactic | null> {
        // In a real app, this would make a POST request to your API
        await new Promise(resolve => setTimeout(resolve, 200));

        const index = MOCK_TACTICS.findIndex(t => t.id === id);
        if (index === -1) return null;

        const currentLikes = MOCK_TACTICS[index].likes || 0;
        MOCK_TACTICS[index].likes = isLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1);

        return MOCK_TACTICS[index];
    }

    // Static method to search tactics
    static async search(query: string, tags?: string[]): Promise<ITactic[]> {
        // In a real app, this would make a GET request with search parameters
        await new Promise(resolve => setTimeout(resolve, 400));

        let filtered = MOCK_TACTICS;

        // Filter by search query
        if (query) {
            const lowercaseQuery = query.toLowerCase();
            filtered = filtered.filter(tactic =>
                tactic.title?.toLowerCase().includes(lowercaseQuery) ||
                tactic.description?.toLowerCase().includes(lowercaseQuery) ||
                tactic.author?.name.toLowerCase().includes(lowercaseQuery)
            );
        }

        // Filter by tags
        if (tags && tags.length > 0) {
            filtered = filtered.filter(tactic =>
                tactic.tags?.some(tag => tags.includes(tag))
            );
        }

        return filtered;
    }
}

// Export the interface as the default type for use in components
export type { ITactic as TacticType };
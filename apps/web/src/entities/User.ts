export interface User {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
}

export const User = {
    async me(): Promise<User> {
        // Replace with real auth logic
        return Promise.resolve({
            id: "sv-user",
            name: "Siddhant Vyas",
            email: "sid@example.com",
            avatar_url: "https://avatars.githubusercontent.com/u/12345",
        });
    },
};

// AuthTokenStore.ts
let token: string | null = null;

export const AuthTokenStore = {
    setToken: (newToken: string | null) => {
        token = newToken;
    },
    getToken: () => token,
};

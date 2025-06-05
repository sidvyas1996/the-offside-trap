import axios from "axios";
import type {User} from "@supabase/supabase-js";
import {AuthTokenStore} from "./AuthTokenStore.ts";
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});
api.interceptors.request.use((config) => {
    const jwt = AuthTokenStore.getToken();
    console.log('jwt',jwt);
    if (jwt) {
        config.headers.Authorization = `Bearer ${jwt}`;
    }
    return config;
});

export async function createUserEntity(user: User) {
    try {
        await api.post(`/users/me`, {
            userId: user.id,
            email: user.email,
            username: user.user_metadata.full_name,
        });
    } catch (err) {
        console.error('Failed to sync user to DB:', err);
    }
}

export async function getUserDetails(user: User) {
    try {
        await api.get(`/users/me`);
    } catch (err) {
        console.error('Failed to sync user to DB:', err);
    }
}
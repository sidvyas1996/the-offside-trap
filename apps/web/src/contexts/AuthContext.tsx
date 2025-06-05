import { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import {AuthTokenStore} from "../entities/AuthTokenStore.ts";
import {createUserEntity} from "../entities/UserEntity.ts";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    jwt: string | null;
    displayName: string;
    avatarUrl: string;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, username: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [jwt, setJwt] = useState<string | null>(null);
    const [displayName, setDisplayName] = useState<string>('Anonymous');
    const [avatarUrl, setAvatarUrl] = useState<string>('');

    useEffect(() => {
        // Load session on initial load
        const initializeAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user ?? null;

            setUser(user ?? null);
            const jwt = session?.access_token ?? null;
            setJwt(jwt);
            AuthTokenStore.setToken(jwt);
            if (user) {
                try {
                    await createUserEntity(user);
                } catch (err) {
                    console.error('Failed to sync user to DB:', err);
                }
            }
            setDisplayName(user?.user_metadata?.full_name ?? 'Anonymous');
            setAvatarUrl(user?.user_metadata?.avatar_url ?? '');
            setLoading(false);
        };

        initializeAuth();

        // Listen to auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            const user = session?.user ?? null;
            setUser(user);
            setJwt(session?.access_token ?? null);
            AuthTokenStore.setToken(jwt);
            setDisplayName(user?.user_metadata?.full_name ?? 'Anonymous');
            setAvatarUrl(user?.user_metadata?.avatar_url ?? '');
        });

        return () => subscription.unsubscribe();
    }, []);

    const signUp = async (email: string, password: string, username: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { username },
            },
        });
        if (error) throw error;
    };

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        setUser(null);
        setJwt(null);
        setDisplayName('Anonymous');
        setAvatarUrl('');
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                jwt,
                displayName,
                avatarUrl,
                signIn,
                signUp,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

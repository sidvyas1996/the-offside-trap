import axios from 'axios';
import type { User, ApiResponse } from '../../../../packages/shared';

const api = axios.create({
    baseURL:import.meta.env.VITE_API_URL!,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const UserEntity = {
    async me() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        // Get additional user data from your database
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        if (error) throw error

        return {
            id: user.id,
            email: user.email!,
            username: data.username,
            avatar_url: data.avatar_url
        }
    }
}

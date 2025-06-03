import axios from 'axios';
//import type { User, ApiResponse } from '../../../../packages/shared';
import { supabase } from '../lib/supabase'

const api = axios.create({
    baseURL:import.meta.env.VITE_API_URL!,
    headers: {
        'Content-Type': 'application/json',
    },
});

// export const UserEntity = {
//     async me(): Promise<User> {
//         try {
//             const { data } = await api.get<ApiResponse<User>>('/users/me');
//
//             if (!data.success || !data.data) {
//                 throw new Error(data.error || 'Failed to fetch user data');
//             }
//             return data.data;
//         } catch (error) {
//             if (axios.isAxiosError(error)) {
//                 if (error.response?.status === 401) {
//                     throw new Error('Unauthorized');
//                 }
//                 if (error.response?.status === 404) {
//                     throw new Error('User not found');
//                 }
//                 throw new Error(`HTTP error! status: ${error.response?.status}`);
//             }
//
//             console.error('Error fetching user:', error);
//             throw error;
//         }
//     }
// };

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

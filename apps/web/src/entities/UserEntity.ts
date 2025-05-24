import axios from 'axios';
import type { User, ApiResponse } from '../../../../packages/shared';

const api = axios.create({
    baseURL:'http://localhost:3001/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

export const UserEntity = {
    async me(): Promise<User> {
        try {
            const { data } = await api.get<ApiResponse<User>>('/users/me');

            if (!data.success || !data.data) {
                throw new Error(data.error || 'Failed to fetch user data');
            }
            return data.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    throw new Error('Unauthorized');
                }
                if (error.response?.status === 404) {
                    throw new Error('User not found');
                }
                throw new Error(`HTTP error! status: ${error.response?.status}`);
            }

            console.error('Error fetching user:', error);
            throw error;
        }
    }
};


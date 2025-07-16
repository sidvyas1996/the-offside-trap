// hooks/useLogout.ts
import { useNavigate } from 'react-router-dom';

export const useLogout = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        navigate('/login');
    };

    return handleLogout;
};

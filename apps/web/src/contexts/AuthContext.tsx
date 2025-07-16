import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react'
import type { User } from '../../../../packages/shared'

interface AuthContextType {
    user: User | null
    loading: boolean
    signIn: (email: string, password: string) => Promise<void>
    signUp: (email: string, password: string, username: string) => Promise<void>
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    // On mount: check if token exists and fetch user
    useEffect(() => {
        const token = localStorage.getItem('auth_token')
        if (!token) {
            setLoading(false)
            return
        }

        fetch('/api/users/me', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(async (res) => {
                if (!res.ok) throw new Error('Unauthorized')
                const { data } = await res.json()
                setUser(data)
            })
            .catch(() => {
                setUser(null)
                localStorage.removeItem('auth_token')
            })
            .finally(() => setLoading(false))
    }, [])

    const signUp = async (email: string, password: string, username: string) => {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, username }),
        })

        if (!res.ok) throw new Error('Registration failed')
        const { token } = await res.json()
        localStorage.setItem('auth_token', token)
        await fetchUser()
    }

    const signIn = async (email: string, password: string) => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        })

        if (!res.ok) throw new Error('Login failed')
        const { token } = await res.json()
        localStorage.setItem('auth_token', token)
        await fetchUser()
    }

    const signOut = async () => {
        localStorage.removeItem('auth_token')
        setUser(null)
        // Optionally, call backend /logout
        // await fetch('/api/auth/logout', { method: 'POST' });
    }

    const fetchUser = async () => {
        const token = localStorage.getItem('auth_token')
        const res = await fetch('/api/users/me', {
            headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error('Failed to fetch user')
        const { data } = await res.json()
        setUser(data)
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                signIn,
                signUp,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

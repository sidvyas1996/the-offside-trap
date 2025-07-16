import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api' // ✅ use your shared axios instance

export const Login = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    const navigate = useNavigate()

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setErrorMsg('')

        try {
            const res = await api.post('/auth/login', {
                email,
                password,
            })

            const { token } = res.data
            localStorage.setItem('auth_token', token.accessToken)
            navigate('/')
        } catch (error: any) {
            const message =
                error?.response?.data?.error ||
                error?.message ||
                'Something went wrong. Please try again later.'
            setErrorMsg(message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="max-w-md w-full space-y-8 p-8 bg-gray-800 rounded-xl">
                <div className="flex justify-center">
                    <img
                        src="/logo.png"
                        alt="The Offside Trap Logo"
                        className="h-20 w-auto"
                    />
                </div>
                <h2 className="text-3xl font-bold text-white text-center">
                    Sign in to The Offside Trap
                </h2>

                {errorMsg && (
                    <p className="text-red-400 text-sm text-center">{errorMsg}</p>
                )}

                <form onSubmit={handleEmailLogin} className="space-y-4">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500"
                        required
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500"
                        required
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    )
}
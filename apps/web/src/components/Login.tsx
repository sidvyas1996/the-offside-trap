import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { FaGoogle, FaGithub, FaDiscord } from 'react-icons/fa'

export const Login = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await supabase.auth.signInWithPassword({
                email,
                password,
            })
        } catch (error) {
            alert((error instanceof  Error) ? error.message: 'Something went wrong. Please try again later.')
        } finally {
            setLoading(false)
        }
    }

    // Social logins
    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`
            }
        })
        if (error) console.error('Error:', error)
    }

    const signInWithGithub = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`
            }
        })
        if (error) console.error('Error:', error)
    }

    const signInWithDiscord = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'discord',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`
            }
        })
        if (error) console.error('Error:', error)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="max-w-md w-full space-y-8 p-8 bg-gray-800 rounded-xl">
                {/* Logo or Illustration */}
                <div className="flex justify-center">
                    <img
                        src="/logo.png" // Replace with your actual path or URL
                        alt="The Offside Trap Logo"
                        className="h-20 w-auto"
                    />
                </div>
                <h2 className="text-3xl font-bold text-white text-center">
                    Sign in to The Offiside Trap
                </h2>

                {/* Social Login Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={signInWithGoogle}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition"
                    >
                        <FaGoogle className="text-xl" />
                        Continue with Google
                    </button>

                    <button
                        onClick={signInWithGithub}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                    >
                        <FaGithub className="text-xl" />
                        Continue with GitHub
                    </button>

                    <button
                        onClick={signInWithDiscord}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                        <FaDiscord className="text-xl" />
                        Continue with Discord
                    </button>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-gray-800 text-gray-400">Or continue with email</span>
                    </div>
                </div>

                {/* Email/Password Form */}
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
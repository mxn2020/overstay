import { useState, useEffect } from 'react'
import { useAuthActions } from "@convex-dev/auth/react"
import { useMutation, useConvexAuth } from 'convex/react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../convex/_generated/api'

export default function LoginPage() {
    const { signIn } = useAuthActions()
    const { isAuthenticated } = useConvexAuth()
    const ensureProfile = useMutation(api.users.ensureProfile)
    const navigate = useNavigate()
    const [mode, setMode] = useState<'login' | 'register'>('login')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    // Once authenticated, create profile and redirect
    useEffect(() => {
        if (isAuthenticated) {
            ensureProfile({}).then(() => {
                navigate('/', { replace: true })
            }).catch(console.error)
        }
    }, [isAuthenticated, ensureProfile, navigate])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            await signIn("password", {
                email,
                password,
                ...(mode === 'register' ? { flow: "signUp", name } : { flow: "signIn" }),
            })
            // Auth state change will trigger the useEffect above
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Authentication failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-card__header">
                    <h1 className="login-card__title">
                        {mode === 'login' ? '🍺 Welcome Back' : '🍺 Join the Party'}
                    </h1>
                    <p className="login-card__subtitle">
                        {mode === 'login'
                            ? 'Sign in to track your predictions'
                            : 'Create an account to save your stats'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {mode === 'register' && (
                        <div className="login-form__field">
                            <label className="login-form__label">Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your name"
                                className="login-form__input"
                                required={mode === 'register'}
                            />
                        </div>
                    )}

                    <div className="login-form__field">
                        <label className="login-form__label">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="login-form__input"
                            required
                        />
                    </div>

                    <div className="login-form__field">
                        <label className="login-form__label">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="login-form__input"
                            required
                            minLength={6}
                        />
                    </div>

                    {error && (
                        <div className="login-form__error">
                            ⚠️ {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn--primary login-form__submit"
                        disabled={loading}
                    >
                        {loading ? '⏳ Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}
                    </button>
                </form>

                <div className="login-card__footer">
                    <button
                        className="login-card__toggle"
                        onClick={() => {
                            setMode(mode === 'login' ? 'register' : 'login')
                            setError('')
                        }}
                    >
                        {mode === 'login'
                            ? "Don't have an account? Sign up"
                            : 'Already have an account? Sign in'}
                    </button>
                </div>
            </div>
        </div>
    )
}

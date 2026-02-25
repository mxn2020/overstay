import { useState } from 'react'
import { useAuthActions } from "@convex-dev/auth/react"

export default function LoginPage() {
    const { signIn } = useAuthActions()
    const [mode, setMode] = useState<'login' | 'register'>('login')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

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

import { useState, useEffect } from 'react'
import { logger } from '../lib/logger'
import { useAuthActions } from "@convex-dev/auth/react"
import { useMutation, useConvexAuth } from 'convex/react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../convex/_generated/api'
import { useTranslation } from 'react-i18next'

import { MissingConfigDialog } from '../components/MissingConfigDialog'
import { Input } from '../components/ui/Input'

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
    const [configError, setConfigError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const { t } = useTranslation()

    // Once authenticated, create profile and redirect
    useEffect(() => {
        if (isAuthenticated) {
            ensureProfile({}).then(() => {
                navigate('/', { replace: true })
            }).catch(logger.error)
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
            const message = err instanceof Error ? err.message : String(err)

            // Check for missing environment variables first
            if (message.includes('Missing environment variable') || message.includes('not configured')) {
                const match = message.match(/`([^`]+)`/) || message.match(/([A-Z_]+)\s+not configured/)
                const keyName = match ? match[1] : 'JWT_PRIVATE_KEY'
                setConfigError(`${keyName} not configured`)
                return
            }

            // Map Convex auth errors to friendly messages
            if (message.includes('InvalidAccountId') || message.includes('Could not find')) {
                setError(t('login.errorNoAccount'))
            } else if (message.includes('InvalidSecret') || message.includes('Invalid password') || message.includes('incorrect password')) {
                setError(t('login.errorWrongPassword'))
            } else if (message.includes('AccountAlreadyExists')) {
                setError(t('login.errorAccountExists'))
            } else if (message.includes('TooManyFailedAttempts')) {
                setError(t('login.errorTooMany'))
            } else {
                setError(t('login.errorGeneric'))
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-page">
            {configError && (
                <MissingConfigDialog
                    message={configError}
                    onClose={() => setConfigError(null)}
                />
            )}
            <div className="login-card">
                <div className="login-card__header">
                    <h1 className="login-card__title">
                        {mode === 'login' ? `🍺 ${t('login.title')}` : `🍺 ${t('login.registerTitle')}`}
                    </h1>
                    <p className="login-card__subtitle">
                        {mode === 'login'
                            ? t('login.subtitle')
                            : t('login.registerSubtitle')}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {mode === 'register' && (
                        <div className="login-form__field">
                            <Input
                                label={t('login.name')}
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your name"
                                required={mode === 'register'}
                            />
                        </div>
                    )}

                    <div className="login-form__field">
                        <Input
                            label={t('login.email')}
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div className="login-form__field">
                        <Input
                            label={t('login.password')}
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
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
                        {loading
                            ? `⏳ ${mode === 'login' ? t('login.signingIn') : t('login.creatingAccount')}`
                            : mode === 'login' ? t('login.signInBtn') : t('login.createAccountBtn')}
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
                            ? `${t('login.noAccount')} ${t('login.signUp')}`
                            : `${t('login.haveAccount')} ${t('login.signIn')}`}
                    </button>
                </div>
            </div>
        </div>
    )
}

import { useQuery, useConvexAuth } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Link } from 'react-router-dom'
import { Settings } from 'lucide-react'

export default function ProfilePage() {
    const { isAuthenticated } = useConvexAuth()
    const me = useQuery(api.users.getMe)

    if (!isAuthenticated || !me) {
        return (
            <div style={{ textAlign: 'center', padding: '64px 16px' }}>
                <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🔮</div>
                <h2 style={{ marginBottom: '12px' }}>Your Night, Tracked</h2>
                <p style={{ color: 'var(--color-smoke-gray)', maxWidth: '400px', margin: '0 auto 32px' }}>
                    Sign up to save your predictions, track your chaos score over time,
                    earn badges, and compete with friends in Beat the AI.
                </p>
                <Link to="/login" className="btn btn--primary">Sign In</Link>
            </div>
        )
    }

    return (
        <div className="profile">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h2>👤 {me.name || 'Anonymous Drinker'}</h2>
                <Link to="/settings" className="btn btn--ghost btn--sm">
                    <Settings size={16} /> Settings
                </Link>
            </div>

            <div className="profile__stats-grid" style={{ marginBottom: '32px' }}>
                <div className="profile__stat-card">
                    <div className="profile__stat-value">{me.justOneLastDrinkScore ?? 0}</div>
                    <div className="profile__stat-label">JustOneLastDrink Score</div>
                </div>
                <div className="profile__stat-card">
                    <div className="profile__stat-value">{me.totalPredictions ?? 0}</div>
                    <div className="profile__stat-label">Predictions</div>
                </div>
                <div className="profile__stat-card">
                    <div className="profile__stat-value">{me.beatTheAiWins ?? 0}</div>
                    <div className="profile__stat-label">AI Beaten</div>
                </div>
                <div className="profile__stat-card">
                    <div className="profile__stat-value">{me.streak ?? 0}</div>
                    <div className="profile__stat-label">Streak</div>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <span className="plan-badge">{(me.plan ?? 'free').toUpperCase()}</span>
                <span style={{ color: 'var(--color-smoke-gray)' }}>
                    {me.email}
                </span>
            </div>

            <p style={{ color: 'var(--color-smoke-gray)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                Member since {new Date(me.createdAt ?? Date.now()).toLocaleDateString()}
            </p>
        </div>
    )
}

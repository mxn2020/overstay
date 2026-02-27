import { useQuery, useConvexAuth } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Link } from 'react-router-dom'
import { Settings, Clock, AlertTriangle, Calendar } from 'lucide-react'
import BadgeDisplay from '../components/BadgeDisplay'
import { Id } from '../../convex/_generated/dataModel'

export default function ProfilePage() {
    const { isAuthenticated } = useConvexAuth()
    const me = useQuery(api.users.getMe)
    const predictions = useQuery(api.predictions.getMyPredictions, {})

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

            <BadgeDisplay userId={me._id as Id<"users">} />

            <div style={{ marginBottom: '40px' }}>
                <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={20} className="text-electric-violet" />
                    Prediction History
                </h3>

                {predictions === undefined ? (
                    <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-smoke-gray)' }}>
                        Loading history...
                    </div>
                ) : predictions.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '32px', background: 'rgba(255,255,255,0.02)' }}>
                        <p style={{ color: 'var(--color-smoke-gray)', marginBottom: '16px' }}>No predictions yet. Time to ruin your tomorrow!</p>
                        <Link to="/" className="btn btn--primary btn--small">Get a Prediction</Link>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {predictions.map((p) => (
                            <div key={p._id} className="card" style={{ padding: '16px', borderLeft: '4px solid var(--color-electric-violet)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{p.exitTime}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-smoke-gray)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Calendar size={12} />
                                        {new Date(p.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <div style={{ fontStyle: 'italic', marginBottom: '12px', fontSize: '0.95rem' }}>
                                    "{p.roastLine}"
                                </div>
                                <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-vapor-white)' }}>
                                        <AlertTriangle size={14} className={p.chaosRating >= 7 ? 'text-hot-red' : ''} />
                                        Chaos: <strong className={p.chaosRating >= 7 ? 'text-hot-red' : ''}>{p.chaosRating.toFixed(1)}/10</strong>
                                    </div>
                                    {p.actualLeaveTime && p.wasAccurate !== undefined && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: p.wasAccurate ? 'var(--color-hot-red)' : 'var(--color-neon-orange)' }}>
                                            {p.wasAccurate ? '🤖 AI Won' : '🏆 You Won'} (Left at {p.actualLeaveTime})
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
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

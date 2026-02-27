import { useQuery, useConvexAuth } from 'convex/react'
import { Link } from 'react-router-dom'
import { api } from '../../convex/_generated/api'

export default function MyWallPage() {
    const { isAuthenticated } = useConvexAuth()
    const predictions = useQuery(api.predictions.getMyPredictions, isAuthenticated ? { limit: 50 } : "skip")

    if (!isAuthenticated) {
        return (
            <div style={{ textAlign: 'center', padding: '64px 16px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔒</div>
                <h2 style={{ marginBottom: '8px' }}>Sign in to see your Wall of Shame</h2>
                <p style={{ color: 'var(--color-smoke-gray)', marginBottom: '24px' }}>
                    Your prediction history is waiting for you.
                </p>
                <Link to="/login" className="btn btn--primary">Sign In</Link>
            </div>
        )
    }

    if (!predictions) {
        return (
            <div style={{ textAlign: 'center', padding: '64px 16px', color: 'var(--color-smoke-gray)' }}>
                Loading your shameful history...
            </div>
        )
    }

    if (predictions.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '64px 16px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🍺</div>
                <h2 style={{ marginBottom: '8px' }}>No predictions yet</h2>
                <p style={{ color: 'var(--color-smoke-gray)', marginBottom: '24px' }}>
                    Upload a photo to get your first prediction and start your Wall of Shame!
                </p>
                <Link to="/" className="btn btn--primary">🔮 Make Your First Prediction</Link>
            </div>
        )
    }

    return (
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 16px' }}>
            <h1 style={{ marginBottom: '4px' }}>🏆 My Wall of Shame</h1>
            <p style={{ color: 'var(--color-smoke-gray)', marginBottom: '32px', fontSize: '0.9rem' }}>
                {predictions.length} prediction{predictions.length !== 1 ? 's' : ''} — relive the chaos.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {predictions.map((p) => {
                    const date = new Date(p.createdAt)
                    const dateStr = date.toLocaleDateString(undefined, {
                        month: 'short', day: 'numeric', year: 'numeric',
                    })
                    const timeStr = date.toLocaleTimeString(undefined, {
                        hour: '2-digit', minute: '2-digit',
                    })

                    return (
                        <div
                            key={p._id}
                            className="card"
                            style={{
                                padding: '20px',
                                background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.04), rgba(0,0,0,0.3))',
                                borderColor: `rgba(249, 115, 22, ${Math.min(0.6, p.chaosRating / 15)})`,
                            }}
                        >
                            {/* Header row */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: '12px',
                            }}>
                                <div>
                                    <div style={{
                                        fontSize: '0.75rem',
                                        color: 'var(--color-smoke-gray)',
                                        opacity: 0.6,
                                        marginBottom: '4px',
                                    }}>
                                        {dateStr} · {timeStr}
                                    </div>
                                    <div style={{
                                        fontSize: '1.1rem',
                                        fontWeight: '700',
                                        color: 'var(--color-neon-amber)',
                                    }}>
                                        Leaving at {p.exitTime}
                                    </div>
                                </div>
                                <div style={{
                                    background: p.chaosRating >= 7
                                        ? 'rgba(239, 68, 68, 0.15)'
                                        : p.chaosRating >= 4
                                            ? 'rgba(249, 115, 22, 0.15)'
                                            : 'rgba(34, 197, 94, 0.15)',
                                    color: p.chaosRating >= 7
                                        ? '#EF4444'
                                        : p.chaosRating >= 4
                                            ? 'var(--color-neon-orange)'
                                            : '#22C55E',
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    fontSize: '0.85rem',
                                    fontWeight: '700',
                                }}>
                                    {p.chaosRating.toFixed(1)}/10
                                </div>
                            </div>

                            {/* Roast line */}
                            <blockquote style={{
                                fontStyle: 'italic',
                                fontSize: '0.95rem',
                                lineHeight: '1.5',
                                color: 'var(--color-vapor-white)',
                                borderLeft: '3px solid var(--color-neon-orange)',
                                paddingLeft: '12px',
                                marginBottom: '12px',
                            }}>
                                "{p.roastLine}"
                            </blockquote>

                            {/* Stats row */}
                            <div style={{
                                display: 'flex',
                                gap: '16px',
                                flexWrap: 'wrap',
                                fontSize: '0.8rem',
                                color: 'var(--color-smoke-gray)',
                            }}>
                                <span>📱 Text regret: {Math.round(p.textRegret)}%</span>
                                <span>🍻 Bar hop: {Math.round(p.barHop)}%</span>
                                <span>😢 Cry risk: {Math.round(p.cryRisk)}%</span>
                                <span>🌅 Sunrise: {p.sunriseRisk}</span>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

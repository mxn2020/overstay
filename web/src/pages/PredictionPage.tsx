import { useRef, useState } from 'react'
import { useConvexAuth, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import PredictionCard from '../components/PredictionCard'
import ShareButtons from '../components/ShareButtons'
import BeatTheAI from '../components/BeatTheAI'
import type { PredictionResult } from '../App'

interface PredictionPageProps {
    prediction: PredictionResult
    onBack: () => void
}

export default function PredictionPage({ prediction, onBack }: PredictionPageProps) {
    const cardRef = useRef<HTMLDivElement>(null)
    const [showBeatAI, setShowBeatAI] = useState(false)
    const [wallShared, setWallShared] = useState(false)
    const [wallSharing, setWallSharing] = useState(false)
    const { isAuthenticated } = useConvexAuth()
    const shareCard = useMutation(api.storyboard.shareCard)

    const handleShareToWall = async () => {
        if (prediction.rejected || wallShared) return
        setWallSharing(true)
        try {
            await shareCard({
                exitTime: prediction.exitTime,
                justOneLastDrinkMinutes: prediction.justOneLastDrinkMinutes,
                chaosRating: prediction.chaosRating,
                textRegret: prediction.textRegret,
                barHop: prediction.barHop,
                cryRisk: prediction.cryRisk,
                sunriseRisk: prediction.sunriseRisk,
                roastLine: prediction.roastLine,
            })
            setWallShared(true)
        } catch (err) {
            console.error('Failed to share to Wall of Fame:', err)
        } finally {
            setWallSharing(false)
        }
    }

    if (prediction.rejected) {
        const isHarmful = prediction.reason === 'harmful'

        if (isHarmful) {
            // 🚫 HARMFUL / NOT ALLOWED
            return (
                <div className="prediction-page" style={{ justifyContent: 'center' }}>
                    <div className="card animate-zoom" style={{
                        textAlign: 'center',
                        borderColor: 'var(--color-hot-red)',
                        padding: '32px',
                        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(0,0,0,0.3))',
                    }}>
                        <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>🚫</div>
                        <h2 style={{
                            color: 'var(--color-hot-red)',
                            marginBottom: '12px',
                            fontSize: '1.5rem',
                            fontWeight: '800',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                        }}>
                            Not Allowed
                        </h2>
                        <p style={{
                            fontSize: '1rem',
                            marginBottom: '24px',
                            lineHeight: '1.6',
                            color: 'var(--color-smoke-gray)',
                        }}>
                            This image was flagged as inappropriate. Keep it classy — this app is for fun nights out, not whatever that was.
                        </p>
                        <button className="btn btn--primary" onClick={onBack}>
                            Try a Different Photo
                        </button>
                    </div>
                </div>
            )
        }

        // 🔥 ROAST — Funny rejection
        return (
            <div className="prediction-page" style={{ justifyContent: 'center' }}>
                <div className="card animate-zoom" style={{
                    textAlign: 'center',
                    borderColor: 'var(--color-neon-orange)',
                    padding: '32px',
                    background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.08), rgba(0,0,0,0.3))',
                }}>
                    <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>🔥</div>
                    <h2 style={{
                        color: 'var(--color-neon-orange)',
                        marginBottom: '8px',
                        fontSize: '1.4rem',
                        fontWeight: '800',
                    }}>
                        AI Roast Incoming
                    </h2>
                    <p style={{
                        fontSize: '0.85rem',
                        color: 'var(--color-smoke-gray)',
                        marginBottom: '16px',
                    }}>
                        Our AI bouncer took one look and said:
                    </p>
                    <blockquote style={{
                        fontSize: '1.15rem',
                        fontStyle: 'italic',
                        marginBottom: '24px',
                        lineHeight: '1.5',
                        color: 'var(--color-vapor-white)',
                        borderLeft: '3px solid var(--color-neon-orange)',
                        paddingLeft: '16px',
                        textAlign: 'left',
                    }}>
                        "{prediction.rejectReason}"
                    </blockquote>
                    <p style={{
                        fontSize: '0.85rem',
                        color: 'var(--color-smoke-gray)',
                        marginBottom: '20px',
                    }}>
                        Upload a photo of an actual night out and we'll predict your fate. 🍺
                    </p>
                    <button className="btn btn--primary" onClick={onBack}>
                        Try Another Image
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="prediction-page">
            <PredictionCard prediction={prediction} cardRef={cardRef} />

            <ShareButtons prediction={prediction} cardRef={cardRef} />

            {/* Primary actions */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                alignItems: 'center',
                width: '100%',
                maxWidth: '420px',
            }}>
                {/* New Prediction — most prominent */}
                <button
                    className="btn btn--primary"
                    onClick={onBack}
                    style={{
                        width: '100%',
                        padding: '14px 24px',
                        fontSize: '1.05rem',
                        fontWeight: '700',
                    }}
                >
                    🔮 New Prediction
                </button>

                {/* Share to Wall of Fame */}
                {isAuthenticated && (
                    <button
                        className={`btn ${wallShared ? 'btn--ghost' : 'btn--secondary'}`}
                        onClick={handleShareToWall}
                        disabled={wallShared || wallSharing}
                        style={{ width: '100%' }}
                    >
                        {wallShared
                            ? '✅ Shared to Wall of Fame!'
                            : wallSharing
                                ? '⏳ Sharing...'
                                : '🏆 Share to Wall of Fame'}
                    </button>
                )}

                {/* Beat the AI */}
                {!showBeatAI && (
                    <button
                        className="btn btn--secondary"
                        onClick={() => setShowBeatAI(true)}
                        style={{ width: '100%' }}
                    >
                        💪 Beat the AI
                    </button>
                )}
            </div>

            {showBeatAI && (
                <div className="card animate-fade-in" style={{ maxWidth: '420px', width: '100%' }}>
                    <BeatTheAI prediction={prediction} />
                </div>
            )}
        </div>
    )
}

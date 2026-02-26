import { useRef, useState } from 'react'
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                {!showBeatAI && (
                    <button
                        className="btn btn--secondary"
                        onClick={() => setShowBeatAI(true)}
                    >
                        💪 Beat the AI
                    </button>
                )}

                <button className="btn btn--ghost" onClick={onBack}>
                    🔮 New Prediction
                </button>
            </div>

            {showBeatAI && (
                <div className="card animate-fade-in" style={{ maxWidth: '420px', width: '100%' }}>
                    <BeatTheAI prediction={prediction} />
                </div>
            )}
        </div>
    )
}

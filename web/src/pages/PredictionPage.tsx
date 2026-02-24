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
        return (
            <div className="prediction-page" style={{ justifyContent: 'center' }}>
                <div className="card animate-zoom" style={{ textAlign: 'center', borderColor: 'var(--color-neon-orange)', padding: '24px' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🛑</div>
                    <h2 style={{ color: 'var(--color-neon-orange)', marginBottom: '12px', fontSize: '1.5rem', fontWeight: '800' }}>
                        ACCESS DENIED
                    </h2>
                    <p style={{ fontSize: '1.1rem', marginBottom: '24px', lineHeight: '1.5', color: 'var(--color-vapor-white)' }}>
                        "{prediction.rejectReason}"
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

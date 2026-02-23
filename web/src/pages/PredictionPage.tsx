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

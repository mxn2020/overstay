import { useState } from 'react'
import PhotoUpload from '../components/PhotoUpload'
import LoadingScreen from '../components/LoadingScreen'
import type { PredictionResult } from '../App'

interface LandingPageProps {
    onPredict: (result: PredictionResult) => void
    useConvex: boolean
}

export default function LandingPage({ onPredict, useConvex }: LandingPageProps) {
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [showUpload, setShowUpload] = useState(false)

    const handleUploadComplete = (result: PredictionResult) => {
        setIsAnalyzing(false)
        setShowUpload(false)
        onPredict(result)
    }

    const handleAnalysisStart = () => {
        setIsAnalyzing(true)
    }

    if (isAnalyzing) {
        return <LoadingScreen />
    }

    if (showUpload) {
        return (
            <div className="container container--narrow" style={{ padding: '48px 16px' }}>
                <div className="animate-fade-in">
                    <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>Upload Your Night</h2>
                    <p style={{ textAlign: 'center', color: 'var(--color-smoke-gray)', marginBottom: '32px' }}>
                        Bar selfie? Group shot? Table of drinks? We'll read the vibes.
                    </p>
                    <PhotoUpload
                        onAnalysisStart={handleAnalysisStart}
                        onResult={handleUploadComplete}
                        useConvex={useConvex}
                    />
                    <div style={{ textAlign: 'center', marginTop: '24px' }}>
                        <button className="btn btn--ghost" onClick={() => setShowUpload(false)}>
                            ← Back
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <section className="hero">
            <div className="hero__content">
                <p className="hero__tagline animate-fade-in">The Nightlife Oracle</p>
                <h1 className="hero__title animate-fade-in-delay-1">
                    "Just one last drink."
                </h1>
                <p className="hero__subtitle animate-fade-in-delay-2">
                    Upload a night-out photo. Our AI analyzes the vibes and predicts how long you'll
                    <em> actually</em> stay — because we both know <strong>"just one last drink"</strong> is always a lie.
                </p>
                <div className="hero__cta animate-fade-in-delay-3">
                    <button className="btn btn--primary btn--large" onClick={() => setShowUpload(true)}>
                        🔮 Predict My Night
                    </button>
                </div>

                {/* Demo Prediction Card */}
                <div className="demo-card animate-fade-in-delay-3">
                    <div className="demo-card__time-icon">🍺</div>
                    <div className="demo-card__time">2:47 AM</div>
                    <div className="demo-card__roast">
                        You said "last one" at 9:15 PM. That was a lie.
                    </div>
                    <div className="demo-card__divider" />
                    <div className="stat">
                        <span className="stat__label">Chaos Rating</span>
                        <span className="stat__value stat__value--pink">8.6/10</span>
                    </div>
                    <div className="stat">
                        <span className="stat__label">Text Regret</span>
                        <span className="stat__value stat__value--amber">74%</span>
                    </div>
                    <div className="stat">
                        <span className="stat__label">Bar-Hop</span>
                        <span className="stat__value">61%</span>
                    </div>
                    <div className="stat">
                        <span className="stat__label">Sunrise Risk</span>
                        <span className="stat__value">
                            <span className="risk-badge risk-badge--high">🔴 HIGH</span>
                        </span>
                    </div>
                    <div className="demo-card__divider" />
                    <div className="demo-card__footer">justonelastdrink.com</div>
                </div>
            </div>
        </section>
    )
}

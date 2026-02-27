import type { SuccessPrediction } from '../App'
import { useCountUp } from '../lib/useCountUp'

interface PredictionCardProps {
    prediction: SuccessPrediction
    cardRef?: React.RefObject<HTMLDivElement | null>
}

function getSunriseRiskClass(risk: string) {
    switch (risk) {
        case 'LOW': return 'risk-badge--low'
        case 'MEDIUM': return 'risk-badge--medium'
        case 'HIGH': return 'risk-badge--high'
        case 'CERTAIN': return 'risk-badge--certain'
        default: return 'risk-badge--low'
    }
}

function getSunriseEmoji(risk: string) {
    switch (risk) {
        case 'LOW': return '🟢'
        case 'MEDIUM': return '🟡'
        case 'HIGH': return '🔴'
        case 'CERTAIN': return '💀'
        default: return '🟢'
    }
}

function getStatColor(value: number): string {
    if (value >= 75) return 'stat__value--red'
    if (value >= 50) return 'stat__value--amber'
    if (value >= 25) return 'stat__value--pink'
    return 'stat__value--green'
}

export default function PredictionCard({ prediction, cardRef }: PredictionCardProps) {
    // Animated count-up values
    const animChaos = useCountUp(prediction.chaosRating, 1200, 1)
    const animTextRegret = useCountUp(prediction.textRegret, 1000)
    const animBarHop = useCountUp(prediction.barHop, 1000)
    const animCryRisk = useCountUp(prediction.cryRisk, 1000)

    return (
        <div className="prediction-card" ref={cardRef}>
            {prediction.imageUrl && (
                <div
                    className="prediction-card__bg"
                    style={{ backgroundImage: `url(${prediction.imageUrl})` }}
                />
            )}
            <div className="prediction-card__content">
                <div className="prediction-card__icon">🍺</div>
                <div className="prediction-card__exit-time animate-fade-in">
                    {prediction.exitTime}
                </div>
                <div className="prediction-card__roast animate-fade-in-delay-1">
                    {prediction.roastLine}
                </div>

                <div className="prediction-card__divider" />

                <div className="prediction-card__stats animate-fade-in-delay-2">
                    <div className="stat">
                        <span className="stat__label">Chaos Rating</span>
                        <span className={`stat__value ${animChaos >= 7 ? 'stat__value--pink' : animChaos >= 5 ? 'stat__value--amber' : ''}`}>
                            {animChaos.toFixed(1)}/10
                        </span>
                    </div>
                    <div className="stat">
                        <span className="stat__label">Text Regret</span>
                        <span className={`stat__value ${getStatColor(animTextRegret)}`}>
                            {animTextRegret}%
                        </span>
                    </div>
                    <div className="stat">
                        <span className="stat__label">Bar-Hop</span>
                        <span className={`stat__value ${getStatColor(animBarHop)}`}>
                            {animBarHop}%
                        </span>
                    </div>
                    <div className="stat">
                        <span className="stat__label">Cry Risk</span>
                        <span className={`stat__value ${getStatColor(animCryRisk)}`}>
                            {animCryRisk}%
                        </span>
                    </div>
                    <div className="stat">
                        <span className="stat__label">Sunrise Risk</span>
                        <span className="stat__value">
                            <span className={`risk-badge ${getSunriseRiskClass(prediction.sunriseRisk)}`}>
                                {getSunriseEmoji(prediction.sunriseRisk)} {prediction.sunriseRisk}
                            </span>
                        </span>
                    </div>
                </div>

                <div className="prediction-card__divider" />
                <div className="prediction-card__watermark">justonelastdrink.com</div>
                <div className="prediction-card__responsible">
                    Drink responsibly. Know your limits. 🍺
                </div>
            </div>
        </div>
    )
}

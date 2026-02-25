import { useState } from 'react'
import type { SuccessPrediction } from '../App'

const WIN_MESSAGES = [
    "You actually left? We're impressed. And a little disappointed.",
    "Self-control unlocked. How boring.",
    "Fine, you win. But we both know this is rare.",
    "Go ahead, feel responsible. We'll be here next time.",
]

const LOSE_MESSAGES = [
    "Called it. You're as predictable as a 2 AM kebab.",
    "We told you. You didn't listen. Classic.",
    "The AI remains undefeated. You remain hungover.",
    "We don't want to say 'we told you so.' But we told you so.",
]

interface BeatTheAIProps {
    prediction: SuccessPrediction
}

export default function BeatTheAI({ prediction }: BeatTheAIProps) {
    const [actualTime, setActualTime] = useState('')
    const [result, setResult] = useState<{ won: boolean; message: string } | null>(null)

    const handleSubmit = () => {
        if (!actualTime) return

        // Simple time comparison: parse the prediction exit time and compare
        const predictedMinutes = parseTimeToMinutes(prediction.exitTime)
        const actualMinutes = parseTimeToMinutes(actualTime)

        const won = actualMinutes < predictedMinutes

        const messages = won ? WIN_MESSAGES : LOSE_MESSAGES
        const message = messages[Math.floor(Math.random() * messages.length)]

        setResult({ won, message })
    }

    return (
        <div className="beat-ai">
            <h3 style={{ marginBottom: '8px' }}>💪 Beat the AI</h3>
            <p style={{ color: 'var(--color-smoke-gray)', fontSize: '0.9rem', marginBottom: '4px' }}>
                AI predicted: <strong style={{ color: 'var(--color-electric-violet)' }}>{prediction.exitTime}</strong>
            </p>
            <p style={{ color: 'var(--color-smoke-gray)', fontSize: '0.85rem' }}>
                When did you actually leave?
            </p>

            {!result ? (
                <>
                    <div className="beat-ai__input-group">
                        <input
                            type="time"
                            className="beat-ai__input"
                            value={actualTime}
                            onChange={(e) => setActualTime(e.target.value)}
                            placeholder="HH:MM"
                        />
                        <button className="btn btn--primary btn--small" onClick={handleSubmit}>
                            Submit
                        </button>
                    </div>
                </>
            ) : (
                <div
                    className={`beat-ai__result ${result.won ? 'beat-ai__result--win' : 'beat-ai__result--lose'} animate-fade-in`}
                >
                    <p style={{ fontSize: '2rem', marginBottom: '8px' }}>
                        {result.won ? '🏆' : '🤖'}
                    </p>
                    <p style={{ fontWeight: 600, marginBottom: '8px' }}>
                        {result.won ? 'You beat the AI!' : 'AI wins!'}
                    </p>
                    <p style={{ fontStyle: 'italic', color: 'var(--color-smoke-gray)' }}>
                        "{result.message}"
                    </p>
                </div>
            )}
        </div>
    )
}

function parseTimeToMinutes(time: string): number {
    // Handle "2:47 AM" format
    const amPmMatch = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
    if (amPmMatch) {
        let hours = parseInt(amPmMatch[1])
        const minutes = parseInt(amPmMatch[2])
        const period = amPmMatch[3].toUpperCase()
        if (period === 'PM' && hours !== 12) hours += 12
        if (period === 'AM' && hours === 12) hours = 0
        return hours * 60 + minutes
    }

    // Handle "HH:MM" 24h format
    const match = time.match(/(\d{1,2}):(\d{2})/)
    if (match) {
        return parseInt(match[1]) * 60 + parseInt(match[2])
    }

    return 0
}

import { useState, useEffect } from 'react'

const LOADING_MESSAGES = [
    "Analyzing your poor decisions…",
    "Calculating tomorrow's regret…",
    "Consulting the chaos oracle…",
    "Detecting vibes… and lies…",
    "Cross-referencing with your search history…",
    "Scanning for bad ideas…",
    "Your future self is already disappointed…",
    "Predicting the unpredictable…",
    "Running chaos algorithms…",
    "This photo has a lot of red flags. We love it.",
]

export default function LoadingScreen() {
    const [messageIndex, setMessageIndex] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length)
        }, 2500)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="loading" style={{ minHeight: '60vh' }}>
            <div className="loading__spinner" />
            <p className="loading__text" key={messageIndex}>
                {LOADING_MESSAGES[messageIndex]}
            </p>
        </div>
    )
}

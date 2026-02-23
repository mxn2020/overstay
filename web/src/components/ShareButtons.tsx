import { useCallback } from 'react'
import type { PredictionResult } from '../App'

interface ShareButtonsProps {
    prediction: PredictionResult
    cardRef: React.RefObject<HTMLDivElement | null>
}

export default function ShareButtons({ prediction, cardRef }: ShareButtonsProps) {
    const shareText = `The AI predicted I'm not leaving until ${prediction.exitTime} 🕐 My chaos rating is ${prediction.chaosRating.toFixed(1)}/10`

    const handleDownload = useCallback(async () => {
        if (!cardRef.current) return
        try {
            const { default: html2canvas } = await import('html2canvas')
            const canvas = await html2canvas(cardRef.current, {
                backgroundColor: '#0A0A0F',
                scale: 2,
            })
            const link = document.createElement('a')
            link.download = `overstay-prediction-${Date.now()}.png`
            link.href = canvas.toDataURL('image/png')
            link.click()
        } catch (err) {
            console.error('Download failed:', err)
        }
    }, [cardRef])

    const handleNativeShare = useCallback(async () => {
        if (navigator.share) {
            try {
                // Try to share with image
                if (cardRef.current) {
                    const { default: html2canvas } = await import('html2canvas')
                    const canvas = await html2canvas(cardRef.current, {
                        backgroundColor: '#0A0A0F',
                        scale: 2,
                    })
                    const blob = await new Promise<Blob>((resolve) =>
                        canvas.toBlob((b) => resolve(b!), 'image/png')
                    )
                    const file = new File([blob], 'overstay-prediction.png', { type: 'image/png' })
                    await navigator.share({
                        title: 'Overstay Prediction',
                        text: shareText,
                        url: 'https://overstay.app',
                        files: [file],
                    })
                }
            } catch {
                // Fallback to text-only share
                try {
                    await navigator.share({
                        title: 'Overstay Prediction',
                        text: shareText,
                        url: 'https://overstay.app',
                    })
                } catch {
                    // User cancelled
                }
            }
        }
    }, [cardRef, shareText])

    const handleTwitter = () => {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText + ' @overstayapp')}&url=${encodeURIComponent('https://overstay.app')}`
        window.open(url, '_blank')
    }

    return (
        <div className="share-buttons animate-fade-in-delay-3">
            <button className="btn btn--secondary btn--small" onClick={handleDownload}>
                📥 Download
            </button>

            {navigator.share && (
                <button className="btn btn--primary btn--small" onClick={handleNativeShare}>
                    📤 Share
                </button>
            )}

            <button className="btn btn--secondary btn--small" onClick={handleTwitter}>
                𝕏 Post
            </button>
        </div>
    )
}

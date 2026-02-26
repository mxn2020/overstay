import { useState, useEffect } from 'react'
import { Shield, X } from 'lucide-react'

const CONSENT_KEY = 'cookie_consent'

export default function CookieBanner() {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const consent = localStorage.getItem(CONSENT_KEY)
        if (!consent) {
            // Small delay so it doesn't flash immediately
            const timer = setTimeout(() => setVisible(true), 1500)
            return () => clearTimeout(timer)
        }
    }, [])

    const handleAccept = () => {
        localStorage.setItem(CONSENT_KEY, 'accepted')
        setVisible(false)
    }

    const handleDecline = () => {
        localStorage.setItem(CONSENT_KEY, 'declined')
        setVisible(false)
    }

    if (!visible) return null

    return (
        <div className="cookie-banner">
            <div className="cookie-banner__content">
                <div className="cookie-banner__icon">
                    <Shield size={20} />
                </div>
                <div className="cookie-banner__text">
                    <p>
                        We use cookies and local storage to improve your experience, remember your language preference,
                        and keep you signed in. No tracking, no ads.
                    </p>
                </div>
                <div className="cookie-banner__actions">
                    <button className="btn btn--primary btn--small" onClick={handleAccept}>
                        Accept
                    </button>
                    <button className="btn btn--ghost btn--small" onClick={handleDecline}>
                        Decline
                    </button>
                </div>
                <button className="cookie-banner__close" onClick={handleDecline} aria-label="Close">
                    <X size={16} />
                </button>
            </div>
        </div>
    )
}

import { useQuery, useMutation } from 'convex/react'
import { useConvexAuth } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Heart, Eye, EyeOff, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function StoryboardPage() {
    const { t } = useTranslation()
    const { isAuthenticated } = useConvexAuth()
    const publicCards = useQuery(api.storyboard.getPublicCards, { limit: 50 })
    const myCards = useQuery(api.storyboard.getMyCards)
    const likeCard = useMutation(api.storyboard.likeCard)
    const toggleVisibility = useMutation(api.storyboard.toggleCardVisibility)
    const deleteCard = useMutation(api.storyboard.deleteCard)

    const formatTime = (ts: number) => {
        const d = new Date(ts)
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
            d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    return (
        <div className="storyboard-page">
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h1>🎭 {t('storyboard.title')}</h1>
                <p style={{ color: 'var(--color-smoke-gray)', marginTop: '8px' }}>
                    {t('storyboard.subtitle')}
                </p>
            </div>

            {/* My Cards (if logged in) */}
            {isAuthenticated && myCards && myCards.length > 0 && (
                <div style={{ marginBottom: '48px' }}>
                    <h2 style={{ marginBottom: '16px' }}>📌 {t('storyboard.myCards')}</h2>
                    <div className="storyboard-grid">
                        {myCards.map((card) => (
                            <div key={card._id} className={`storyboard-card storyboard-card--mine ${!card.isPublic ? 'storyboard-card--private' : ''}`}>
                                <div className="storyboard-card__header">
                                    <span className="storyboard-card__name">{card.userName ?? 'You'}</span>
                                    <div className="storyboard-card__actions">
                                        <button
                                            className="btn btn--ghost btn--icon"
                                            onClick={() => toggleVisibility({ cardId: card._id })}
                                            title={card.isPublic ? t('storyboard.makePrivate') : t('storyboard.makePublic')}
                                        >
                                            {card.isPublic ? <Eye size={16} /> : <EyeOff size={16} />}
                                        </button>
                                        <button
                                            className="btn btn--ghost btn--icon btn--danger"
                                            onClick={() => { if (confirm(t('storyboard.deleteConfirm'))) deleteCard({ cardId: card._id }) }}
                                            title={t('common.delete')}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <StoryboardCardContent card={card} />
                                <div className="storyboard-card__footer">
                                    <span>{card.isPublic ? `🌍 ${t('storyboard.public')}` : `🔒 ${t('storyboard.private')}`}</span>
                                    <span>❤️ {card.likes}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Public Feed */}
            <h2 style={{ marginBottom: '16px' }}>🔥 {t('storyboard.latestCards')}</h2>
            <div className="storyboard-grid">
                {publicCards && publicCards.length > 0 ? publicCards.map((card) => (
                    <div key={card._id} className="storyboard-card">
                        <div className="storyboard-card__header">
                            <span className="storyboard-card__name">{card.userName ?? 'Anonymous'}</span>
                            <span className="storyboard-card__time">{formatTime(card.sharedAt)}</span>
                        </div>
                        <StoryboardCardContent card={card} />
                        <div className="storyboard-card__footer">
                            <button
                                className="btn btn--ghost storyboard-card__like"
                                onClick={() => likeCard({ cardId: card._id })}
                            >
                                <Heart size={16} /> {card.likes}
                            </button>
                        </div>
                    </div>
                )) : (
                    <p style={{ color: 'var(--color-smoke-gray)', textAlign: 'center', gridColumn: '1 / -1' }}>
                        {t('storyboard.noCards')}
                    </p>
                )}
            </div>
        </div>
    )
}

function StoryboardCardContent({ card }: { card: any }) {
    return (
        <div className="storyboard-card__content">
            <div className="storyboard-card__prediction">
                <div className="storyboard-card__stat">
                    <span className="storyboard-card__stat-label">Exit Time</span>
                    <span className="storyboard-card__stat-value">{card.exitTime}</span>
                </div>
                <div className="storyboard-card__stat">
                    <span className="storyboard-card__stat-label">JustOneLastDrink</span>
                    <span className="storyboard-card__stat-value">+{card.justOneLastDrinkMinutes}min</span>
                </div>
                <div className="storyboard-card__stat">
                    <span className="storyboard-card__stat-label">Chaos</span>
                    <span className="storyboard-card__stat-value">{card.chaosRating}/10</span>
                </div>
            </div>
            <div className="storyboard-card__roast">
                "{card.roastLine}"
            </div>
        </div>
    )
}

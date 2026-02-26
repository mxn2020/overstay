import { useQuery, useMutation } from 'convex/react'
import { useConvexAuth } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Heart, Eye, EyeOff, Trash2 } from 'lucide-react'

export default function StoryboardPage() {
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
                <h1>🎭 The Wall of Shame</h1>
                <p style={{ color: 'var(--color-smoke-gray)', marginTop: '8px' }}>
                    See what happens when people say "just one last drink"
                </p>
            </div>

            {/* My Cards (if logged in) */}
            {isAuthenticated && myCards && myCards.length > 0 && (
                <div style={{ marginBottom: '48px' }}>
                    <h2 style={{ marginBottom: '16px' }}>📌 My Shared Cards</h2>
                    <div className="storyboard-grid">
                        {myCards.map((card) => (
                            <div key={card._id} className={`storyboard-card storyboard-card--mine ${!card.isPublic ? 'storyboard-card--private' : ''}`}>
                                <div className="storyboard-card__header">
                                    <span className="storyboard-card__name">{card.userName ?? 'You'}</span>
                                    <div className="storyboard-card__actions">
                                        <button
                                            className="btn btn--ghost btn--icon"
                                            onClick={() => toggleVisibility({ cardId: card._id })}
                                            title={card.isPublic ? 'Make private' : 'Make public'}
                                        >
                                            {card.isPublic ? <Eye size={16} /> : <EyeOff size={16} />}
                                        </button>
                                        <button
                                            className="btn btn--ghost btn--icon btn--danger"
                                            onClick={() => { if (confirm('Delete this card?')) deleteCard({ cardId: card._id }) }}
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <StoryboardCardContent card={card} />
                                <div className="storyboard-card__footer">
                                    <span>{card.isPublic ? '🌍 Public' : '🔒 Private'}</span>
                                    <span>❤️ {card.likes}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Public Feed */}
            <h2 style={{ marginBottom: '16px' }}>🔥 Latest Cards</h2>
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
                        No cards shared yet. Be the first to share your prediction! 🎉
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
                    <span className="storyboard-card__stat-label">Overstay</span>
                    <span className="storyboard-card__stat-value">+{card.overstayMinutes}min</span>
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

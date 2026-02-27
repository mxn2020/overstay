import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'
import { BADGE_DEFINITIONS } from '../lib/BadgeDefinitions'

interface BadgeDisplayProps {
    userId: Id<"users">
}

export default function BadgeDisplay({ userId }: BadgeDisplayProps) {
    const earnedBadgesRaw = useQuery(api.badges.getByUser, { userId })

    // Create a set of earned badge types for O(1) lookup
    const earnedBadgeTypes = new Set(earnedBadgesRaw?.map(b => b.badgeType) || [])

    const allBadges = Object.values(BADGE_DEFINITIONS)

    return (
        <div style={{ marginBottom: '40px' }}>
            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🏆 Badges
            </h3>

            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                background: 'rgba(255,255,255,0.02)',
                padding: '24px',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.05)'
            }}>
                {allBadges.map((badge) => {
                    const isEarned = earnedBadgeTypes.has(badge.id)
                    return (
                        <div
                            key={badge.id}
                            title={badge.description}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 16px',
                                borderRadius: '100px',
                                background: isEarned ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.03)',
                                border: `1px solid ${isEarned ? 'rgba(139, 92, 246, 0.4)' : 'transparent'}`,
                                opacity: isEarned ? 1 : 0.4,
                                filter: isEarned ? 'none' : 'grayscale(100%)',
                                cursor: 'help',
                                transition: 'all 0.2s',
                            }}
                        >
                            <span style={{ fontSize: '1.2rem' }}>{badge.emoji}</span>
                            <span style={{ fontWeight: isEarned ? 600 : 400, fontSize: '0.9rem' }}>
                                {badge.name}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export interface BadgeDefinition {
    id: string
    emoji: string
    name: string
    description: string
}

export const BADGE_DEFINITIONS: Record<string, BadgeDefinition> = {
    first_prediction: {
        id: 'first_prediction',
        emoji: '🍺',
        name: 'First Sip',
        description: 'You got your first prediction. The night is young.',
    },
    beat_the_ai_3: {
        id: 'beat_the_ai_3',
        emoji: '🤖',
        name: 'AI Slayer',
        description: 'You beat the AI 3 times. Your self-control is unmatched.',
    },
    chaos_9: {
        id: 'chaos_9',
        emoji: '🌪️',
        name: 'Agent of Chaos',
        description: 'You received a chaos rating of 9.0 or higher. Seek help.',
    },
    night_owl: {
        id: 'night_owl',
        emoji: '🦉',
        name: 'Night Owl',
        description: 'Predicted to stay out past 4:00 AM.',
    },
    streak_5: {
        id: 'streak_5',
        emoji: '🔥',
        name: 'On a Roll',
        description: 'Hit a 5-day prediction streak without missing.',
    },
}

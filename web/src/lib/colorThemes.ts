// Dynamic color theme system — "You were too drunk to remember the last color"
// Each visit/refresh gets a random accent color theme

export interface ColorTheme {
    name: string
    accent: string
    accentLight: string
    accentGlow: string
    accentRgb: string
    gradientCard: string
    gradientGlow: string
}

const THEMES: ColorTheme[] = [
    {
        name: 'violet',
        accent: '#8B5CF6',
        accentLight: '#9d6ff8',
        accentGlow: 'rgba(139, 92, 246, 0.3)',
        accentRgb: '139, 92, 246',
        gradientCard: 'linear-gradient(135deg, #1A0A2E 0%, #0A0A0F 100%)',
        gradientGlow: 'radial-gradient(ellipse at 50% 0%, rgba(139, 92, 246, 0.15) 0%, transparent 60%)',
    },
    {
        name: 'blue',
        accent: '#3B82F6',
        accentLight: '#60A5FA',
        accentGlow: 'rgba(59, 130, 246, 0.3)',
        accentRgb: '59, 130, 246',
        gradientCard: 'linear-gradient(135deg, #0A1628 0%, #0A0A0F 100%)',
        gradientGlow: 'radial-gradient(ellipse at 50% 0%, rgba(59, 130, 246, 0.15) 0%, transparent 60%)',
    },
    {
        name: 'emerald',
        accent: '#10B981',
        accentLight: '#34D399',
        accentGlow: 'rgba(16, 185, 129, 0.3)',
        accentRgb: '16, 185, 129',
        gradientCard: 'linear-gradient(135deg, #0A2018 0%, #0A0A0F 100%)',
        gradientGlow: 'radial-gradient(ellipse at 50% 0%, rgba(16, 185, 129, 0.15) 0%, transparent 60%)',
    },
    {
        name: 'amber',
        accent: '#F59E0B',
        accentLight: '#FBBF24',
        accentGlow: 'rgba(245, 158, 11, 0.3)',
        accentRgb: '245, 158, 11',
        gradientCard: 'linear-gradient(135deg, #1E1505 0%, #0A0A0F 100%)',
        gradientGlow: 'radial-gradient(ellipse at 50% 0%, rgba(245, 158, 11, 0.15) 0%, transparent 60%)',
    },
    {
        name: 'rose',
        accent: '#F43F5E',
        accentLight: '#FB7185',
        accentGlow: 'rgba(244, 63, 94, 0.3)',
        accentRgb: '244, 63, 94',
        gradientCard: 'linear-gradient(135deg, #200A10 0%, #0A0A0F 100%)',
        gradientGlow: 'radial-gradient(ellipse at 50% 0%, rgba(244, 63, 94, 0.15) 0%, transparent 60%)',
    },
    {
        name: 'cyan',
        accent: '#06B6D4',
        accentLight: '#22D3EE',
        accentGlow: 'rgba(6, 182, 212, 0.3)',
        accentRgb: '6, 182, 212',
        gradientCard: 'linear-gradient(135deg, #051E22 0%, #0A0A0F 100%)',
        gradientGlow: 'radial-gradient(ellipse at 50% 0%, rgba(6, 182, 212, 0.15) 0%, transparent 60%)',
    },
    {
        name: 'fuchsia',
        accent: '#D946EF',
        accentLight: '#E879F9',
        accentGlow: 'rgba(217, 70, 239, 0.3)',
        accentRgb: '217, 70, 239',
        gradientCard: 'linear-gradient(135deg, #1E0A24 0%, #0A0A0F 100%)',
        gradientGlow: 'radial-gradient(ellipse at 50% 0%, rgba(217, 70, 239, 0.15) 0%, transparent 60%)',
    },
    {
        name: 'lime',
        accent: '#84CC16',
        accentLight: '#A3E635',
        accentGlow: 'rgba(132, 204, 22, 0.3)',
        accentRgb: '132, 204, 22',
        gradientCard: 'linear-gradient(135deg, #121E05 0%, #0A0A0F 100%)',
        gradientGlow: 'radial-gradient(ellipse at 50% 0%, rgba(132, 204, 22, 0.15) 0%, transparent 60%)',
    },
]

export function getRandomTheme(): ColorTheme {
    return THEMES[Math.floor(Math.random() * THEMES.length)]
}

export function applyTheme(theme: ColorTheme): void {
    const root = document.documentElement

    root.style.setProperty('--color-electric-violet', theme.accent)
    root.style.setProperty('--color-accent-light', theme.accentLight)
    root.style.setProperty('--color-accent-glow', theme.accentGlow)
    root.style.setProperty('--color-accent-rgb', theme.accentRgb)
    root.style.setProperty('--gradient-card', theme.gradientCard)
    root.style.setProperty('--gradient-glow', `radial-gradient(circle, ${theme.accentGlow}, transparent)`)
    root.style.setProperty('--gradient-hero', theme.gradientGlow)

    // Store so we know which was used (not that you'll remember)
    root.setAttribute('data-theme', theme.name)
}

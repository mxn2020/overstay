import posthog from 'posthog-js'

let initialized = false

/**
 * Initialise PostHog analytics.
 * No-ops gracefully when `VITE_POSTHOG_KEY` is not set.
 */
export function initAnalytics(): void {
    const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined
    const host = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) || 'https://us.i.posthog.com'

    if (!key) {
        console.info('[Analytics] PostHog key not set — analytics disabled')
        return
    }

    posthog.init(key, {
        api_host: host,
        autocapture: true,
        capture_pageview: true,
        persistence: 'localStorage+cookie',
    })
    initialized = true
}

/** Track a custom event. */
export function trackEvent(name: string, props?: Record<string, unknown>): void {
    if (!initialized) return
    posthog.capture(name, props)
}

/** Identify the current user (call after auth). */
export function identifyUser(id: string, traits?: Record<string, unknown>): void {
    if (!initialized) return
    posthog.identify(id, traits)
}

/** Reset identity on sign-out. */
export function resetAnalytics(): void {
    if (!initialized) return
    posthog.reset()
}

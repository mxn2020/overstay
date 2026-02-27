import { useState, useEffect } from 'react'
import { logger } from './logger'

export type Currency = 'usd' | 'eur'

// List of European country codes that use Euro or where Euro pricing makes sense for us
const EU_COUNTRY_CODES = [
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR',
    'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
    // also adding UK/CH etc out of convenience, assuming we show them EUR instead of USD
    'GB', 'CH', 'NO', 'IS'
]

// Timezones that indicate Europe
const EU_TIMEZONES = [
    'Europe/',
    'Atlantic/Canary',
    'Atlantic/Faeroe',
    'Atlantic/Madeira',
    'Atlantic/Reykjavik'
]

export function useDetectCurrency(): Currency {
    const [currency, setCurrency] = useState<Currency>('usd')

    useEffect(() => {
        try {
            // 1. Try timezone detection first (most reliable without location permission)
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
            if (tz) {
                const isEuTz = EU_TIMEZONES.some(euTz => tz.startsWith(euTz))
                if (isEuTz) {
                    setCurrency('eur')
                    logger.log(`[Currency] Detected EUR via timezone: ${tz}`)
                    return
                }
            }

            // 2. Try locale parsing as fallback (less reliable, e.g. en-US uses USD but might be in Europe)
            const locale = navigator.language // e.g. "en-GB", "de-DE"
            if (locale && locale.includes('-')) {
                const countryCode = locale.split('-')[1].toUpperCase()
                if (EU_COUNTRY_CODES.includes(countryCode)) {
                    setCurrency('eur')
                    logger.log(`[Currency] Detected EUR via locale: ${locale}`)
                    return
                }
            }

            logger.log(`[Currency] Defaulting to USD (tz: ${tz}, loc: ${navigator.language})`)
        } catch (err) {
            logger.warn('[Currency] Failed to detect currency, defaulting to USD', err)
        }
    }, [])

    return currency
}

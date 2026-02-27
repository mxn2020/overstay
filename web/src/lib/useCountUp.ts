import { useState, useEffect, useRef } from 'react'

/**
 * Animates a number from 0 to `target` over `duration` ms with an ease-out curve.
 * Returns the current animated value.
 */
export function useCountUp(target: number, duration = 1000, decimals = 0): number {
    const [value, setValue] = useState(0)
    const startTime = useRef<number | null>(null)
    const rafId = useRef<number>(0)

    useEffect(() => {
        startTime.current = null

        const animate = (timestamp: number) => {
            if (startTime.current === null) startTime.current = timestamp
            const elapsed = timestamp - startTime.current
            const progress = Math.min(elapsed / duration, 1)

            // Ease-out cubic: 1 - (1 - t)^3
            const eased = 1 - Math.pow(1 - progress, 3)
            const current = eased * target

            setValue(Number(current.toFixed(decimals)))

            if (progress < 1) {
                rafId.current = requestAnimationFrame(animate)
            }
        }

        rafId.current = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(rafId.current)
    }, [target, duration, decimals])

    return value
}

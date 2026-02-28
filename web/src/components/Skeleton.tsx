
interface SkeletonProps {
    width?: string
    height?: string
    borderRadius?: string
    className?: string
}

function SkeletonBox({ width = '100%', height = '1rem', borderRadius = '4px', className = '' }: SkeletonProps) {
    return (
        <div
            className={`skeleton ${className}`}
            style={{
                width,
                height,
                borderRadius,
                background: 'linear-gradient(90deg, var(--color-surface-2, rgba(255,255,255,0.05)) 25%, var(--color-surface-3, rgba(255,255,255,0.1)) 50%, var(--color-surface-2, rgba(255,255,255,0.05)) 75%)',
                backgroundSize: '200% 100%',
                animation: 'skeleton-shimmer 1.5s infinite',
            }}
        />
    )
}

export function SkeletonCard() {
    return (
        <div className="card" style={{ padding: '16px' }}>
            <SkeletonBox width="60%" height="1.2rem" />
            <div style={{ marginTop: '8px' }}><SkeletonBox width="100%" height="0.9rem" /></div>
            <div style={{ marginTop: '4px' }}><SkeletonBox width="80%" height="0.9rem" /></div>
        </div>
    )
}

export function SkeletonList({ count = 3 }: { count?: number }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    )
}

export default SkeletonBox

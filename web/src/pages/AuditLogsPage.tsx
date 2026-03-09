import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Select } from '@geenius-ui/react-css'

type Category = 'auth' | 'admin' | 'system' | 'billing' | undefined

const CATEGORY_COLORS: Record<string, string> = {
    auth: '#8B5CF6',
    admin: '#F59E0B',
    system: '#10B981',
    billing: '#EC4899',
}

const CATEGORY_ICONS: Record<string, string> = {
    auth: '🔐',
    admin: '⚙️',
    system: '🖥️',
    billing: '💳',
}

export default function AuditLogsPage() {
    const [category, setCategory] = useState<Category>(undefined)
    const [limit, setLimit] = useState(50)
    const logs = useQuery(api.auditLog.list, { category, limit })
    const stats = useQuery(api.auditLog.stats)

    const formatTime = (ts: number) => {
        const d = new Date(ts)
        return d.toLocaleString('en-US', {
            month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
        })
    }

    const formatTimeAgo = (ts: number) => {
        const diff = Date.now() - ts
        if (diff < 60_000) return 'just now'
        if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
        if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
        return `${Math.floor(diff / 86_400_000)}d ago`
    }

    const parseDetails = (details: string) => {
        try { return JSON.parse(details) } catch { return { message: details } }
    }

    if (logs === undefined) {
        return <div className="loading"><div className="loading__spinner" /><p className="loading__text">Loading audit logs…</p></div>
    }

    if (logs.length === 0 && !stats) {
        return (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                <h2>🔒 Access Denied</h2>
                <p style={{ color: 'var(--color-smoke-gray)', marginTop: '8px' }}>Admin access required to view audit logs.</p>
            </div>
        )
    }

    return (
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: 'var(--space-xl) var(--space-md)' }}>
            <div style={{ marginBottom: 'var(--space-xl)' }}>
                <h1 style={{ marginBottom: 'var(--space-sm)' }}>🔍 Audit Logs</h1>
                <p style={{ color: 'var(--color-smoke-gray)', fontSize: '0.9rem' }}>
                    Track all actions across authentication, admin operations, system events, and billing.
                </p>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
                    <div className="card" style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>{stats.total24h}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-smoke-gray)', marginTop: '4px' }}>Last 24h</div>
                    </div>
                    {Object.entries(stats.byCategory).map(([cat, count]: [string, unknown]) => (
                        <div className="card" key={cat} style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: CATEGORY_COLORS[cat] }}>{count as number}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-smoke-gray)', marginTop: '4px' }}>
                                {CATEGORY_ICONS[cat]} {cat}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Filters */}
            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                    className={`admin-tab ${!category ? 'admin-tab--active' : ''}`}
                    onClick={() => setCategory(undefined)}
                >All</button>
                {(['auth', 'admin', 'system', 'billing'] as const).map(cat => (
                    <button
                        key={cat}
                        className={`admin-tab ${category === cat ? 'admin-tab--active' : ''}`}
                        onClick={() => setCategory(cat)}
                        style={{ borderColor: category === cat ? CATEGORY_COLORS[cat] : undefined }}
                    >
                        {CATEGORY_ICONS[cat]} {cat}
                    </button>
                ))}
                <div style={{ marginLeft: 'auto' }}>
                    <Select
                        value={limit}
                        onChange={e => setLimit(Number(e.target.value))}
                        style={{ minWidth: 120 }}
                    >
                        <option value={25}>25 logs</option>
                        <option value={50}>50 logs</option>
                        <option value={100}>100 logs</option>
                        <option value={200}>200 logs</option>
                    </Select>
                </div>
            </div>

            {/* Log Entries */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {logs.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--color-smoke-gray)' }}>
                        No audit logs found for this category.
                    </div>
                ) : logs.map((log: any) => {
                    const details = parseDetails(log.details)
                    return (
                        <div
                            key={log._id}
                            style={{
                                display: 'flex', gap: 'var(--space-md)', padding: 'var(--space-md) var(--space-lg)',
                                background: 'var(--gradient-card)',
                                border: '1px solid rgba(var(--color-accent-rgb), 0.1)',
                                borderRadius: 'var(--radius-sm)',
                                borderLeft: `3px solid ${CATEGORY_COLORS[log.category] ?? '#666'}`,
                                alignItems: 'flex-start',
                            }}
                        >
                            <div style={{ minWidth: '28px', fontSize: '1.1rem', marginTop: '2px' }}>
                                {CATEGORY_ICONS[log.category] ?? '📋'}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={{ fontWeight: 600, fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>
                                        {log.action}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-smoke-gray)', whiteSpace: 'nowrap' }} title={formatTime(log.timestamp)}>
                                        {formatTimeAgo(log.timestamp)}
                                    </span>
                                </div>
                                {details.message && (
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-smoke-gray)', marginTop: '4px' }}>
                                        {details.message}
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: '6px', flexWrap: 'wrap' }}>
                                    <span style={{
                                        fontSize: '0.7rem', padding: '2px 8px',
                                        borderRadius: 'var(--radius-full)',
                                        background: `${CATEGORY_COLORS[log.category]}20`,
                                        color: CATEGORY_COLORS[log.category],
                                        fontWeight: 600,
                                    }}>
                                        {log.category}
                                    </span>
                                    {log.userId && (
                                        <span style={{ fontSize: '0.7rem', color: 'var(--color-smoke-gray)', fontFamily: 'var(--font-mono)' }}>
                                            user:{log.userId.slice(0, 8)}…
                                        </span>
                                    )}
                                    {log.targetId && (
                                        <span style={{ fontSize: '0.7rem', color: 'var(--color-smoke-gray)', fontFamily: 'var(--font-mono)' }}>
                                            target:{log.targetId.slice(0, 8)}…
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {logs.length >= limit && (
                <div style={{ textAlign: 'center', marginTop: 'var(--space-lg)' }}>
                    <button className="btn btn--secondary" onClick={() => setLimit(l => l + 50)}>
                        Load More
                    </button>
                </div>
            )}
        </div>
    )
}

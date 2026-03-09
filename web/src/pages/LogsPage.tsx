import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Select } from '@geenius-ui/react-css'

export default function LogsPage() {
    const [modelFilter, setModelFilter] = useState<string>('')
    const [statusFilter, setStatusFilter] = useState<string>('')
    const [callerFilter, setCallerFilter] = useState<string>('')
    const [expandedLog, setExpandedLog] = useState<string | null>(null)
    const [expandedSection, setExpandedSection] = useState<string | null>(null)

    const logs = useQuery(api.aiLogs.getLogs, {
        limit: 100,
        modelFilter: modelFilter || undefined,
        statusFilter: statusFilter || undefined,
        callerFilter: callerFilter || undefined,
    })
    const stats = useQuery(api.aiLogs.getLogStats)
    const clearAllLogs = useMutation(api.aiLogs.clearAllLogs)
    const deleteLog = useMutation(api.aiLogs.deleteLog)

    const formatDuration = (ms: number) => {
        if (ms < 1000) return `${ms}ms`
        return `${(ms / 1000).toFixed(1)}s`
    }

    const formatTime = (ts: number) => {
        const d = new Date(ts)
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }

    const formatDate = (ts: number) => {
        const d = new Date(ts)
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }

    const modelShort = (model: string) => model.split('/').pop() ?? model

    return (
        <div className="logs-page">
            <h1 className="logs-page__title">📋 AI Audit Logs</h1>
            <p className="logs-page__subtitle">Full trace of every NVIDIA API call — prompts, responses, timing, and tokens</p>

            {/* Stats Bar */}
            {stats && (
                <div className="logs-stats">
                    <div className="logs-stat">
                        <span className="logs-stat__value">{stats.totalLogs}</span>
                        <span className="logs-stat__label">Total Calls</span>
                    </div>
                    <div className="logs-stat">
                        <span className="logs-stat__value logs-stat__value--success">{stats.successCount}</span>
                        <span className="logs-stat__label">Success</span>
                    </div>
                    <div className="logs-stat">
                        <span className="logs-stat__value logs-stat__value--error">{stats.errorCount}</span>
                        <span className="logs-stat__label">Errors</span>
                    </div>
                    <div className="logs-stat">
                        <span className="logs-stat__value">{stats.totalTokens.toLocaleString()}</span>
                        <span className="logs-stat__label">Total Tokens</span>
                    </div>
                    <div className="logs-stat">
                        <span className="logs-stat__value">{formatDuration(stats.avgDurationMs)}</span>
                        <span className="logs-stat__label">Avg Duration</span>
                    </div>
                    <div className="logs-stat">
                        <span className="logs-stat__value">{stats.models.length}</span>
                        <span className="logs-stat__label">Models Used</span>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="logs-filters">
                <div className="logs-filter">
                    <label className="admin-label">Model</label>
                    <Select value={modelFilter} onChange={e => setModelFilter(e.target.value)}>
                        <option value="">All Models</option>
                        {stats?.models.map((m: string) => <option key={m} value={m}>{modelShort(m)}</option>)}
                    </Select>
                </div>
                <div className="logs-filter">
                    <label className="admin-label">Status</label>
                    <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="">All</option>
                        <option value="success">✅ Success</option>
                        <option value="error">❌ Error</option>
                    </Select>
                </div>
                <div className="logs-filter">
                    <label className="admin-label">Caller</label>
                    <Select value={callerFilter} onChange={e => setCallerFilter(e.target.value)}>
                        <option value="">All Callers</option>
                        {stats?.callers.map((c: string) => <option key={c} value={c}>{c}</option>)}
                    </Select>
                </div>
                <div className="logs-filter logs-filter--actions">
                    <button
                        className="admin-btn--small admin-btn--danger"
                        onClick={() => { if (confirm('Clear all logs?')) clearAllLogs() }}
                    >
                        🗑️ Clear All
                    </button>
                </div>
            </div>

            {/* Log Entries */}
            <div className="logs-timeline">
                {logs && logs.length > 0 ? logs.map((log: any) => {
                    const isExpanded = expandedLog === log.requestId
                    return (
                        <div
                            key={log._id}
                            className={`logs-entry logs-entry--${log.status} ${isExpanded ? 'logs-entry--expanded' : ''}`}
                        >
                            {/* Header Row */}
                            <div className="logs-entry__header" onClick={() => setExpandedLog(isExpanded ? null : log.requestId)}>
                                <span className="logs-entry__status">
                                    {log.status === 'success' ? '✅' : '❌'}
                                </span>
                                <span className="logs-entry__model">{modelShort(log.model)}</span>
                                <span className="logs-entry__caller">{log.caller}</span>
                                <span className="logs-entry__duration">{formatDuration(log.durationMs)}</span>
                                <span className="logs-entry__tokens">
                                    {log.totalTokens ? `${log.totalTokens.toLocaleString()} tok` : '-'}
                                </span>
                                <span className="logs-entry__time">
                                    {formatDate(log.timestamp)} {formatTime(log.timestamp)}
                                </span>
                                {log.hasImage && <span className="logs-entry__badge">📷</span>}
                                <button
                                    className="admin-btn--small admin-btn--danger"
                                    onClick={(e) => { e.stopPropagation(); deleteLog({ logId: log._id }) }}
                                    title="Delete log"
                                >
                                    ×
                                </button>
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                                <div className="logs-entry__details">
                                    {/* Metadata */}
                                    <div className="logs-detail-grid">
                                        <div className="logs-detail">
                                            <span className="logs-detail__label">Request ID</span>
                                            <span className="logs-detail__value">{log.requestId}</span>
                                        </div>
                                        <div className="logs-detail">
                                            <span className="logs-detail__label">Model</span>
                                            <span className="logs-detail__value">{log.model}</span>
                                        </div>
                                        <div className="logs-detail">
                                            <span className="logs-detail__label">HTTP Status</span>
                                            <span className="logs-detail__value">{log.httpStatus}</span>
                                        </div>
                                        <div className="logs-detail">
                                            <span className="logs-detail__label">Finish Reason</span>
                                            <span className="logs-detail__value">{log.finishReason ?? '-'}</span>
                                        </div>
                                        <div className="logs-detail">
                                            <span className="logs-detail__label">Temperature</span>
                                            <span className="logs-detail__value">{log.temperature}</span>
                                        </div>
                                        <div className="logs-detail">
                                            <span className="logs-detail__label">Max Tokens</span>
                                            <span className="logs-detail__value">{log.maxTokens}</span>
                                        </div>
                                        <div className="logs-detail">
                                            <span className="logs-detail__label">Request Size</span>
                                            <span className="logs-detail__value">{(log.requestBodySize / 1024).toFixed(1)} KB</span>
                                        </div>
                                        <div className="logs-detail">
                                            <span className="logs-detail__label">Response Size</span>
                                            <span className="logs-detail__value">{log.responseSize} chars</span>
                                        </div>
                                    </div>

                                    {/* Token Breakdown */}
                                    {(log.promptTokens || log.completionTokens) && (
                                        <div className="logs-tokens-bar">
                                            <div className="logs-tokens-bar__segment logs-tokens-bar__segment--prompt"
                                                style={{ flex: log.promptTokens ?? 0 }}>
                                                Prompt: {log.promptTokens?.toLocaleString()}
                                            </div>
                                            <div className="logs-tokens-bar__segment logs-tokens-bar__segment--completion"
                                                style={{ flex: log.completionTokens ?? 0 }}>
                                                Completion: {log.completionTokens?.toLocaleString()}
                                            </div>
                                        </div>
                                    )}

                                    {/* Expandable Sections */}
                                    <div className="logs-sections">
                                        {/* System Prompt */}
                                        <div className="logs-section">
                                            <button
                                                className="logs-section__toggle"
                                                onClick={() => setExpandedSection(expandedSection === `${log.requestId}-system` ? null : `${log.requestId}-system`)}
                                            >
                                                {expandedSection === `${log.requestId}-system` ? '▼' : '▶'} System Prompt
                                            </button>
                                            {expandedSection === `${log.requestId}-system` && (
                                                <pre className="logs-section__content">{log.systemPrompt}</pre>
                                            )}
                                        </div>

                                        {/* User Prompt */}
                                        <div className="logs-section">
                                            <button
                                                className="logs-section__toggle"
                                                onClick={() => setExpandedSection(expandedSection === `${log.requestId}-user` ? null : `${log.requestId}-user`)}
                                            >
                                                {expandedSection === `${log.requestId}-user` ? '▼' : '▶'} User Prompt
                                                {log.hasImage && ` (+ ${((log.imageSizeBytes ?? 0) / 1024).toFixed(0)} KB image)`}
                                            </button>
                                            {expandedSection === `${log.requestId}-user` && (
                                                <pre className="logs-section__content">{log.userPromptText}</pre>
                                            )}
                                        </div>

                                        {/* Response */}
                                        <div className="logs-section">
                                            <button
                                                className="logs-section__toggle"
                                                onClick={() => setExpandedSection(expandedSection === `${log.requestId}-response` ? null : `${log.requestId}-response`)}
                                            >
                                                {expandedSection === `${log.requestId}-response` ? '▼' : '▶'} Response ({log.responseSize} chars)
                                            </button>
                                            {expandedSection === `${log.requestId}-response` && (
                                                <pre className="logs-section__content">{log.responseContent || '(empty)'}</pre>
                                            )}
                                        </div>

                                        {/* Error */}
                                        {log.errorMessage && (
                                            <div className="logs-section logs-section--error">
                                                <button
                                                    className="logs-section__toggle logs-section__toggle--error"
                                                    onClick={() => setExpandedSection(expandedSection === `${log.requestId}-error` ? null : `${log.requestId}-error`)}
                                                >
                                                    {expandedSection === `${log.requestId}-error` ? '▼' : '▶'} ❌ Error
                                                </button>
                                                {expandedSection === `${log.requestId}-error` && (
                                                    <pre className="logs-section__content logs-section__content--error">{log.errorMessage}</pre>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                }) : (
                    <p className="admin-empty">No logs yet. Run a prediction or model test to generate AI audit logs.</p>
                )}
            </div>
        </div>
    )
}

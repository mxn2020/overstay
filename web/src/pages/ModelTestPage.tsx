import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Trash2, ChevronDown, ChevronRight, FlaskConical } from 'lucide-react'

export default function ModelTestPage() {
    const testRuns = useQuery(api.modelTests.getTestRuns)
    const [expandedRun, setExpandedRun] = useState<string | null>(null)

    return (
        <div>
            <div style={{ marginBottom: '32px' }}>
                <h1><FlaskConical size={28} style={{ verticalAlign: 'middle', marginRight: '8px' }} />AI Model Tests</h1>
                <p style={{ color: 'var(--color-text-muted, var(--color-smoke-gray, #999))', marginTop: '8px' }}>
                    Test and compare AI model responses for prediction accuracy
                </p>
            </div>

            <div>
                {!testRuns ? (
                    <p style={{ color: 'var(--color-text-muted, #999)' }}>Loading test runs...</p>
                ) : testRuns.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-muted, #999)' }}>
                        <FlaskConical size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                        <p>No test runs yet. Run model tests from the Convex dashboard or via scripts.</p>
                    </div>
                ) : (
                    testRuns.map((run) => (
                        <TestRunCard
                            key={run.testRunId}
                            run={run}
                            expanded={expandedRun === run.testRunId}
                            onToggle={() => setExpandedRun(expandedRun === run.testRunId ? null : run.testRunId)}
                        />
                    ))
                )}
            </div>
        </div>
    )
}

function TestRunCard({ run, expanded, onToggle }: {
    run: { testRunId: string; startedAt: number; models: string[]; totalTests: number; successCount: number; avgDurationMs: number }
    expanded: boolean
    onToggle: () => void
}) {
    const details = useQuery(api.modelTests.getTestsByRun, expanded ? { testRunId: run.testRunId } : "skip")
    const deleteRun = useMutation(api.modelTests.deleteTestRun)
    const [deleting, setDeleting] = useState(false)

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!confirm('Delete this test run?')) return
        setDeleting(true)
        try { await deleteRun({ testRunId: run.testRunId }) } catch { setDeleting(false) }
    }

    const uniqueModels = [...new Set(run.models)]
    const successRate = run.totalTests > 0 ? Math.round((run.successCount / run.totalTests) * 100) : 0

    return (
        <div className="card" style={{ marginBottom: 'var(--space-sm, 8px)', padding: 'var(--space-md, 16px)' }}>
            <div onClick={onToggle} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    <span style={{ fontWeight: 600 }}>{new Date(run.startedAt).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.85rem' }}>
                    <span>{uniqueModels.length} model{uniqueModels.length !== 1 ? 's' : ''}</span>
                    <span>{run.totalTests} test{run.totalTests !== 1 ? 's' : ''}</span>
                    <span style={{ color: successRate === 100 ? 'var(--color-success, #4caf50)' : 'var(--color-warning, #ff9800)' }}>{successRate}% pass</span>
                    <span>~{Math.round(run.avgDurationMs)}ms avg</span>
                    <button className="btn btn--secondary btn--sm" onClick={handleDelete} disabled={deleting} title="Delete run"><Trash2 size={14} /></button>
                </div>
            </div>
            {expanded && (
                <div style={{ marginTop: '16px' }}>
                    {!details ? (
                        <p style={{ color: 'var(--color-text-muted, #999)' }}>Loading details...</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {details.map((test) => (
                                <TestResultRow key={test._id} test={test} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

function TestResultRow({ test }: {
    test: { _id: string; model: string; mode: string; durationMs: number; status: string; promptTokens: number; completionTokens: number; totalTokens: number; parseSuccess: boolean; hasAllFields: boolean; rawResponse: string; parsedResult?: string; errorMessage?: string; qualityNotes?: string }
}) {
    const [showRaw, setShowRaw] = useState(false)

    return (
        <div style={{ padding: '12px', background: 'var(--color-surface-2, rgba(255,255,255,0.05))', borderRadius: '6px', borderLeft: `3px solid ${test.status === 'success' ? 'var(--color-success, #4caf50)' : 'var(--color-danger, #f44336)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div><strong>{test.model}</strong> <span style={{ opacity: 0.6 }}>({test.mode})</span></div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem' }}>
                    <span>{test.durationMs}ms</span>
                    <span>{test.totalTokens} tok</span>
                    <span>{test.parseSuccess ? '✅ Parsed' : '❌ Parse fail'}</span>
                    <span>{test.hasAllFields ? '✅ Complete' : '⚠️ Partial'}</span>
                </div>
            </div>
            {test.errorMessage && <div style={{ color: 'var(--color-danger, #f44336)', fontSize: '0.8rem', marginTop: '4px' }}>{test.errorMessage}</div>}
            {test.qualityNotes && <div style={{ fontSize: '0.8rem', marginTop: '4px', opacity: 0.7 }}>{test.qualityNotes}</div>}
            <button className="btn btn--secondary btn--sm" onClick={() => setShowRaw(!showRaw)} style={{ marginTop: '8px' }}>
                {showRaw ? 'Hide' : 'Show'} Raw
            </button>
            {showRaw && <pre style={{ fontSize: '0.7rem', marginTop: '8px', whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: '200px', overflow: 'auto' }}>{test.rawResponse}</pre>}
        </div>
    )
}

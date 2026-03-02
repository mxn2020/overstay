import { useState, useRef, useCallback } from 'react'
import { useMutation, useQuery, useAction } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { VISION_MODELS, type ModelInfo } from '../lib/modelRegistry'
import { fileToBase64 } from '../lib/nvidiaApi'
import LogsPage from './LogsPage'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'

interface TestResult {
    model: string
    modelName: string
    status: 'pending' | 'running' | 'success' | 'error'
    durationMs: number
    promptTokens: number
    completionTokens: number
    totalTokens: number
    rawResponse: string
    parseSuccess: boolean
    hasAllFields: boolean
    errorMessage?: string
}

const EXPECTED_FIELDS = ['setting', 'face_count', 'estimated_group_size', 'drinks_visible', 'lighting', 'crowd_density', 'emotional_vibe', 'objects_detected', 'activity_level', 'chaos_indicators', 'food_visible', 'water_visible', 'time_cues']

function parseAndValidate(raw: string): { parseSuccess: boolean; hasAllFields: boolean; parsed?: Record<string, unknown>; notes: string } {
    let cleaned = raw.trim()
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }
    try {
        const parsed = JSON.parse(cleaned)
        const missingFields = EXPECTED_FIELDS.filter(f => !(f in parsed))
        return {
            parseSuccess: true,
            hasAllFields: missingFields.length === 0,
            parsed,
            notes: missingFields.length > 0 ? `Missing: ${missingFields.join(', ')}` : 'All fields present',
        }
    } catch (e) {
        return {
            parseSuccess: false,
            hasAllFields: false,
            notes: `JSON parse failed: ${(e as Error).message}`,
        }
    }
}

export default function AdminPage() {
    const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set(['moonshotai/kimi-k2.5']))
    const [mode, setMode] = useState<'single' | 'combined'>('single')
    const [testImage, setTestImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [results, setResults] = useState<TestResult[]>([])
    const [isRunning, setIsRunning] = useState(false)
    const [expandedResult, setExpandedResult] = useState<string | null>(null)
    const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'models' | 'prompts' | 'logs' | 'costs'>('models')
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Prompt source state
    const [promptSource, setPromptSource] = useState<'db' | 'custom'>('db')
    const [selectedSystemPromptId, setSelectedSystemPromptId] = useState<string>('vision_system')
    const [selectedUserPromptId, setSelectedUserPromptId] = useState<string>('vision_user')
    const [customSystemPrompt, setCustomSystemPrompt] = useState<string>('')
    const [customUserPrompt, setCustomUserPrompt] = useState<string>('')
    const [testMaxTokens, setTestMaxTokens] = useState<number>(4000)
    const MAX_TOKEN_OPTIONS = [1000, 2000, 4000, 8000] as const

    const saveTestResult = useMutation(api.modelTests.saveTestResult)
    const testRuns = useQuery(api.modelTests.getTestRuns)
    const selectedRunTests = useQuery(
        api.modelTests.getTestsByRun,
        selectedRunId ? { testRunId: selectedRunId } : 'skip'
    )
    const deleteTestRun = useMutation(api.modelTests.deleteTestRun)
    const callModelAction = useAction(api.nvidia.callModel)

    // Prompts hooks
    const prompts = useQuery(api.prompts.getPrompts)
    const updatePrompt = useMutation(api.prompts.updatePrompt)
    const [editingPrompt, setEditingPrompt] = useState<string | null>(null)
    const [promptDraft, setPromptDraft] = useState<string>('')

    const toggleModel = (id: string) => {
        setSelectedModels(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const selectAll = () => setSelectedModels(new Set(VISION_MODELS.map(m => m.id)))
    const selectNone = () => setSelectedModels(new Set())

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setTestImage(file)
            setImagePreview(URL.createObjectURL(file))
        }
    }

    const runTests = useCallback(async () => {
        if (!testImage || selectedModels.size === 0) return

        setIsRunning(true)
        const testRunId = `run-${Date.now()}`
        const models = VISION_MODELS.filter(m => selectedModels.has(m.id))

        // Initialize results
        const initialResults: TestResult[] = models.map(m => ({
            model: m.id,
            modelName: m.name,
            status: 'pending',
            durationMs: 0,
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
            rawResponse: '',
            parseSuccess: false,
            hasAllFields: false,
        }))
        setResults(initialResults)

        // Compress image
        let processedFile = testImage
        try {
            const { default: imageCompression } = await import('browser-image-compression')
            processedFile = await imageCompression(testImage, {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
            })
        } catch { /* use original */ }

        const base64 = await fileToBase64(processedFile)

        // Run all selected models in parallel
        await Promise.allSettled(models.map(async (model, i) => {
            const startedAt = Date.now()

            setResults(prev => prev.map((r, idx) =>
                idx === i ? { ...r, status: 'running' } : r
            ))

            try {
                let systemPrompt: string
                let userPrompt: string

                if (promptSource === 'custom') {
                    systemPrompt = customSystemPrompt || 'You are a vision AI.'
                    userPrompt = customUserPrompt || 'Analyze this image.'
                } else {
                    systemPrompt = prompts?.find((p: any) => p.promptId === selectedSystemPromptId)?.content || 'You are a vision AI.'
                    userPrompt = prompts?.find((p: any) => p.promptId === selectedUserPromptId)?.content || 'Analyze this image.'
                }

                const messages = [
                    { role: 'system' as const, content: systemPrompt },
                    {
                        role: 'user' as const,
                        content: [
                            { type: 'text' as const, text: userPrompt },
                            { type: 'image_url' as const, image_url: { url: base64 } },
                        ],
                    },
                ]

                const rawResponse = await callModelAction({
                    model: model.id,
                    messages,
                    temperature: 0.3,
                    maxTokens: testMaxTokens,
                    caller: `admin-test:${mode}`,
                })

                const completedAt = Date.now()
                const durationMs = completedAt - startedAt
                const validation = parseAndValidate(rawResponse)

                const result: TestResult = {
                    model: model.id,
                    modelName: model.name,
                    status: 'success',
                    durationMs,
                    promptTokens: 0,
                    completionTokens: 0,
                    totalTokens: 0,
                    rawResponse,
                    parseSuccess: validation.parseSuccess,
                    hasAllFields: validation.hasAllFields,
                }

                setResults(prev => prev.map((r, idx) => idx === i ? result : r))

                // Save to Convex
                await saveTestResult({
                    testRunId,
                    model: model.id,
                    mode,
                    imageSize: processedFile.size,
                    startedAt,
                    completedAt,
                    durationMs,
                    promptTokens: 0,
                    completionTokens: 0,
                    totalTokens: 0,
                    rawResponse: rawResponse.substring(0, 8000),
                    parsedResult: validation.parsed ? JSON.stringify(validation.parsed).substring(0, 8000) : undefined,
                    parseSuccess: validation.parseSuccess,
                    hasAllFields: validation.hasAllFields,
                    qualityNotes: validation.notes,
                    status: 'success',
                })
            } catch (err) {
                const completedAt = Date.now()
                const errorMessage = err instanceof Error ? err.message : 'Unknown error'

                setResults(prev => prev.map((r, idx) =>
                    idx === i ? { ...r, status: 'error', durationMs: completedAt - startedAt, errorMessage } : r
                ))

                await saveTestResult({
                    testRunId,
                    model: model.id,
                    mode,
                    imageSize: processedFile.size,
                    startedAt,
                    completedAt,
                    durationMs: completedAt - startedAt,
                    promptTokens: 0,
                    completionTokens: 0,
                    totalTokens: 0,
                    rawResponse: '',
                    parseSuccess: false,
                    hasAllFields: false,
                    status: 'error',
                    errorMessage,
                })
            }
        }))

        setIsRunning(false)
    }, [testImage, selectedModels, mode, saveTestResult, callModelAction, promptSource, selectedSystemPromptId, selectedUserPromptId, customSystemPrompt, customUserPrompt, prompts, testMaxTokens])

    return (
        <div className="admin-page">
            <h1 className="admin-page__title">⚙️ Admin Dashboard</h1>

            <div className="admin-tabs">
                <button
                    className={`admin-tab ${activeTab === 'models' ? 'admin-tab--active' : ''}`}
                    onClick={() => setActiveTab('models')}
                >
                    🧪 Model Testing Lab
                </button>
                <button
                    className={`admin-tab ${activeTab === 'prompts' ? 'admin-tab--active' : ''}`}
                    onClick={() => setActiveTab('prompts')}
                >
                    📝 Prompt Management
                </button>
                <button
                    className={`admin-tab ${activeTab === 'logs' ? 'admin-tab--active' : ''}`}
                    onClick={() => setActiveTab('logs')}
                >
                    📋 AI Logs
                </button>
                <button
                    className={`admin-tab ${activeTab === 'costs' ? 'admin-tab--active' : ''}`}
                    onClick={() => setActiveTab('costs')}
                >
                    💰 Costs
                </button>
            </div>

            {activeTab === 'models' && (
                <>
                    <p className="admin-page__subtitle" style={{ marginTop: '16px' }}>Benchmark NVIDIA Vision models for speed and quality</p>

                    {/* Config Panel */}
                    <div className="admin-section">
                        <h2 className="admin-section__title">⚙️ Test Configuration</h2>

                        <div className="admin-config">
                            {/* Image Upload */}
                            <div className="admin-config__upload">
                                <label className="admin-label">Test Image</label>
                                <div
                                    className="admin-upload-zone"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Test" className="admin-upload-zone__preview" />
                                    ) : (
                                        <span>📸 Click to select test image</span>
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    style={{ display: 'none' }}
                                />
                            </div>

                            {/* Mode */}
                            <div className="admin-config__mode">
                                <label className="admin-label">Prompt Mode</label>
                                <div className="admin-toggle">
                                    <button
                                        className={`admin-toggle__btn ${mode === 'single' ? 'admin-toggle__btn--active' : ''}`}
                                        onClick={() => setMode('single')}
                                    >
                                        Vision Only
                                    </button>
                                    <button
                                        className={`admin-toggle__btn ${mode === 'combined' ? 'admin-toggle__btn--active' : ''}`}
                                        onClick={() => setMode('combined')}
                                    >
                                        Combined (Analyze + Predict)
                                    </button>
                                </div>
                            </div>

                            {/* Prompt Configuration */}
                            <div className="admin-config__prompts">
                                <label className="admin-label">Prompt Source</label>
                                <div className="admin-toggle">
                                    <button
                                        className={`admin-toggle__btn ${promptSource === 'db' ? 'admin-toggle__btn--active' : ''}`}
                                        onClick={() => setPromptSource('db')}
                                    >
                                        📋 DB Prompt
                                    </button>
                                    <button
                                        className={`admin-toggle__btn ${promptSource === 'custom' ? 'admin-toggle__btn--active' : ''}`}
                                        onClick={() => setPromptSource('custom')}
                                    >
                                        ✏️ Custom Prompt
                                    </button>
                                </div>

                                {promptSource === 'db' ? (
                                    <div className="admin-prompt-selectors">
                                        <div className="admin-prompt-selector">
                                            <label className="admin-label--small">System Prompt</label>
                                            <Select
                                                value={selectedSystemPromptId}
                                                onChange={(e) => setSelectedSystemPromptId(e.target.value)}
                                            >
                                                {prompts?.map((p: any) => (
                                                    <option key={p.promptId} value={p.promptId}>
                                                        {p.name}
                                                    </option>
                                                ))}
                                            </Select>
                                        </div>
                                        <div className="admin-prompt-selector">
                                            <label className="admin-label--small">User Prompt</label>
                                            <Select
                                                value={selectedUserPromptId}
                                                onChange={(e) => setSelectedUserPromptId(e.target.value)}
                                            >
                                                {prompts?.map((p: any) => (
                                                    <option key={p.promptId} value={p.promptId}>
                                                        {p.name}
                                                    </option>
                                                ))}
                                            </Select>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="admin-prompt-custom">
                                        <div className="admin-prompt-custom__field">
                                            <label className="admin-label--small">System Prompt</label>
                                            <Textarea
                                                rows={4}
                                                placeholder="Enter a custom system prompt..."
                                                value={customSystemPrompt}
                                                onChange={(e: any) => setCustomSystemPrompt(e.target.value)}
                                            />
                                        </div>
                                        <div className="admin-prompt-custom__field">
                                            <label className="admin-label--small">User Prompt</label>
                                            <Textarea
                                                rows={4}
                                                placeholder="Enter a custom user prompt (sent with the image)..."
                                                value={customUserPrompt}
                                                onChange={(e: any) => setCustomUserPrompt(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Max Tokens */}
                        <div className="admin-config__tokens">
                            <label className="admin-label">Max Tokens</label>
                            <div className="admin-toggle admin-toggle--tokens">
                                {MAX_TOKEN_OPTIONS.map(opt => (
                                    <button
                                        key={opt}
                                        className={`admin-toggle__btn ${testMaxTokens === opt ? 'admin-toggle__btn--active' : ''}`}
                                        onClick={() => setTestMaxTokens(opt)}
                                    >
                                        {opt >= 1000 ? `${opt / 1000}k` : opt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Model Selection */}
                        <div className="admin-models">
                            <div className="admin-models__header">
                                <label className="admin-label">Models ({selectedModels.size}/{VISION_MODELS.length})</label>
                                <div className="admin-models__actions">
                                    <button className="admin-btn--small" onClick={selectAll}>Select All</button>
                                    <button className="admin-btn--small" onClick={selectNone}>Clear</button>
                                </div>
                            </div>
                            <div className="admin-models__grid">
                                {VISION_MODELS.map(model => (
                                    <ModelCard
                                        key={model.id}
                                        model={model}
                                        selected={selectedModels.has(model.id)}
                                        onToggle={() => toggleModel(model.id)}
                                    />
                                ))}
                            </div>
                        </div>

                        <button
                            className="btn btn--primary admin-run-btn"
                            onClick={runTests}
                            disabled={isRunning || !testImage || selectedModels.size === 0}
                        >
                            {isRunning ? '⏳ Running...' : `🚀 Run ${selectedModels.size} Model${selectedModels.size !== 1 ? 's' : ''}`}
                        </button>
                    </div>

                    {/* Live Results */}
                    {results.length > 0 && (
                        <div className="admin-section">
                            <h2 className="admin-section__title">📊 Results</h2>
                            <div className="admin-results">
                                {results.map(result => (
                                    <div
                                        key={result.model}
                                        className={`admin-result admin-result--${result.status}`}
                                        onClick={() => setExpandedResult(expandedResult === result.model ? null : result.model)}
                                    >
                                        <div className="admin-result__header">
                                            <div className="admin-result__status">
                                                {result.status === 'pending' && '⏸️'}
                                                {result.status === 'running' && '⏳'}
                                                {result.status === 'success' && '✅'}
                                                {result.status === 'error' && '❌'}
                                            </div>
                                            <div className="admin-result__name">{result.modelName}</div>
                                            <div className="admin-result__metrics">
                                                {result.status === 'success' && (
                                                    <>
                                                        <span className="admin-metric">{(result.durationMs / 1000).toFixed(1)}s</span>
                                                        <span className={`admin-badge ${result.parseSuccess ? 'admin-badge--success' : 'admin-badge--error'}`}>
                                                            {result.parseSuccess ? 'JSON ✓' : 'JSON ✗'}
                                                        </span>
                                                        <span className={`admin-badge ${result.hasAllFields ? 'admin-badge--success' : 'admin-badge--warn'}`}>
                                                            {result.hasAllFields ? 'Complete' : 'Partial'}
                                                        </span>
                                                    </>
                                                )}
                                                {result.status === 'error' && (
                                                    <span className="admin-metric admin-metric--error">{result.errorMessage?.substring(0, 60)}</span>
                                                )}
                                                {result.status === 'running' && (
                                                    <span className="admin-metric">Running...</span>
                                                )}
                                            </div>
                                        </div>
                                        {expandedResult === result.model && result.rawResponse && (
                                            <pre className="admin-result__response">{result.rawResponse}</pre>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* History */}
                    <div className="admin-section">
                        <h2 className="admin-section__title">📜 Test History</h2>
                        {testRuns && testRuns.length > 0 ? (
                            <div className="admin-history">
                                {testRuns.map((run: any) => (
                                    <div
                                        key={run.testRunId}
                                        className={`admin-history__run ${selectedRunId === run.testRunId ? 'admin-history__run--selected' : ''}`}
                                    >
                                        <div
                                            className="admin-history__run-header"
                                            onClick={() => setSelectedRunId(selectedRunId === run.testRunId ? null : run.testRunId)}
                                        >
                                            <span className="admin-history__date">
                                                {new Date(run.startedAt).toLocaleString()}
                                            </span>
                                            <span className="admin-history__stats">
                                                {run.successCount}/{run.totalTests} passed • avg {(run.avgDurationMs / 1000).toFixed(1)}s
                                            </span>
                                            <button
                                                className="admin-btn--small admin-btn--danger"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    deleteTestRun({ testRunId: run.testRunId })
                                                }}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                        {selectedRunId === run.testRunId && selectedRunTests && (
                                            <div className="admin-history__details">
                                                {selectedRunTests
                                                    .sort((a: any, b: any) => a.durationMs - b.durationMs)
                                                    .map((test: any) => (
                                                        <div key={test._id} className={`admin-history__test admin-history__test--${test.status}`}>
                                                            <span className="admin-history__model">{test.model.split('/').pop()}</span>
                                                            <span className="admin-metric">{(test.durationMs / 1000).toFixed(1)}s</span>
                                                            <span className={`admin-badge ${test.parseSuccess ? 'admin-badge--success' : 'admin-badge--error'}`}>
                                                                {test.parseSuccess ? '✓' : '✗'}
                                                            </span>
                                                            <span className={`admin-badge ${test.hasAllFields ? 'admin-badge--success' : 'admin-badge--warn'}`}>
                                                                {test.hasAllFields ? 'Full' : 'Partial'}
                                                            </span>
                                                            {test.qualityNotes && (
                                                                <span className="admin-history__notes">{test.qualityNotes}</span>
                                                            )}
                                                        </div>
                                                    ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="admin-empty">No test runs yet. Upload an image and run some models!</p>
                        )}
                    </div>
                </>
            )}

            {activeTab === 'prompts' && (
                <div className="admin-section">
                    <h2 className="admin-section__title">📝 System Prompts CMS</h2>
                    <p style={{ color: 'var(--color-smoke-gray)', marginBottom: '16px' }}>
                        Edit the exact prompts sent to the LLMs. Changes take effect on the very next prediction.
                    </p>

                    <div className="admin-prompts">
                        {prompts?.map((prompt: any) => (
                            <div key={prompt._id} className="admin-prompt-card">
                                <div className="admin-prompt-header">
                                    <div>
                                        <h3>{prompt.name}</h3>
                                        <div className="admin-prompt-desc">{prompt.description}</div>
                                    </div>
                                    <div className="admin-prompt-meta">
                                        Last updated: {new Date(prompt.updatedAt).toLocaleString()}
                                    </div>
                                </div>

                                {editingPrompt === prompt.promptId ? (
                                    <div className="admin-prompt-editor">
                                        <Textarea
                                            value={promptDraft}
                                            onChange={(e: any) => setPromptDraft(e.target.value)}
                                            rows={8}
                                        />
                                        <div className="admin-prompt-actions">
                                            <button
                                                className="btn btn--ghost admin-btn--small"
                                                onClick={() => setEditingPrompt(null)}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                className="btn btn--primary admin-btn--small"
                                                onClick={async () => {
                                                    await updatePrompt({ id: prompt._id, content: promptDraft })
                                                    setEditingPrompt(null)
                                                }}
                                            >
                                                Save Prompt
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="admin-prompt-view">
                                        <pre className="admin-prompt-content">{prompt.content}</pre>
                                        <button
                                            className="btn btn--secondary admin-btn--small"
                                            onClick={() => {
                                                setPromptDraft(prompt.content)
                                                setEditingPrompt(prompt.promptId)
                                            }}
                                        >
                                            Edit Prompt
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'logs' && (
                <LogsPage />
            )}

            {activeTab === 'costs' && (
                <CostsDashboard />
            )}
        </div>
    )
}

function CostsDashboard() {
    const modelCosts = useQuery(api.modelCosts.getModelCosts)
    const costDashboard = useQuery(api.modelCosts.getCostDashboard, { days: 30 })
    const setModelCost = useMutation(api.modelCosts.setModelCost)
    const seedCosts = useMutation(api.modelCosts.seedModelCosts)
    const [editingModel, setEditingModel] = useState<string | null>(null)
    const [editInput, setEditInput] = useState('')
    const [editOutput, setEditOutput] = useState('')

    const handleSave = async (model: string) => {
        await setModelCost({
            model,
            inputCostPer1k: parseFloat(editInput) || 0,
            outputCostPer1k: parseFloat(editOutput) || 0,
        })
        setEditingModel(null)
    }

    return (
        <div className="cost-dashboard" style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>💰 AI Cost Tracking</h2>
                <button className="btn btn--secondary" onClick={() => seedCosts({})}>
                    Seed Default Models
                </button>
            </div>

            {/* Summary Stats */}
            {costDashboard && (
                <div className="cost-stats">
                    <div className="cost-stat">
                        <span className="cost-stat__value">${costDashboard.totalCost.toFixed(5)}</span>
                        <span className="cost-stat__label">Total Spend (30d)</span>
                    </div>
                    <div className="cost-stat">
                        <span className="cost-stat__value">${costDashboard.totalInputCost.toFixed(5)}</span>
                        <span className="cost-stat__label">Input Cost</span>
                    </div>
                    <div className="cost-stat">
                        <span className="cost-stat__value">${costDashboard.totalOutputCost.toFixed(5)}</span>
                        <span className="cost-stat__label">Output Cost</span>
                    </div>
                    <div className="cost-stat">
                        <span className="cost-stat__value">{costDashboard.totalCalls}</span>
                        <span className="cost-stat__label">Total Calls</span>
                    </div>
                </div>
            )}

            {/* Model Cost Editor */}
            <div>
                <h3 style={{ marginBottom: '12px' }}>📊 Model Pricing (per 1K tokens)</h3>
                <table className="cost-model-table">
                    <thead>
                        <tr>
                            <th>Model</th>
                            <th>Input $/1K</th>
                            <th>Output $/1K</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {modelCosts?.map((mc) => (
                            <tr key={mc._id}>
                                <td>{mc.displayName || mc.model}</td>
                                <td>
                                    {editingModel === mc.model ? (
                                        <Input
                                            value={editInput}
                                            onChange={(e) => setEditInput(e.target.value)}
                                            placeholder="0.00000"
                                        />
                                    ) : (
                                        `$${mc.inputCostPer1k.toFixed(5)}`
                                    )}
                                </td>
                                <td>
                                    {editingModel === mc.model ? (
                                        <Input
                                            value={editOutput}
                                            onChange={(e) => setEditOutput(e.target.value)}
                                            placeholder="0.00000"
                                        />
                                    ) : (
                                        `$${mc.outputCostPer1k.toFixed(5)}`
                                    )}
                                </td>
                                <td>
                                    {editingModel === mc.model ? (
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <button className="btn btn--primary btn--icon" onClick={() => handleSave(mc.model)}>💾</button>
                                            <button className="btn btn--secondary btn--icon" onClick={() => setEditingModel(null)}>✕</button>
                                        </div>
                                    ) : (
                                        <button className="btn btn--secondary btn--icon" onClick={() => {
                                            setEditingModel(mc.model)
                                            setEditInput(mc.inputCostPer1k.toString())
                                            setEditOutput(mc.outputCostPer1k.toString())
                                        }}>✏️</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Per-Model Breakdown */}
            {costDashboard && costDashboard.byModel.length > 0 && (
                <div>
                    <h3 style={{ marginBottom: '12px' }}>📈 Cost by Model (30d)</h3>
                    <table className="cost-model-table">
                        <thead>
                            <tr>
                                <th>Model</th>
                                <th>Calls</th>
                                <th>Input Tokens</th>
                                <th>Output Tokens</th>
                                <th>Cost</th>
                            </tr>
                        </thead>
                        <tbody>
                            {costDashboard.byModel.map((m) => (
                                <tr key={m.model}>
                                    <td>{m.model.split('/').pop()}</td>
                                    <td>{m.calls}</td>
                                    <td>{m.inputTokens.toLocaleString()}</td>
                                    <td>{m.outputTokens.toLocaleString()}</td>
                                    <td style={{ color: '#10B981', fontWeight: 600 }}>${m.totalCost.toFixed(5)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Daily Cost Chart */}
            {costDashboard && costDashboard.byDay.length > 0 && (
                <div>
                    <h3 style={{ marginBottom: '12px' }}>📅 Daily Spend</h3>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '120px' }}>
                        {costDashboard.byDay.map((d) => {
                            const maxCost = Math.max(...costDashboard.byDay.map(x => x.cost), 0.00001)
                            const height = Math.max((d.cost / maxCost) * 100, 2)
                            return (
                                <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div
                                        style={{
                                            width: '100%', maxWidth: '24px', height: `${height}px`,
                                            background: 'linear-gradient(to top, #10B981, #059669)',
                                            borderRadius: '4px 4px 0 0',
                                        }}
                                        title={`${d.date}: $${d.cost.toFixed(5)}`}
                                    />
                                    <span style={{ fontSize: '0.55rem', color: '#999', marginTop: '2px' }}>
                                        {d.date.slice(-2)}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}

function ModelCard({ model, selected, onToggle }: { model: ModelInfo; selected: boolean; onToggle: () => void }) {
    return (
        <div
            className={`admin-model-card ${selected ? 'admin-model-card--selected' : ''} ${model.geoRestricted ? 'admin-model-card--restricted' : ''}`}
            onClick={onToggle}
        >
            <div className="admin-model-card__header">
                <input type="checkbox" checked={selected} readOnly />
                <span className="admin-model-card__name">{model.name}</span>
            </div>
            <div className="admin-model-card__meta">
                <span className="admin-model-card__publisher">{model.publisher}</span>
                <span className="admin-model-card__size">{model.size}</span>
            </div>
            {model.geoRestricted && (
                <div className="admin-model-card__warning">⚠️ May be geo-restricted</div>
            )}
        </div>
    )
}


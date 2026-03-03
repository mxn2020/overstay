import { useState, useRef, useCallback } from 'react'
import { logger } from '../lib/logger'
import { useConvexAuth, useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { analyzeImage, getPipelineMode } from '../lib/aiPipeline'
import { useNavigate } from 'react-router-dom'
import type { PredictionResult } from '../App'
import { Zap, LogIn } from 'lucide-react'

interface PhotoUploadProps {
    onAnalysisStart: () => void
    onResult: (result: PredictionResult) => void
    useConvex: boolean
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp']
const FREE_TRIAL_KEY = 'justOneLastDrink_free_used'

export default function PhotoUpload({ onAnalysisStart, onResult, useConvex }: PhotoUploadProps) {
    const [isDragging, setIsDragging] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [creditGateModal, setCreditGateModal] = useState<'login' | 'credits' | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const navigate = useNavigate()

    const { isAuthenticated } = useConvexAuth()
    const balance = useQuery(api.credits.getBalance)
    const deductCredits = useMutation(api.credits.deductCredits)

    const pipelineMode = getPipelineMode()

    const validateFile = (file: File): string | null => {
        if (!ACCEPTED_TYPES.includes(file.type)) {
            return "We couldn't read this photo. Even our AI has standards."
        }
        if (file.size > MAX_FILE_SIZE) {
            return "Upload failed. The chaos was too powerful. (Max 10MB)"
        }
        return null
    }

    const checkCredits = (): boolean => {
        const freeUsed = localStorage.getItem(FREE_TRIAL_KEY)

        if (!isAuthenticated) {
            // Anonymous: 1 free prediction via localStorage
            if (freeUsed) {
                setCreditGateModal('login')
                return false
            }
            // Allow the free trial
            return true
        }

        // Authenticated: check credit balance
        const credits = balance?.credits ?? 0
        if (credits < 4) {
            setCreditGateModal('credits')
            return false
        }

        return true
    }

    const processFile = async (file: File) => {
        setError(null)
        setCreditGateModal(null)

        const validationError = validateFile(file)
        if (validationError) {
            setError(validationError)
            return
        }

        // Credit check BEFORE analysis
        if (!checkCredits()) {
            return
        }

        // Show preview
        const previewUrl = URL.createObjectURL(file)
        setPreview(previewUrl)

        try {
            logger.log('[PhotoUpload] Starting analysis...', { pipelineMode, useConvex, fileSize: file.size, fileType: file.type })
            onAnalysisStart()

            let processedFile = file

            // Compress image before sending to AI (saves bandwidth + faster)
            if (pipelineMode !== 'demo') {
                try {
                    logger.log('[PhotoUpload] Compressing image...')
                    const { default: imageCompression } = await import('browser-image-compression')
                    processedFile = await imageCompression(file, {
                        maxSizeMB: 1,
                        maxWidthOrHeight: 1920,
                        useWebWorker: true,
                    })
                    logger.log('[PhotoUpload] Compressed:', { originalSize: file.size, compressedSize: processedFile.size })
                } catch (compressErr) {
                    logger.warn('[PhotoUpload] Image compression failed, using original:', compressErr)
                }
            }

            logger.log('[PhotoUpload] Calling analyzeImage()...')
            const result = await analyzeImage(processedFile)
            logger.log('[PhotoUpload] Got result:', result)

            // Deduct credits / mark free trial AFTER successful analysis
            if (isAuthenticated) {
                try {
                    await deductCredits({ description: 'Prediction' })
                } catch (creditErr) {
                    logger.error('[PhotoUpload] Credit deduction failed:', creditErr)
                    // Still show result — credits might have been deducted server-side
                }
            } else {
                // Mark free trial as used
                localStorage.setItem(FREE_TRIAL_KEY, 'true')
            }

            if ('rejected' in result && result.rejected) {
                onResult(result)
            } else {
                onResult({ ...result, imageUrl: previewUrl })
            }
        } catch (err) {
            logger.error('[PhotoUpload] ERROR:', err)
            const message = err instanceof Error ? err.message : 'Unknown error'
            if (message.includes('NVIDIA API') || message.includes('NVIDIA_API_KEY')) {
                setError(`AI error: ${message}`)
            } else {
                setError(`Something went wrong: ${message}`)
            }
            logger.error('Upload error:', err)
        }
    }

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files[0]
        if (file) processFile(file)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [useConvex, isAuthenticated, balance])

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback(() => {
        setIsDragging(false)
    }, [])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) processFile(file)
    }

    // Show current pipeline mode as a subtle badge
    const modeBadge = pipelineMode === 'demo' ? null : (
        <div style={{
            textAlign: 'center',
            marginTop: '8px',
            fontSize: '0.7rem',
            color: 'var(--color-smoke-gray)',
            opacity: 0.6,
        }}>
        </div>
    )

    return (
        <div>
            {/* Credit Gate Modal */}
            {creditGateModal && (
                <div className="credit-gate-overlay" onClick={() => setCreditGateModal(null)}>
                    <div className="credit-gate-modal" onClick={e => e.stopPropagation()}>
                        {creditGateModal === 'login' ? (
                            <>
                                <div className="credit-gate-modal__icon"><LogIn size={32} /></div>
                                <h3>You've used your free prediction!</h3>
                                <p>Sign in and subscribe to keep the party going. 🍻</p>
                                <button className="btn btn--primary" onClick={() => navigate('/login')}>
                                    <LogIn size={16} /> Sign In
                                </button>
                                <button className="btn btn--ghost" style={{ marginTop: '8px' }} onClick={() => setCreditGateModal(null)}>
                                    Maybe Later
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="credit-gate-modal__icon"><Zap size={32} /></div>
                                <h3>Out of credits! 😱</h3>
                                <p>You need 4 credits per prediction. Top up or subscribe for more.</p>
                                <button className="btn btn--primary" onClick={() => navigate('/pricing')}>
                                    <Zap size={16} /> Get Credits
                                </button>
                                <button className="btn btn--ghost" style={{ marginTop: '8px' }} onClick={() => setCreditGateModal(null)}>
                                    Close
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            <div
                className={`upload-zone ${isDragging ? 'upload-zone--active' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
            >
                {preview ? (
                    <img
                        src={preview}
                        alt="Preview"
                        style={{
                            maxHeight: '200px',
                            borderRadius: 'var(--radius-md)',
                            margin: '0 auto',
                        }}
                    />
                ) : (
                    <>
                        <div className="upload-zone__icon">📸</div>
                        <p className="upload-zone__text">
                            <strong>Drop your night-out photo here</strong>
                            <br />
                            or tap to select from your gallery
                        </p>
                        <p style={{
                            fontSize: '0.75rem',
                            color: 'var(--color-smoke-gray)',
                            marginTop: '12px',
                            opacity: 0.7,
                        }}>
                            JPEG, PNG, HEIC • Max 10MB
                        </p>
                    </>
                )}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/heic,image/heif,image/webp"
                capture="environment"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
            />

            {modeBadge}

            {/* Credit indicator for authenticated users */}
            {isAuthenticated && balance && (
                <div style={{
                    textAlign: 'center',
                    marginTop: '12px',
                    fontSize: '0.8rem',
                    color: balance.credits < 4 ? '#ef4444' : 'var(--color-smoke-gray)',
                }}>
                    <Zap size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                    {balance.credits} credits available{balance.credits < 4 ? ' — need 4 to predict' : ''}
                </div>
            )}

            {error && (
                <p style={{
                    textAlign: 'center',
                    color: 'var(--color-hot-red)',
                    marginTop: '16px',
                    fontSize: '0.9rem',
                }}>
                    {error}
                </p>
            )}
        </div>
    )
}

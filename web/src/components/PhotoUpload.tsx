import { useState, useRef, useCallback } from 'react'
import { analyzeImageLocally } from '../lib/localScoring'
import type { PredictionResult } from '../App'

interface PhotoUploadProps {
    onAnalysisStart: () => void
    onResult: (result: PredictionResult) => void
    useConvex: boolean
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp']

export default function PhotoUpload({ onAnalysisStart, onResult, useConvex }: PhotoUploadProps) {
    const [isDragging, setIsDragging] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const validateFile = (file: File): string | null => {
        if (!ACCEPTED_TYPES.includes(file.type)) {
            return "We couldn't read this photo. Even our AI has standards."
        }
        if (file.size > MAX_FILE_SIZE) {
            return "Upload failed. The chaos was too powerful. (Max 10MB)"
        }
        return null
    }

    const processFile = async (file: File) => {
        setError(null)

        const validationError = validateFile(file)
        if (validationError) {
            setError(validationError)
            return
        }

        // Show preview
        const previewUrl = URL.createObjectURL(file)
        setPreview(previewUrl)

        try {
            onAnalysisStart()

            if (useConvex) {
                // Convex mode: compress, upload, analyze via Convex
                const { default: imageCompression } = await import('browser-image-compression')
                const compressed = await imageCompression(file, {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 1920,
                    useWebWorker: true,
                })

                const { useMutation } = await import('convex/react')
                void useMutation // Convex mode would use hooks — this path requires ConvexProvider
                // For now, fall through to demo mode
                const result = await analyzeImageLocally()
                onResult({ ...result, imageUrl: previewUrl })
            } else {
                // Demo mode: use local scoring engine
                const result = await analyzeImageLocally()
                onResult({ ...result, imageUrl: previewUrl })
            }
        } catch (err) {
            setError("Something went wrong. Like your decision to go out on a Tuesday.")
            console.error('Upload error:', err)
        }
    }

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files[0]
        if (file) processFile(file)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [useConvex])

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

    return (
        <div>
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

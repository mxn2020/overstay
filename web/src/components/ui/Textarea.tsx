import React, { forwardRef } from 'react'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string
    error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className = '', label, error, ...props }, ref) => {
        return (
            <div className={`app-input-wrapper ${className}`}>
                {label && (
                    <label className="app-input-label">
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    className={`app-input app-textarea ${error ? 'app-input--error' : ''}`}
                    {...props}
                />
                {error && (
                    <span className="app-input-error-msg">{error}</span>
                )}
            </div>
        )
    }
)

Textarea.displayName = 'Textarea'

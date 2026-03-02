import React, { forwardRef } from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', label, error, ...props }, ref) => {
        return (
            <div className={`app-input-wrapper ${className}`}>
                {label && (
                    <label className="app-input-label">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={`app-input ${error ? 'app-input--error' : ''}`}
                    {...props}
                />
                {error && (
                    <span className="app-input-error-msg">{error}</span>
                )}
            </div>
        )
    }
)

Input.displayName = 'Input'

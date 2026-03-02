import React, { forwardRef } from 'react'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string
    error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ className = '', label, error, children, ...props }, ref) => {
        return (
            <div className={`app-input-wrapper ${className}`}>
                {label && (
                    <label className="app-input-label">
                        {label}
                    </label>
                )}
                {/* 
                  Native select wrapper to allow custom styling 
                  while relying on native dropdown interface
                */}
                <div className="app-select-container">
                    <select
                        ref={ref}
                        className={`app-input app-select ${error ? 'app-input--error' : ''}`}
                        {...props}
                    >
                        {children}
                    </select>
                </div>
                {error && (
                    <span className="app-input-error-msg">{error}</span>
                )}
            </div>
        )
    }
)

Select.displayName = 'Select'

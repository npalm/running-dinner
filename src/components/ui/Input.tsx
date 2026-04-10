import { type InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, id, className = '', ...props },
  ref,
) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={[
          'rounded-md border px-3 py-2 text-sm transition-colors',
          'bg-white text-gray-900 placeholder-gray-400',
          'dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500',
          error
            ? 'border-red-500 focus:ring-red-500 dark:border-red-400'
            : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500',
          'focus:outline-none focus:ring-2 focus:ring-offset-0',
          'disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-900',
          className,
        ].join(' ')}
        {...props}
      />
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      {!error && hint && <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
    </div>
  )
})

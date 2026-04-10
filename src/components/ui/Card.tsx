import type { ReactNode } from 'react'

interface CardProps {
  className?: string
  children: ReactNode
}

export function Card({ className = '', children }: CardProps) {
  return (
    <div
      className={[
        'rounded-lg bg-white shadow-sm ring-1 ring-gray-200',
        'dark:bg-gray-800 dark:ring-gray-700',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}

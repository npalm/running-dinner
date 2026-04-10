import type { ReactNode } from 'react'

type BadgeVariant = 'starter' | 'main' | 'dessert' | 'prefer-not' | 'neutral' | 'count'

interface BadgeProps {
  variant: BadgeVariant
  children: ReactNode
}

const variantClasses: Record<BadgeVariant, string> = {
  starter:
    'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  main:
    'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  dessert:
    'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  'prefer-not':
    'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  neutral:
    'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  count:
    'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
}

export function Badge({ variant, children }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
      ].join(' ')}
    >
      {children}
    </span>
  )
}

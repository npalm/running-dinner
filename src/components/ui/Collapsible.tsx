import { useState } from 'react'

interface Props {
  title: string
  subtitle?: string
  defaultOpen?: boolean
  children: React.ReactNode
  badge?: string
}

export function Collapsible({ title, subtitle, defaultOpen = false, children, badge }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 bg-gray-50 px-5 py-4 text-left transition-colors hover:bg-gray-100 dark:bg-gray-800/60 dark:hover:bg-gray-800"
      >
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 dark:text-white">{title}</span>
            {badge && (
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <span className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</span>
          )}
        </div>
        <span
          className={`shrink-0 text-gray-400 transition-transform duration-200 dark:text-gray-500 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="p-5">
          {children}
        </div>
      )}
    </div>
  )
}

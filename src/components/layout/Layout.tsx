import type { ReactNode } from 'react'
import { Header } from './Header'
import { Navigation } from './Navigation'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-rose-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <Header />
      <Navigation />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  )
}

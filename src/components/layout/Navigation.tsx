import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useParticipantsStore } from '../../store/participants'
import { StrategySettingsModal } from '../settings/StrategySettingsModal'

export function Navigation() {
  const { t } = useTranslation()
  const participants = useParticipantsStore((s) => s.participants)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'flex items-center gap-1.5 border-b-2 px-3 py-3 text-sm font-medium transition-colors sm:gap-2 sm:px-5',
      isActive
        ? 'border-orange-500 text-orange-600 dark:border-orange-400 dark:text-orange-400'
        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200',
    ].join(' ')

  return (
    <nav className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto flex max-w-6xl px-1 sm:px-4">
        <NavLink to="/participants" className={linkClass}>
          <span>👥</span>
          <span>{t('nav.participants')}</span>
          {participants.length > 0 && (
            <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-xs font-semibold text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
              {participants.length}
            </span>
          )}
        </NavLink>
        <NavLink to="/schedule" className={linkClass}>
          <span>📋</span>
          <span>{t('nav.schedule')}</span>
        </NavLink>
        <NavLink to="/map" className={linkClass}>
          <span>🗺️</span>
          <span>{t('nav.map')}</span>
        </NavLink>
        <NavLink to="/organizer" className={linkClass}>
          <span>📄</span>
          <span>{t('nav.organizer')}</span>
        </NavLink>
        <div className="ml-auto flex items-center">
          <button
            onClick={() => setSettingsOpen(true)}
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            aria-label={t('settings.title')}
          >
            ⚙️
          </button>
        </div>
      </div>
      <StrategySettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </nav>
  )
}

import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useParticipantsStore } from '../../store/participants'

export function Navigation() {
  const { t } = useTranslation()
  const participants = useParticipantsStore((s) => s.participants)

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors',
      isActive
        ? 'border-orange-500 text-orange-600 dark:border-orange-400 dark:text-orange-400'
        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200',
    ].join(' ')

  return (
    <nav className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto flex max-w-6xl px-4">
        <NavLink to="/participants" className={linkClass}>
          <span>👥</span>
          {t('nav.participants')}
          {participants.length > 0 && (
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
              {participants.length}
            </span>
          )}
        </NavLink>
        <NavLink to="/schedule" className={linkClass}>
          <span>📋</span>
          {t('nav.schedule')}
        </NavLink>
        <NavLink to="/map" className={linkClass}>
          <span>🗺️</span>
          {t('nav.map')}
        </NavLink>
      </div>
    </nav>
  )
}

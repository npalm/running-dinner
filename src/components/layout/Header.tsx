import { useTranslation } from 'react-i18next'
import i18n from '../../i18n'
import { useThemeStore } from '../../store/theme'

export function Header() {
  const { t } = useTranslation()
  const { theme, toggle } = useThemeStore()

  return (
    <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-2xl">🍽️</span>
          <h1 className="truncate bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-lg font-bold text-transparent sm:text-xl">
            {t('app.title')}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="flex items-center rounded-full border border-gray-200 p-0.5 dark:border-gray-700">
            <button
              onClick={() => i18n.changeLanguage('nl')}
              className={[
                'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                i18n.language === 'nl'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200',
              ].join(' ')}
            >
              NL
            </button>
            <button
              onClick={() => i18n.changeLanguage('en')}
              className={[
                'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                i18n.language === 'en'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200',
              ].join(' ')}
            >
              EN
            </button>
          </div>
          <button
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="rounded-full p-2 text-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </header>
  )
}

import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '../../store/settings'
import { DEFAULT_STRATEGY } from '../../lib/schedule'
import { Button } from '../ui/Button'

const PRESETS: Record<string, number[]> = {
  balanced: [6, 5, 7, 8, 4],
  preferSmall: [4, 5, 6, 7, 8],
  preferLarge: [8, 7, 6, 5, 4],
}

export function StrategySettings() {
  const { t } = useTranslation()
  const strategy = useSettingsStore((s) => s.strategy)
  const setStrategy = useSettingsStore((s) => s.setStrategy)
  const allowVariableTables = useSettingsStore((s) => s.allowVariableTables)
  const setAllowVariableTables = useSettingsStore((s) => s.setAllowVariableTables)

  const move = (index: number, direction: -1 | 1) => {
    const next = [...strategy]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setStrategy(next)
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('settings.strategy')}
        </h3>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {t('settings.strategyDescription')}
        </p>
      </div>

      <ul className="space-y-1">
        {strategy.map((size, i) => (
          <li
            key={size}
            className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2 dark:bg-gray-700/50"
          >
            <span className="flex-1 font-mono text-sm">{size}</span>
            <button
              onClick={() => move(i, -1)}
              disabled={i === 0}
              className="rounded p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 dark:hover:text-gray-200"
              aria-label={`Move ${size} up`}
            >
              ↑
            </button>
            <button
              onClick={() => move(i, 1)}
              disabled={i === strategy.length - 1}
              className="rounded p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 dark:hover:text-gray-200"
              aria-label={`Move ${size} down`}
            >
              ↓
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={allowVariableTables}
            onChange={(e) => setAllowVariableTables(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('settings.allowVariableTables')}
          </span>
        </label>
        <p className="ml-6 mt-1 text-xs text-gray-500 dark:text-gray-400">
          {t('settings.allowVariableTablesDescription')}
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {t('settings.presets')}
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(PRESETS).map(([key, preset]) => (
            <Button
              key={key}
              variant="secondary"
              size="sm"
              onClick={() => setStrategy(preset)}
            >
              {t(`settings.${key}`)}
            </Button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setStrategy(DEFAULT_STRATEGY)}
        >
          {t('settings.reset')}
        </Button>
      </div>
    </div>
  )
}

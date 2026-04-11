import { useTranslation } from 'react-i18next'
import { Collapsible } from '../ui/Collapsible'
import type { DistanceStats as DistanceStatsType } from '../../lib/stats'

interface Props {
  stats: DistanceStatsType
}

function formatM(m: number | null): string {
  if (m === null) return '—'
  if (m >= 1000) return `${(m / 1000).toFixed(1)} km`
  return `${m} m`
}

export function DistanceStats({ stats }: Props) {
  const { t } = useTranslation()
  const { participants, averageM, maxM, minM } = stats

  if (participants.length === 0) return null

  const topThreeTotal = participants
    .filter((p) => p.totalM !== null)
    .slice(0, 3)
    .map((p) => p.participantId)

  return (
    <Collapsible title={t('stats.title')}>
      <div className="space-y-4">
        {/* Summary row */}
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: t('stats.average'), value: averageM },
            { label: t('stats.max'), value: maxM },
            { label: t('stats.min'), value: minM },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 border border-gray-100 dark:border-gray-700"
            >
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatM(value)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500 italic">
          {t('stats.disclaimer')}
        </p>

        {/* Per-participant table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="pb-2 pr-3 font-medium">{t('participant.name')}</th>
                <th className="pb-2 pr-3 font-medium text-right">{t('stats.homeToStarter')}</th>
                <th className="pb-2 pr-3 font-medium text-right">{t('stats.starterToMain')}</th>
                <th className="pb-2 pr-3 font-medium text-right">{t('stats.mainToDessert')}</th>
                <th className="pb-2 font-medium text-right">{t('stats.total')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {participants.map((p, i) => {
                const isTop3 = topThreeTotal.includes(p.participantId)
                return (
                  <tr
                    key={p.participantId}
                    className={isTop3 ? 'bg-amber-50 dark:bg-amber-900/10' : ''}
                  >
                    <td className="py-1.5 pr-3 text-gray-800 dark:text-gray-200 flex items-center gap-1">
                      {i === 0 && <span title={t('stats.longestWalker')}>🏃</span>}
                      {isTop3 && i > 0 && <span className="w-4" />}
                      {p.name}
                    </td>
                    <td className="py-1.5 pr-3 text-right text-gray-600 dark:text-gray-400 tabular-nums">
                      {formatM(p.homeToStarter)}
                    </td>
                    <td className="py-1.5 pr-3 text-right text-gray-600 dark:text-gray-400 tabular-nums">
                      {formatM(p.starterToMain)}
                    </td>
                    <td className="py-1.5 pr-3 text-right text-gray-600 dark:text-gray-400 tabular-nums">
                      {formatM(p.mainToDessert)}
                    </td>
                    <td className="py-1.5 text-right font-medium text-gray-900 dark:text-white tabular-nums">
                      {formatM(p.totalM)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Collapsible>
  )
}

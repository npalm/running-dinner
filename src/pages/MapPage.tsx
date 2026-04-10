import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParticipantsStore } from '../store/participants'
import { useScheduleStore } from '../store/schedule'
import { DinnerMap } from '../components/map/DinnerMap'
import { Button } from '../components/ui/Button'

export function MapPage() {
  const { t } = useTranslation()
  const participants = useParticipantsStore((s) => s.participants)
  const schedule = useScheduleStore((s) => s.schedule)
  const [showHostsOnly, setShowHostsOnly] = useState(false)

  const noCoordinates = participants.every((p) => p.coordinates === null)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('map.title')}
        </h2>
        <div className="flex gap-2">
          <Button
            variant={!showHostsOnly ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setShowHostsOnly(false)}
          >
            {t('map.allParticipants')}
          </Button>
          <Button
            variant={showHostsOnly ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setShowHostsOnly(true)}
          >
            {t('map.hostsOnly')}
          </Button>
        </div>
      </div>

      {noCoordinates && participants.length > 0 && (
        <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
          {t('map.noCoordinates')}
        </div>
      )}

      <div className="flex flex-col gap-4 lg:flex-row">
        <div
          className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 lg:flex-1"
          style={{ height: 'calc(100dvh - 200px)', minHeight: '360px' }}
        >
          <DinnerMap
            participants={participants}
            schedule={schedule}
            showHostsOnly={showHostsOnly}
          />
        </div>

        <div className="flex flex-row flex-wrap gap-x-6 gap-y-2 lg:w-36 lg:flex-col lg:flex-nowrap lg:gap-2">
          <h3 className="w-full text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('map.legend')}
          </h3>
          {[
            { color: 'bg-green-500', label: t('map.starter') },
            { color: 'bg-orange-500', label: t('map.main') },
            { color: 'bg-violet-500', label: t('map.dessert') },
            { color: 'bg-gray-400', label: 'Guest' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span className={`h-3 w-3 shrink-0 rounded-full ${color}`} />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

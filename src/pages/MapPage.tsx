import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParticipantsStore } from '../store/participants'
import { useScheduleStore } from '../store/schedule'
import { DinnerMap } from '../components/map/DinnerMap'
import { MapLoadingOverlay } from '../components/map/MapLoadingOverlay'
import { Button } from '../components/ui/Button'

type RouteFilter = 'both' | 'to-main' | 'to-dessert'

export function MapPage() {
  const { t } = useTranslation()
  const participants = useParticipantsStore((s) => s.participants)
  const schedule = useScheduleStore((s) => s.schedule)
  const [showHostsOnly, setShowHostsOnly] = useState(false)
  const [showRoutes, setShowRoutes] = useState(false)
  const [routeFilter, setRouteFilter] = useState<RouteFilter>('both')
  const [routesLoading, setRoutesLoading] = useState(false)

  const noCoordinates = participants.every((p) => p.coordinates === null)

  function handleToggleRoutes() {
    if (!showRoutes) setRoutesLoading(true)
    setShowRoutes((v) => !v)
  }

  function handleFilterChange(f: RouteFilter) {
    setRoutesLoading(true)
    setRouteFilter(f)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('map.title')}
        </h2>
        <div className="flex flex-wrap gap-2">
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
          {schedule && (
            <Button
              variant={showRoutes ? 'primary' : 'secondary'}
              size="sm"
              onClick={handleToggleRoutes}
            >
              {routesLoading && showRoutes
                ? <><svg className="inline h-3.5 w-3.5 animate-spin mr-1" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>{t('map.loadingRoutes')}</>
                : <>🗺️ {t('map.showRoutes')}</>
              }
            </Button>
          )}
        </div>
      </div>

      {showRoutes && schedule && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">Routes:</span>
          {([
            { key: 'both', label: t('map.routesBoth') },
            { key: 'to-main', label: t('map.routesToMain') },
            { key: 'to-dessert', label: t('map.routesToDessert') },
          ] as { key: RouteFilter; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleFilterChange(key)}
              className={[
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                routeFilter === key
                  ? key === 'to-main'
                    ? 'bg-indigo-500 text-white'
                    : key === 'to-dessert'
                    ? 'bg-rose-500 text-white'
                    : 'bg-gray-700 text-white dark:bg-gray-200 dark:text-gray-900'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {noCoordinates && participants.length > 0 && (
        <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
          {t('map.noCoordinates')}
        </div>
      )}

      <div className="flex flex-col gap-4 lg:flex-row">
        <div
          className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 lg:flex-1"
          style={{ height: 'calc(100dvh - 200px)', minHeight: '360px' }}
        >
          <DinnerMap
            participants={participants}
            schedule={schedule}
            showHostsOnly={showHostsOnly}
            showRoutes={showRoutes}
            routeFilter={routeFilter}
            onRoutesLoaded={() => setRoutesLoading(false)}
          />
          {routesLoading && showRoutes && (
            <MapLoadingOverlay label={t('map.loadingRoutes')} />
          )}
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
          {showRoutes && (
            <>
              <div className="mt-1 h-px w-full bg-gray-200 dark:bg-gray-700" />
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="h-1 w-6 shrink-0 rounded-full bg-indigo-500" />
                {t('map.routesToMain')}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="h-1 w-6 shrink-0 rounded-full bg-rose-500" />
                {t('map.routesToDessert')}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

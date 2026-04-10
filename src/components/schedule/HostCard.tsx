import { useTranslation } from 'react-i18next'
import type { Course, Participant, Table } from '../../types'
import { Badge } from '../ui/Badge'

interface HostCardProps {
  table: Table
  participants: Participant[]
}

export function HostCard({ table, participants }: HostCardProps) {
  const { t } = useTranslation()
  const participantMap = new Map(participants.map((p) => [p.id, p]))

  const host = participantMap.get(table.hostId)
  const guests = table.guestIds
    .map((id) => participantMap.get(id))
    .filter((p): p is Participant => p !== undefined)

  const totalPersons = [host, ...guests].reduce((sum, p) => sum + (p?.count ?? 0), 0)

  const courseVariant: Record<Course, 'starter' | 'main' | 'dessert'> = {
    starter: 'starter',
    main: 'main',
    dessert: 'dessert',
  }

  const courseLabel: Record<Course, string> = {
    starter: t('schedule.starter'),
    main: t('schedule.main'),
    dessert: t('schedule.dessert'),
  }

  return (
    <div className="rounded-lg bg-gray-50 p-3 ring-1 ring-gray-200 dark:bg-gray-700/50 dark:ring-gray-600">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm" aria-hidden="true">📍</span>
        <span className="font-semibold text-gray-900 dark:text-gray-100">
          {host?.name ?? '—'}
        </span>
        <Badge variant={courseVariant[table.course]}>{courseLabel[table.course]}</Badge>
      </div>
      {host?.address && (
        <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">{host.address}</p>
      )}
      <div className="text-sm text-gray-700 dark:text-gray-300">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {t('schedule.guests')}
        </p>
        {guests.length === 0 ? (
          <p className="text-xs italic text-gray-400">—</p>
        ) : (
          <ul className="space-y-0.5">
            {guests.map((g) => (
              <li key={g.id} className="text-sm">
                {g.name}
                {g.count === 2 && (
                  <span className="ml-1 text-xs text-gray-400">(×2)</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mt-2 border-t border-gray-200 pt-2 text-right text-xs text-gray-500 dark:border-gray-600 dark:text-gray-400">
        {totalPersons} {t('participants.totalPersons').toLowerCase()}
      </div>
    </div>
  )
}

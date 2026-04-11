import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Course, Participant, Schedule, Table } from '../../types'

interface Props {
  schedule: Schedule
  participants: Participant[]
}

const COURSES: Course[] = ['starter', 'main', 'dessert']

const COURSE_STYLE: Record<Course, { bg: string; border: string; badge: string; label: string }> = {
  starter: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-700',
    badge: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    label: '🥗',
  },
  main: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-700',
    badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
    label: '🍲',
  },
  dessert: {
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    border: 'border-violet-200 dark:border-violet-700',
    badge: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
    label: '🍮',
  },
}

interface TableCardProps {
  table: Table
  index: number
  participantMap: Map<string, Participant>
}

function TableCard({ table, index, participantMap }: TableCardProps) {
  const { t } = useTranslation()
  const style = COURSE_STYLE[table.course]
  const host = participantMap.get(table.hostId)
  const guests = table.guestIds
    .map((id) => participantMap.get(id))
    .filter((p): p is Participant => p !== undefined)
  const totalPersons = [host, ...guests].reduce((sum, p) => sum + (p?.count ?? 0), 0)

  const courseKey = table.course === 'starter' ? 'starter' : table.course === 'main' ? 'main' : 'dessert'

  return (
    <div className={`flex flex-col overflow-hidden rounded-xl border ${style.border} shadow-sm`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-2.5 ${style.bg}`}>
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          {style.label} {t(`schedule.${courseKey}`)} · {t('schedule.tableNumber')} {index + 1}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${style.badge}`}>
          {totalPersons} {t('schedule.tableSize')}
        </span>
      </div>

      {/* Host */}
      <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-700">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 text-base">🏠</span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-gray-900 dark:text-gray-100">
              {host?.name ?? '—'}
            </p>
            {host?.address && (
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">{host.address}</p>
            )}
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {t('schedule.cooks')} · {host?.count ?? 0} {t('schedule.tableSize')}
            </p>
          </div>
        </div>
      </div>

      {/* Guests */}
      <div className="flex-1 px-4 py-3">
        {guests.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500">—</p>
        ) : (
          <ul className="space-y-1.5">
            {guests.map((guest) => (
              <li key={guest.id} className="flex items-center gap-2">
                <span className="text-sm">👥</span>
                <span className="truncate text-sm text-gray-700 dark:text-gray-300">
                  {guest.name}
                </span>
                <span className="ml-auto shrink-0 text-xs text-gray-400 dark:text-gray-500">
                  {guest.count} {t('schedule.tableSize')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export function ScheduleTablesView({ schedule, participants }: Props) {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<Course | 'all'>('all')

  const participantMap = new Map(participants.map((p) => [p.id, p]))

  const allTables = COURSES.flatMap((course) =>
    schedule.tables
      .filter((t) => t.course === course)
      .map((table, i) => ({ table, index: i })),
  )

  const filtered = filter === 'all' ? allTables : allTables.filter(({ table }) => table.course === filter)

  const filterButtons: { key: Course | 'all'; label: string }[] = [
    { key: 'all', label: t('schedule.allCourses') },
    { key: 'starter', label: `${COURSE_STYLE.starter.label} ${t('schedule.starter')}` },
    { key: 'main', label: `${COURSE_STYLE.main.label} ${t('schedule.main')}` },
    { key: 'dessert', label: `${COURSE_STYLE.dessert.label} ${t('schedule.dessert')}` },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Course filter */}
      <div className="flex flex-wrap gap-2">
        {filterButtons.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={[
              'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
              filter === key
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-gray-700',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table cards grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map(({ table, index }) => (
          <TableCard key={table.id} table={table} index={index} participantMap={participantMap} />
        ))}
      </div>
    </div>
  )
}

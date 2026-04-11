import { useTranslation } from 'react-i18next'
import type { Course, Participant, Schedule, Table } from '../../types'

interface Props {
  schedule: Schedule
  participants: Participant[]
}

const COURSES: Course[] = ['starter', 'main', 'dessert']

const COURSE_CONFIG: Record<
  Course,
  { emoji: string; headerBg: string; border: string; hostBadge: string }
> = {
  starter: {
    emoji: '🥗',
    headerBg: 'bg-green-500',
    border: 'border-green-200 dark:border-green-700',
    hostBadge: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  },
  main: {
    emoji: '🍲',
    headerBg: 'bg-orange-500',
    border: 'border-orange-200 dark:border-orange-700',
    hostBadge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  },
  dessert: {
    emoji: '🍮',
    headerBg: 'bg-violet-500',
    border: 'border-violet-200 dark:border-violet-700',
    hostBadge: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
  },
}

interface CourseTableRowProps {
  table: Table
  index: number
  participantMap: Map<string, Participant>
  course: Course
}

function CourseTableRow({ table, index, participantMap, course }: CourseTableRowProps) {
  const { t } = useTranslation()
  const cfg = COURSE_CONFIG[course]

  const host = participantMap.get(table.hostId)
  const guests = table.guestIds
    .map((id) => participantMap.get(id))
    .filter((p): p is Participant => p !== undefined)
  const totalPersons = [host, ...guests].reduce((sum, p) => sum + (p?.count ?? 0), 0)

  return (
    <div className={`rounded-lg border ${cfg.border} bg-white dark:bg-gray-800`}>
      {/* Table header row */}
      <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2 dark:border-gray-700">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          {t('schedule.tableNumber')} {index + 1}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {totalPersons} {t('schedule.tableSize')}
        </span>
      </div>

      <div className="px-3 py-2.5 space-y-2">
        {/* Host */}
        <div className="flex items-start gap-2">
          <span className={`mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 text-xs font-bold ${cfg.hostBadge}`}>
            🏠
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
              {host?.name ?? '—'}
            </p>
            {host?.address && (
              <p className="truncate text-xs text-gray-400 dark:text-gray-500">{host.address}</p>
            )}
          </div>
        </div>

        {/* Guests */}
        {guests.length > 0 && (
          <div className="space-y-1 pl-7">
            {guests.map((guest) => (
              <div key={guest.id} className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400">›</span>
                <span className="truncate text-xs text-gray-600 dark:text-gray-400">
                  {guest.name}
                </span>
                <span className="ml-auto shrink-0 text-xs text-gray-400 dark:text-gray-500">
                  {guest.count}p
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface CourseSectionProps {
  course: Course
  tables: Table[]
  participantMap: Map<string, Participant>
}

function CourseSection({ course, tables, participantMap }: CourseSectionProps) {
  const { t } = useTranslation()
  const cfg = COURSE_CONFIG[course]
  const courseKey = course === 'starter' ? 'starter' : course === 'main' ? 'main' : 'dessert'

  return (
    <div className="flex flex-col gap-3">
      {/* Section header */}
      <div className={`flex items-center gap-2 rounded-lg ${cfg.headerBg} px-4 py-2.5 text-white`}>
        <span className="text-lg">{cfg.emoji}</span>
        <h3 className="font-semibold">{t(`schedule.${courseKey}`)}</h3>
        <span className="ml-auto rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium">
          {tables.length} {t('schedule.tableNumber').toLowerCase()}s
        </span>
      </div>

      {/* Tables */}
      <div className="flex flex-col gap-2">
        {tables.map((table, i) => (
          <CourseTableRow
            key={table.id}
            table={table}
            index={i}
            participantMap={participantMap}
            course={course}
          />
        ))}
      </div>
    </div>
  )
}

export function ScheduleCourseView({ schedule, participants }: Props) {
  const participantMap = new Map(participants.map((p) => [p.id, p]))

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {COURSES.map((course) => (
        <CourseSection
          key={course}
          course={course}
          tables={schedule.tables.filter((t) => t.course === course)}
          participantMap={participantMap}
        />
      ))}
    </div>
  )
}

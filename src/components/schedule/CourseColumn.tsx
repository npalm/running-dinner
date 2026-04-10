import { useDroppable } from '@dnd-kit/core'
import { useTranslation } from 'react-i18next'
import type { Course, Participant, Table } from '../../types'
import { HostCard } from './HostCard'
import { GuestCard } from './GuestCard'
import { Badge } from '../ui/Badge'

interface CourseColumnProps {
  course: Course
  tables: Table[]
  participants: Participant[]
}

function TableDropZone({
  table,
  participants,
  course,
}: {
  table: Table
  participants: Participant[]
  course: Course
}) {
  const { isOver, setNodeRef } = useDroppable({ id: table.id })
  const participantMap = new Map(participants.map((p) => [p.id, p]))
  const guests = table.guestIds
    .map((id) => participantMap.get(id))
    .filter((p): p is Participant => p !== undefined)

  return (
    <div
      ref={setNodeRef}
      className={[
        'rounded-xl p-3 transition-colors',
        isOver
          ? 'bg-blue-50 ring-2 ring-blue-400 dark:bg-blue-900/20'
          : 'bg-white ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700',
      ].join(' ')}
    >
      <HostCard table={table} participants={participants} />
      {guests.length > 0 && (
        <div className="mt-2 flex flex-col gap-1.5">
          {guests.map((g) => (
            <GuestCard key={g.id} participant={g} tableId={table.id} course={course} />
          ))}
        </div>
      )}
    </div>
  )
}

export function CourseColumn({ course, tables, participants }: CourseColumnProps) {
  const { t } = useTranslation()

  const courseLabel: Record<Course, string> = {
    starter: t('schedule.starter'),
    main: t('schedule.main'),
    dessert: t('schedule.dessert'),
  }

  const courseVariant: Record<Course, 'starter' | 'main' | 'dessert'> = {
    starter: 'starter',
    main: 'main',
    dessert: 'dessert',
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3">
      <div className="flex items-center gap-2">
        <Badge variant={courseVariant[course]}>{courseLabel[course]}</Badge>
        <span className="text-xs text-gray-400">{tables.length} tables</span>
      </div>
      <div className="flex flex-col gap-3">
        {tables.map((table) => (
          <TableDropZone
            key={table.id}
            table={table}
            participants={participants}
            course={course}
          />
        ))}
      </div>
    </div>
  )
}

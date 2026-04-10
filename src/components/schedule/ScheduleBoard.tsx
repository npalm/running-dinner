import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { Course, Participant, Schedule } from '../../types'
import { useScheduleStore } from '../../store/schedule'
import { CourseColumn } from './CourseColumn'

interface ScheduleBoardProps {
  schedule: Schedule
  participants: Participant[]
}

const COURSES: Course[] = ['starter', 'main', 'dessert']

export function ScheduleBoard({ schedule, participants }: ScheduleBoardProps) {
  const moveGuest = useScheduleStore((s) => s.moveGuest)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = String(active.id)
    const overTableId = String(over.id)

    const parts = activeId.split('::')
    if (parts.length !== 2) return
    const [participantId, fromTableId] = parts

    if (fromTableId === overTableId) return

    const fromTable = schedule.tables.find((t) => t.id === fromTableId)
    const toTable = schedule.tables.find((t) => t.id === overTableId)
    if (!fromTable || !toTable) return

    if (fromTable.course !== toTable.course) return

    moveGuest(participantId, fromTableId, overTableId)
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex flex-col gap-6 md:flex-row md:gap-4">
        {COURSES.map((course) => (
          <CourseColumn
            key={course}
            course={course}
            tables={schedule.tables.filter((t) => t.course === course)}
            participants={participants}
          />
        ))}
      </div>
    </DndContext>
  )
}

import { useDraggable } from '@dnd-kit/core'
import type { Course, Participant } from '../../types'

interface GuestCardProps {
  participant: Participant
  tableId: string
  course: Course
}

export function GuestCard({ participant, tableId }: GuestCardProps) {
  const dndId = `${participant.id}::${tableId}`

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: dndId,
  })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={[
        'cursor-grab rounded-md bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-gray-200 transition-shadow',
        'dark:bg-gray-800 dark:ring-gray-600',
        isDragging ? 'opacity-50 shadow-lg' : 'hover:shadow-md',
      ].join(' ')}
    >
      <span className="font-medium text-gray-900 dark:text-gray-100">{participant.name}</span>
      {participant.count === 2 && (
        <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">(×2)</span>
      )}
    </div>
  )
}

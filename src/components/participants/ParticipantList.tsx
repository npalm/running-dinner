import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParticipantsStore } from '../../store/participants'
import type { Participant } from '../../types'
import { ParticipantCard } from './ParticipantCard'
import { ParticipantForm } from './ParticipantForm'
import { Modal } from '../ui/Modal'

export function ParticipantList() {
  const { t } = useTranslation()
  const { participants, update, remove } = useParticipantsStore()
  const [editingId, setEditingId] = useState<string | null>(null)

  const editingParticipant = participants.find((p) => p.id === editingId)
  const totalPersons = participants.reduce((sum, p) => sum + p.count, 0)

  const handleEdit = (id: string) => setEditingId(id)

  const handleSave = (data: Omit<Participant, 'id'>) => {
    if (editingId) {
      update(editingId, data)
      setEditingId(null)
    }
  }

  const handleDelete = (participant: Participant) => {
    if (window.confirm(t('participants.confirmDelete'))) {
      remove(participant.id)
    }
  }

  if (participants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-12 text-center dark:border-gray-600">
        <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
          {t('participants.emptyState')}
        </p>
        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
          {t('participants.emptyStateHint')}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="mb-3 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
        <span>
          {t('participants.total')}: <strong>{participants.length}</strong>
        </span>
        <span>
          {t('participants.totalPersons')}: <strong>{totalPersons}</strong>
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {participants.map((participant) => (
          <ParticipantCard
            key={participant.id}
            participant={participant}
            onEdit={() => handleEdit(participant.id)}
            onDelete={() => handleDelete(participant)}
          />
        ))}
      </div>

      <Modal
        open={editingId !== null}
        onClose={() => setEditingId(null)}
        title={t('participants.edit')}
      >
        {editingParticipant && (
          <ParticipantForm
            initial={editingParticipant}
            onSave={handleSave}
            onCancel={() => setEditingId(null)}
          />
        )}
      </Modal>
    </>
  )
}

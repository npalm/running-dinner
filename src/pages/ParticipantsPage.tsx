import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParticipantsStore } from '../store/participants'
import { useScheduleStore } from '../store/schedule'
import { importData } from '../lib/storage'
import { exportParticipantsCsv, downloadCsv } from '../lib/csv'
import { ParticipantList } from '../components/participants/ParticipantList'
import { ParticipantForm } from '../components/participants/ParticipantForm'
import { TestDataForm } from '../components/participants/TestDataForm'
import { CsvImport } from '../components/participants/CsvImport'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import type { Participant } from '../types'
import { geocodeAddress } from '../lib/geocoding'

export function ParticipantsPage() {
  const { t } = useTranslation()
  const { participants, add, addMany, setAll } = useParticipantsStore()
  const { setSchedule } = useScheduleStore()
  const [addOpen, setAddOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [csvImportOpen, setCsvImportOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAdd = (data: Omit<Participant, 'id'>) => {
    add(data)
    setAddOpen(false)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const result = await importData(file)
      setAll(result.participants)
      if (result.schedule) setSchedule(result.schedule)
    } catch (err) {
      console.error('Import failed:', err)
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleCsvImport = async (rows: Omit<Participant, 'id' | 'coordinates'>[]) => {
    const withCoords = await Promise.all(
      rows.map(async (row) => {
        const result = await geocodeAddress(row.address).catch(() => null)
        return { ...row, coordinates: result?.coordinates ?? null }
      }),
    )
    addMany(withCoords)
  }

  const handleExportParticipantsCsv = () => {
    const csv = exportParticipantsCsv(participants)
    downloadCsv(csv, 'deelnemers.csv')
  }

  const handleResetParticipants = () => {
    if (window.confirm(t('common.resetConfirmParticipants'))) {
      setAll([])
      setSchedule(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('participants.title')}
        </h2>
        <div className="flex flex-wrap gap-2">
          {participants.length > 0 && (
            <>
              <Button variant="ghost" size="sm" onClick={handleExportParticipantsCsv}>
                {t('organizer.exportParticipantsCsv')}
              </Button>
              <Button variant="danger" size="sm" onClick={handleResetParticipants}>
                {t('common.resetParticipants')}
              </Button>
            </>
          )}
          <Button variant="ghost" size="sm" loading={importing} onClick={handleImportClick}>
            Import JSON
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setCsvImportOpen(true)}>
            {t('csv.importButton')}
          </Button>
          <Button variant="primary" onClick={() => setAddOpen(true)}>
            {t('participants.add')}
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />

      <ParticipantList />

      <TestDataForm />

      <CsvImport
        open={csvImportOpen}
        onClose={() => setCsvImportOpen(false)}
        onImport={handleCsvImport}
      />

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={t('participants.add')}
      >
        <ParticipantForm onSave={handleAdd} onCancel={() => setAddOpen(false)} />
      </Modal>
    </div>
  )
}

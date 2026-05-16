import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { parseParticipantCsv } from '../../lib/csv'
import type { ParsedParticipantRow } from '../../lib/csv'
import type { Participant } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  onImport: (participants: Omit<Participant, 'id' | 'coordinates'>[]) => void
}

export function CsvImport({ open, onClose, onImport }: Props) {
  const { t } = useTranslation()
  const [text, setText] = useState('')
  const [parsed, setParsed] = useState<ParsedParticipantRow[]>([])
  const [isParsed, setIsParsed] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleParse = () => {
    const rows = parseParticipantCsv(text)
    setParsed(rows)
    setIsParsed(true)
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const content = ev.target?.result as string
      setText(content)
      setIsParsed(false)
      setParsed([])
    }
    reader.readAsText(file, 'utf-8')
    // Reset so same file can be re-selected
    e.target.value = ''
  }

  const validRows = parsed.filter((r) => r.participant)
  const errorRows = parsed.filter((r) => r.error)

  const handleConfirm = () => {
    const participants = validRows.map((r) => r.participant!)
    onImport(participants)
    setText('')
    setParsed([])
    setIsParsed(false)
    onClose()
  }

  const handleClose = () => {
    setText('')
    setParsed([])
    setIsParsed(false)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={t('csv.importTitle')}
    >
      <div className="space-y-4">
        {/* Format hint */}
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('csv.formatHint')}
        </p>
        <code className="block text-xs bg-gray-100 dark:bg-gray-800 rounded p-2 font-mono">
          naam,aantal,adres,email,voorkeur,dieetwensen
        </code>

        {/* File upload */}
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
            {t('csv.uploadFile')}
          </Button>
          <span className="text-sm text-gray-500">{t('csv.orPasteBelow')}</span>
          <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
        </div>

        {/* Textarea */}
        <textarea
          className="w-full h-40 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-y"
          placeholder={`naam,aantal,adres\nJan de Vries,2,Dorpsstraat 1 Eindhoven`}
          value={text}
          onChange={(e) => { setText(e.target.value); setIsParsed(false) }}
        />

        <Button onClick={handleParse} disabled={!text.trim()}>
          {t('csv.parseButton')}
        </Button>

        {/* Preview */}
        {isParsed && (
          <div className="space-y-2">
            {errorRows.length > 0 && (
              <div className="rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 space-y-1">
                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                  {t('csv.errors', { count: errorRows.length })}
                </p>
                {errorRows.map((r) => (
                  <p key={r.row} className="text-xs text-red-600 dark:text-red-400">{r.error}</p>
                ))}
              </div>
            )}

            {validRows.length > 0 && (
              <div className="rounded bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3">
                <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">
                  {t('csv.validRows', { count: validRows.length })}
                </p>
                <div className="overflow-x-auto">
                  <table className="text-xs w-full">
                    <thead>
                      <tr className="text-left text-gray-500 dark:text-gray-400">
                        <th className="pr-3 pb-1">{t('participant.name')}</th>
                        <th className="pr-3 pb-1">{t('participant.count')}</th>
                        <th className="pr-3 pb-1">{t('participant.address')}</th>
                        <th className="pb-1">{t('participant.preference')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {validRows.map((r) => (
                        <tr key={r.row} className="text-gray-800 dark:text-gray-200">
                          <td className="pr-3 py-0.5">{r.participant!.name}</td>
                          <td className="pr-3 py-0.5">{r.participant!.count}</td>
                          <td className="pr-3 py-0.5 max-w-48 truncate">{r.participant!.address}</td>
                          <td className="py-0.5">{r.participant!.preference ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {parsed.length === 0 && (
              <p className="text-sm text-gray-500">{t('csv.noRows')}</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={handleClose}>{t('common.cancel')}</Button>
          <Button
            onClick={handleConfirm}
            disabled={!isParsed || validRows.length === 0}
          >
            {t('csv.confirmImport', { count: validRows.length })}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

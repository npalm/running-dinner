import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParticipantsStore } from '../store/participants'
import { useScheduleStore } from '../store/schedule'
import { buildCards, buildHostCards, DEFAULT_TEMPLATES_NL, DEFAULT_TEMPLATES_EN } from '../lib/cards'
import type { CardTemplates } from '../lib/cards'
import { exportData } from '../lib/storage'
import { loadTemplates } from '../lib/templates'
import { PrintCards } from '../components/organizer/PrintCards'
import { HostCards } from '../components/organizer/HostCards'
import { TemplateEditor } from '../components/organizer/TemplateEditor'
import { Button } from '../components/ui/Button'

export function OrganizerPage() {
  const { t, i18n } = useTranslation()
  const participants = useParticipantsStore((s) => s.participants)
  const schedule = useScheduleStore((s) => s.schedule)

  const defaultTemplates = i18n.language === 'nl' ? DEFAULT_TEMPLATES_NL : DEFAULT_TEMPLATES_EN
  const [templates, setTemplates] = useState<CardTemplates>(() => loadTemplates(defaultTemplates))

  const cards = schedule ? buildCards(schedule, participants) : []
  const hostCards = schedule ? buildHostCards(schedule, participants) : []

  const handlePrint = () => {
    window.print()
  }

  const handleExport = () => {
    exportData(participants, schedule)
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('organizer.title')}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('organizer.subtitle')}
        </p>
      </div>

      {/* Host cards — send 2 weeks before */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('organizer.sectionHostCards')}
            </h3>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              {t('organizer.hostCardsDesc')}
            </p>
          </div>
          {hostCards.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {hostCards.length} {t('organizer.cardCount')}
              </span>
              <Button variant="primary" onClick={handlePrint}>
                🖨️ {t('organizer.printCards')}
              </Button>
            </div>
          )}
        </div>

        {!schedule ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 py-10 text-center dark:border-gray-600">
            <p className="text-gray-500 dark:text-gray-400">{t('organizer.noSchedule')}</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {t('organizer.printCardsHint')}
            </p>
            <HostCards cards={hostCards} />
          </>
        )}
      </section>

      {/* Instruction cards section */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('organizer.sectionCards')}
          </h3>
          {cards.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {cards.length} {t('organizer.cardCount')}
              </span>
              <Button variant="primary" onClick={handlePrint}>
                🖨️ {t('organizer.printCards')}
              </Button>
            </div>
          )}
        </div>

        {!schedule ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 py-10 text-center dark:border-gray-600">
            <p className="text-gray-500 dark:text-gray-400">{t('organizer.noSchedule')}</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {t('organizer.printCardsHint')}
            </p>
            <PrintCards cards={cards} templates={templates} />
          </>
        )}
      </section>

      {/* Template editor */}
      <section className="flex flex-col gap-4 rounded-xl border border-gray-200 p-5 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('organizer.sectionTemplates')}
        </h3>
        <TemplateEditor templates={templates} onChange={setTemplates} />
      </section>

      {/* Export section */}
      <section className="flex flex-col gap-3 rounded-xl border border-gray-200 p-5 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('organizer.sectionExport')}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Exporteer alle deelnemers en de indeling als JSON bestand.
        </p>
        <div>
          <Button variant="secondary" onClick={handleExport}>
            📥 {t('organizer.exportJson')}
          </Button>
        </div>
      </section>
    </div>
  )
}

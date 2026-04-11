import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParticipantsStore } from '../store/participants'
import { useScheduleStore } from '../store/schedule'
import { buildCards, buildHostCards, DEFAULT_TEMPLATES_NL, DEFAULT_TEMPLATES_EN } from '../lib/cards'
import type { CardTemplates } from '../lib/cards'
import { exportData } from '../lib/storage'
import { loadTemplates } from '../lib/templates'
import { loadHostTemplate } from '../lib/hostTemplates'
import { PrintCards } from '../components/organizer/PrintCards'
import { HostCards } from '../components/organizer/HostCards'
import { TemplateEditor } from '../components/organizer/TemplateEditor'
import { Collapsible } from '../components/ui/Collapsible'
import { Button } from '../components/ui/Button'

export function OrganizerPage() {
  const { t, i18n } = useTranslation()
  const participants = useParticipantsStore((s) => s.participants)
  const schedule = useScheduleStore((s) => s.schedule)

  const defaultTemplates = i18n.language === 'nl' ? DEFAULT_TEMPLATES_NL : DEFAULT_TEMPLATES_EN
  const [templates, setTemplates] = useState<CardTemplates>(() => loadTemplates(defaultTemplates))
  const [hostTemplate, setHostTemplate] = useState(() => loadHostTemplate())

  const cards = schedule ? buildCards(schedule, participants) : []
  const hostCards = schedule ? buildHostCards(schedule, participants) : []

  const handleExport = () => {
    exportData(participants, schedule)
  }

  const noSchedule = (
    <div className="rounded-lg border-2 border-dashed border-gray-300 py-8 text-center dark:border-gray-600">
      <p className="text-gray-500 dark:text-gray-400">{t('organizer.noSchedule')}</p>
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('organizer.title')}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('organizer.subtitle')}
        </p>
      </div>

      {/* Host cards — send 2 weeks before */}
      <Collapsible
        title={t('organizer.sectionHostCards')}
        subtitle={t('organizer.sectionHostCardsSubtitle')}
        badge={schedule ? String(hostCards.length) : undefined}
      >
        {!schedule ? noSchedule : (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {t('organizer.printCardsHint')}
            </p>
            <HostCards
              cards={hostCards}
              template={hostTemplate}
              onTemplateChange={setHostTemplate}
            />
          </div>
        )}
      </Collapsible>

      {/* Evening routing cards */}
      <Collapsible
        title={t('organizer.sectionCards')}
        subtitle={t('organizer.sectionCardsSubtitle')}
        badge={schedule ? String(cards.length) : undefined}
      >
        {!schedule ? noSchedule : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {t('organizer.printCardsHint')}
              </p>
              {cards.length > 0 && (
                <Button variant="primary" size="sm" onClick={() => window.print()}>
                  🖨️ {t('organizer.printCards')}
                </Button>
              )}
            </div>
            <PrintCards cards={cards} templates={templates} />
          </div>
        )}
      </Collapsible>

      {/* Message templates for evening cards */}
      <Collapsible
        title={t('organizer.sectionTemplates')}
        subtitle="Pas de tekst op de avondkaartjes aan"
      >
        <TemplateEditor templates={templates} onChange={setTemplates} />
      </Collapsible>

      {/* Export */}
      <Collapsible title={t('organizer.sectionExport')}>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Exporteer alle deelnemers en de indeling als JSON bestand.
          </p>
          <div>
            <Button variant="secondary" onClick={handleExport}>
              📥 {t('organizer.exportJson')}
            </Button>
          </div>
        </div>
      </Collapsible>
    </div>
  )
}

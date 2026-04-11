import { useTranslation } from 'react-i18next'
import type { CardData, CardTemplates } from '../../lib/cards'
import { applyTemplate } from '../../lib/cards'

interface Props {
  cards: CardData[]
  templates: CardTemplates
}

const TYPE_LABEL: Record<CardData['type'], string> = {
  welcome: '🎉 Welkomst',
  'starter-to-main': '🥗 → 🍲',
  'main-to-dessert': '🍲 → 🍮',
}

function InstructionCard({ card, template }: { card: CardData; template: string }) {
  const message = applyTemplate(template, card.householdName)

  return (
    <div
      className="print-card"
      style={{
        width: '95mm',
        minHeight: '130mm',
        boxSizing: 'border-box',
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        padding: '8mm 8mm 6mm',
        display: 'flex',
        flexDirection: 'column',
        gap: '4mm',
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
        backgroundColor: '#fff',
        position: 'relative',
      }}
    >
      {/* Organizer label — top right corner */}
      <div
        style={{
          position: 'absolute',
          top: '3mm',
          right: '4mm',
          fontSize: '7pt',
          color: '#9ca3af',
          textAlign: 'right',
          maxWidth: '60mm',
          lineHeight: 1.3,
        }}
      >
        <span style={{ fontWeight: 700 }}>{TYPE_LABEL[card.type]}</span>
        <br />
        {card.organizerLabel.split('·').pop()?.trim()}
      </div>

      {/* Decorative top line */}
      <div
        style={{
          height: '3px',
          borderRadius: '2px',
          background:
            card.type === 'welcome'
              ? '#22c55e'
              : card.type === 'starter-to-main'
                ? '#f97316'
                : '#8b5cf6',
          marginBottom: '2mm',
        }}
      />

      {/* Message */}
      <p
        style={{
          fontSize: '10pt',
          color: '#374151',
          lineHeight: 1.5,
          flex: 1,
          paddingRight: '30mm', // avoid overlap with organizer label
        }}
      >
        {message}
      </p>

      {/* Next address box */}
      <div
        style={{
          border: '2px solid #374151',
          borderRadius: '6px',
          padding: '4mm 5mm',
          fontSize: '13pt',
          fontWeight: 700,
          color: '#111827',
          lineHeight: 1.4,
          wordBreak: 'break-word',
        }}
      >
        {card.nextAddress}
      </div>

      {/* Footer */}
      <p style={{ fontSize: '9pt', color: '#6b7280', marginTop: '1mm' }}>
        Tot straks! 🍽️
      </p>
    </div>
  )
}

export function PrintCards({ cards, templates }: Props) {
  const { t } = useTranslation()

  if (cards.length === 0) {
    return (
      <p className="text-sm text-gray-400 dark:text-gray-500">
        {t('organizer.noCards')}
      </p>
    )
  }

  const templateForCard = (card: CardData): string => {
    if (card.type === 'welcome') return templates.welcome
    if (card.type === 'starter-to-main') return templates.starterToMain
    return templates.mainToDessert
  }

  return (
    <>
      {/* Print styles — injected as a style tag, only active during print */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #print-cards-root, #print-cards-root * { visibility: visible !important; }
          #print-cards-root {
            position: fixed !important;
            top: 0; left: 0;
            width: 100%; height: 100%;
          }
          @page { size: A4 portrait; margin: 8mm; }
          .print-card { border: 1px solid #d1d5db !important; }
          .print-page-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            grid-template-rows: 1fr 1fr !important;
            gap: 6mm !important;
            width: 194mm !important;
            height: 281mm !important;
            page-break-after: always !important;
          }
          .print-cut-line {
            border: 1px dashed #d1d5db !important;
          }
        }
      `}</style>

      <div id="print-cards-root">
        {/* Group cards into pages of 4 */}
        {Array.from({ length: Math.ceil(cards.length / 4) }, (_, pageIdx) => {
          const pageCards = cards.slice(pageIdx * 4, pageIdx * 4 + 4)
          return (
            <div
              key={pageIdx}
              className="print-page-grid mb-4 grid grid-cols-2 gap-3"
            >
              {pageCards.map((card) => (
                <div key={`${card.householdId}-${card.type}`} className="print-cut-line rounded-lg">
                  <InstructionCard card={card} template={templateForCard(card)} />
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </>
  )
}

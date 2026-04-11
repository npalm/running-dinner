import { useState } from 'react'
import type { CardData, CardTemplates } from '../../lib/cards'
import { applyTemplate } from '../../lib/cards'

interface Props {
  cards: CardData[]
  templates: CardTemplates
}

const TYPE_LABEL: Record<CardData['type'], string> = {
  welcome: '🍽️ Start',
  'starter-to-main': '🥗 → 🍲',
  'main-to-dessert': '🍲 → 🍮',
}

/** Keep only the street + number; drop Dutch postcode and city. */
function streetOnly(address: string): string {
  return address.replace(/,?\s*\d{4}\s*[A-Z]{2}\b.*/i, '').replace(/,.*$/, '').trim()
}

function templateForCard(card: CardData, templates: CardTemplates): string {
  if (card.type === 'welcome') return templates.welcome
  if (card.type === 'starter-to-main') return templates.starterToMain
  return templates.mainToDessert
}

function emailHref(card: CardData, templates: CardTemplates): string {
  const subject = encodeURIComponent(`Running Dinner – ${TYPE_LABEL[card.type]}`)
  const tmpl = templateForCard(card, templates)
  const message = applyTemplate(tmpl, card.householdName)
  const body = encodeURIComponent(`${message}\n\n📍 ${card.nextAddress}`)
  return `mailto:?subject=${subject}&body=${body}`
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
        gap: '3mm',
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
        backgroundColor: '#fff',
        position: 'relative',
      }}
    >
      <div style={{ position: 'absolute', top: '4mm', right: '4mm', fontSize: '7pt', color: '#9ca3af', textAlign: 'right', lineHeight: 1.3 }}>
        <span style={{ fontWeight: 700 }}>{TYPE_LABEL[card.type]}</span>
        <br />
        {streetOnly(card.organizerLabel.split('·').pop()?.trim() ?? '')}
      </div>

      <p style={{ fontSize: '10pt', color: '#374151', lineHeight: 1.6, paddingRight: '32mm', whiteSpace: 'pre-line', marginTop: '6mm' }}>
        {message}
      </p>

      <div style={{ textAlign: 'center', fontSize: '13pt', fontWeight: 700, color: '#111827', lineHeight: 1.4, wordBreak: 'break-word', marginTop: 'auto', marginBottom: 'auto', padding: '4mm 0' }}>
        {streetOnly(card.nextAddress)}
      </div>

      <p style={{ fontSize: '9pt', color: '#6b7280', marginTop: '1mm' }}>
        Veel plezier! 🍽️
      </p>
    </div>
  )
}

function CompactRow({ card, templates }: { card: CardData; templates: CardTemplates }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-mono text-gray-500 dark:text-gray-400">{TYPE_LABEL[card.type]}</span>
          <span className="font-semibold text-gray-900 dark:text-white">{card.householdName}</span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          📍 {streetOnly(card.nextAddress)}
          <span className="mx-1.5 text-gray-300 dark:text-gray-600">·</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">bezorgen: {streetOnly(card.deliveryAddress)}</span>
        </p>
      </div>
      <a
        href={emailHref(card, templates)}
        target="_blank"
        rel="noreferrer"
        className="shrink-0 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-orange-900/20 dark:hover:text-orange-400 transition-colors"
      >
        ✉️ E-mail
      </a>
    </div>
  )
}

export function PrintCards({ cards, templates }: Props) {
  const [view, setView] = useState<'compact' | 'cards'>('compact')

  if (cards.length === 0) {
    return <p className="text-sm text-gray-400 dark:text-gray-500">Geen kaartjes te genereren.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <button onClick={() => setView('compact')} className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${view === 'compact' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`}>
          📋 Lijst
        </button>
        <button onClick={() => setView('cards')} className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${view === 'cards' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`}>
          🪪 Kaartjes
        </button>
      </div>

      {view === 'compact' ? (
        <div className="flex flex-col gap-2">
          {cards.map((card) => (
            <CompactRow key={`${card.householdId}-${card.type}`} card={card} templates={templates} />
          ))}
        </div>
      ) : (
        <>
          <style>{`
            @media print {
              body * { visibility: hidden !important; }
              #print-cards-root, #print-cards-root * { visibility: visible !important; }
              #print-cards-root { position: fixed !important; top: 0; left: 0; width: 100%; height: 100%; }
              @page { size: A4 portrait; margin: 8mm; }
              .print-card { border: 1px solid #d1d5db !important; }
              .print-page-grid { display: grid !important; grid-template-columns: 1fr 1fr !important; grid-template-rows: 1fr 1fr !important; gap: 6mm !important; width: 194mm !important; height: 281mm !important; page-break-after: always !important; }
            }
          `}</style>
          <div id="print-cards-root">
            {Array.from({ length: Math.ceil(cards.length / 4) }, (_, pageIdx) => {
              const pageCards = cards.slice(pageIdx * 4, pageIdx * 4 + 4)
              return (
                <div key={pageIdx} className="print-page-grid mb-4 grid grid-cols-2 gap-3">
                  {pageCards.map((card) => (
                    <div key={`${card.householdId}-${card.type}`} className="flex flex-col gap-2">
                      <InstructionCard card={card} template={templateForCard(card, templates)} />
                      <a href={emailHref(card, templates)} target="_blank" rel="noreferrer"
                        className="print:hidden inline-flex items-center gap-1.5 self-start rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-600 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 transition-colors">
                        ✉️ Opstellen als e-mail
                      </a>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

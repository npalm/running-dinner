import { useState } from 'react'
import type { HostCardData } from '../../lib/cards'
import { COURSE_NL } from '../../lib/cards'
import { applyHostTemplate, saveHostTemplate, DEFAULT_GUEST_TEMPLATE } from '../../lib/hostTemplates'

interface Props {
  cards: HostCardData[]
  template: string
  onTemplateChange: (t: string) => void
}

const COURSE_EMOJI: Record<string, string> = {
  starter: '🥗',
  main: '🍲',
  dessert: '🍮',
}

function buildText(card: HostCardData, template: string): string {
  if (card.course === null) {
    return applyHostTemplate(DEFAULT_GUEST_TEMPLATE, card.hostName, '', '', 0, [], false)
  }
  return applyHostTemplate(
    template,
    card.hostName,
    COURSE_NL[card.course],
    COURSE_EMOJI[card.course],
    card.guestCount,
    card.dietaryWishes,
    card.isStarterHost,
  )
}

function courseDisplay(card: HostCardData): { label: string; emoji: string } {
  if (card.course === null) return { label: 'Gast', emoji: '🍽️' }
  return { label: COURSE_NL[card.course], emoji: COURSE_EMOJI[card.course] }
}

function emailHref(card: HostCardData, template: string): string {
  const { label } = courseDisplay(card)
  const subject = encodeURIComponent(`Running Dinner – ${card.course ? `Kookkaartje ${label}` : 'Welkom!'}`)
  const body = encodeURIComponent(buildText(card, template))
  return `mailto:${card.hostEmail ?? ''}?subject=${subject}&body=${body}`
}

function HostCard({ card, template }: { card: HostCardData; template: string }) {
  const { label, emoji } = courseDisplay(card)

  return (
    <div
      className="host-card print-card"
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
        <span style={{ fontWeight: 700 }}>{emoji} {label}</span>
      </div>
      <p style={{ fontSize: '9.5pt', color: '#374151', lineHeight: 1.65, paddingRight: '28mm', whiteSpace: 'pre-line', marginTop: '6mm' }}>
        {buildText(card, template)}
      </p>
      <p style={{ fontSize: '9pt', color: '#6b7280', marginTop: 'auto' }}>
        Met vriendelijke groet, de organisatie 🍽️
      </p>
    </div>
  )
}

function CompactRow({ card, template }: { card: HostCardData; template: string }) {
  const { label, emoji } = courseDisplay(card)
  const guestWord = card.guestCount === 1 ? 'gast' : 'gasten'

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-base">{emoji}</span>
          <span className="font-semibold text-gray-900 dark:text-white">{card.hostName}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs ${card.course === null ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
            {label}
          </span>
          {card.course !== null && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {card.guestCount} {guestWord}
            </span>
          )}
          {!card.isStarterHost && (
            <span className="text-xs text-orange-600 dark:text-orange-400" title="Ontvangt dag-van kaartje">
              📮 dag zelf
            </span>
          )}
        </div>
        {card.dietaryWishes.length > 0 ? (
          <p className="text-sm text-amber-700 dark:text-amber-400">⚠️ {card.dietaryWishes.join(' · ')}</p>
        ) : card.course !== null ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">Geen dieetwensen</p>
        ) : null}
      </div>
      <a
        href={emailHref(card, template)}
        target="_blank"
        rel="noreferrer"
        className="shrink-0 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-orange-900/20 dark:hover:text-orange-400 transition-colors"
        title="Opstellen in e-mailprogramma"
      >
        ✉️ E-mail
      </a>
    </div>
  )
}

function TemplateSection({ template, onChange }: { template: string; onChange: (t: string) => void }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800/60 transition-colors"
      >
        <span>✏️ Berichttekst koks aanpassen</span>
        <span className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden>▾</span>
      </button>
      {open && (
        <div className="border-t border-gray-200 p-4 dark:border-gray-700 flex flex-col gap-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Gebruik: <code className="rounded bg-gray-100 px-1 dark:bg-gray-700">[namen]</code>{' '}
            <code className="rounded bg-gray-100 px-1 dark:bg-gray-700">[gang]</code>{' '}
            <code className="rounded bg-gray-100 px-1 dark:bg-gray-700">[emoji]</code>{' '}
            <code className="rounded bg-gray-100 px-1 dark:bg-gray-700">[aantal]</code>{' '}
            <code className="rounded bg-gray-100 px-1 dark:bg-gray-700">[gasten]</code>{' '}
            <code className="rounded bg-gray-100 px-1 dark:bg-gray-700">[dieetwensen]</code>{' '}
            <code className="rounded bg-gray-100 px-1 dark:bg-gray-700">[dagzelf]</code>
            {' '}— <span className="italic">[dagzelf] is leeg voor voorgerecht-koks, voor anderen staat er het dag-van bericht</span>
          </p>
          <textarea
            rows={10}
            value={template}
            onChange={(e) => {
              onChange(e.target.value)
              saveHostTemplate(e.target.value)
            }}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-xs text-gray-900 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
      )}
    </div>
  )
}

export function HostCards({ cards, template, onTemplateChange }: Props) {
  const [view, setView] = useState<'compact' | 'cards'>('compact')

  if (cards.length === 0) return null

  const order: Record<string, number> = { starter: 0, main: 1, dessert: 2 }
  const sorted = [...cards].sort((a, b) => {
    const ao = a.course === null ? 3 : order[a.course]
    const bo = b.course === null ? 3 : order[b.course]
    return ao - bo
  })

  const cookCards = sorted.filter((c) => c.course !== null)
  const guestCards = sorted.filter((c) => c.course === null)

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
        <div className="flex flex-col gap-4">
          {cookCards.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                👨‍🍳 Koken ({cookCards.length})
              </p>
              {cookCards.map((card) => (
                <CompactRow key={`${card.hostId}-${String(card.course)}`} card={card} template={template} />
              ))}
            </div>
          )}
          {guestCards.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                🍽️ Kookt niet — ontvangen ook een kaartje ({guestCards.length})
              </p>
              {guestCards.map((card) => (
                <CompactRow key={`${card.hostId}-${String(card.course)}`} card={card} template={template} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <style>{`@media print { .host-card { border: 1px solid #d1d5db !important; } }`}</style>
          {cookCards.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="print:hidden text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                👨‍🍳 Koken
              </p>
              {Array.from({ length: Math.ceil(cookCards.length / 4) }, (_, pageIdx) => {
                const pageCards = cookCards.slice(pageIdx * 4, pageIdx * 4 + 4)
                return (
                  <div key={pageIdx} className="print-page-grid mb-4 grid grid-cols-2 gap-3">
                    {pageCards.map((card) => (
                      <div key={`${card.hostId}-${String(card.course)}`} className="flex flex-col gap-2">
                        <HostCard card={card} template={template} />
                        <a href={emailHref(card, template)} target="_blank" rel="noreferrer"
                          className="print:hidden inline-flex items-center gap-1.5 self-start rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-600 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 transition-colors">
                          ✉️ Opstellen als e-mail
                        </a>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
          {guestCards.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="print:hidden text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                🍽️ Kookt niet — ontvangen ook een kaartje
              </p>
              {Array.from({ length: Math.ceil(guestCards.length / 4) }, (_, pageIdx) => {
                const pageCards = guestCards.slice(pageIdx * 4, pageIdx * 4 + 4)
                return (
                  <div key={pageIdx} className="print-page-grid mb-4 grid grid-cols-2 gap-3">
                    {pageCards.map((card) => (
                      <div key={`${card.hostId}-${String(card.course)}`} className="flex flex-col gap-2">
                        <HostCard card={card} template={template} />
                        <a href={emailHref(card, template)} target="_blank" rel="noreferrer"
                          className="print:hidden inline-flex items-center gap-1.5 self-start rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-600 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 transition-colors">
                          ✉️ Opstellen als e-mail
                        </a>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      <TemplateSection template={template} onChange={onTemplateChange} />
    </div>
  )
}

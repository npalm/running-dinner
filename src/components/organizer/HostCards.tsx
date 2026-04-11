import { useState } from 'react'
import type { HostCardData } from '../../lib/cards'
import { COURSE_NL } from '../../lib/cards'

interface Props {
  cards: HostCardData[]
}

const COURSE_EMOJI: Record<string, string> = {
  starter: '🥗',
  main: '🍲',
  dessert: '🍮',
}

function buildCardText(card: HostCardData): string {
  const courseLabel = COURSE_NL[card.course].toLowerCase()
  const emoji = COURSE_EMOJI[card.course]
  const guestWord = card.guestCount === 1 ? 'gast' : 'gasten'

  const dietLine =
    card.dietaryWishes.length > 0
      ? `Let op de volgende dieetwensen van je gasten:\n${card.dietaryWishes.map((w) => `• ${w}`).join('\n')}`
      : 'Je gasten hebben geen bijzondere dieetwensen — kook lekker los! 🍳'

  return (
    `Hoi ${card.hostName}!\n\n` +
    `Super fijn dat je meedoet met het Running Dinner! 🎉\n\n` +
    `Jij gaat deze editie het ${courseLabel} ${emoji} maken. ` +
    `Je krijgt ${card.guestCount} ${guestWord} over de vloer. ` +
    `Veel plezier met de voorbereidingen!\n\n` +
    `${dietLine}\n\n` +
    `Veel kookplezier en tot snel!`
  )
}

function emailHref(card: HostCardData): string {
  const courseLabel = COURSE_NL[card.course]
  const subject = encodeURIComponent(`Running Dinner – Kookkaartje ${courseLabel}`)
  const body = encodeURIComponent(buildCardText(card))
  return `mailto:?subject=${subject}&body=${body}`
}

function HostCard({ card }: { card: HostCardData }) {
  const courseLabel = COURSE_NL[card.course]
  const emoji = COURSE_EMOJI[card.course]

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
      <div
        style={{
          position: 'absolute',
          top: '4mm',
          right: '4mm',
          fontSize: '7pt',
          color: '#9ca3af',
          textAlign: 'right',
          lineHeight: 1.3,
        }}
      >
        <span style={{ fontWeight: 700 }}>{emoji} {courseLabel}</span>
      </div>

      <p
        style={{
          fontSize: '9.5pt',
          color: '#374151',
          lineHeight: 1.65,
          paddingRight: '28mm',
          whiteSpace: 'pre-line',
          marginTop: '6mm',
        }}
      >
        {buildCardText(card)}
      </p>

      <p style={{ fontSize: '9pt', color: '#6b7280', marginTop: 'auto' }}>
        Met vriendelijke groet, de organisatie 🍽️
      </p>
    </div>
  )
}

function CompactRow({ card }: { card: HostCardData }) {
  const courseLabel = COURSE_NL[card.course]
  const emoji = COURSE_EMOJI[card.course]
  const guestWord = card.guestCount === 1 ? 'gast' : 'gasten'

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-base">{emoji}</span>
          <span className="font-semibold text-gray-900 dark:text-white">{card.hostName}</span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            {courseLabel}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {card.guestCount} {guestWord}
          </span>
        </div>
        {card.dietaryWishes.length > 0 ? (
          <p className="text-sm text-amber-700 dark:text-amber-400">
            ⚠️ {card.dietaryWishes.join(' · ')}
          </p>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500">Geen dieetwensen</p>
        )}
      </div>
      <a
        href={emailHref(card)}
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

export function HostCards({ cards }: Props) {
  const [view, setView] = useState<'compact' | 'cards'>('compact')

  if (cards.length === 0) return null

  const order: Record<string, number> = { starter: 0, main: 1, dessert: 2 }
  const sorted = [...cards].sort((a, b) => order[a.course] - order[b.course])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <button
          onClick={() => setView('compact')}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            view === 'compact'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          📋 Lijst
        </button>
        <button
          onClick={() => setView('cards')}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            view === 'cards'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          🪪 Kaartjes
        </button>
      </div>

      {view === 'compact' ? (
        <div className="flex flex-col gap-2">
          {sorted.map((card) => (
            <CompactRow key={`${card.hostId}-${card.course}`} card={card} />
          ))}
        </div>
      ) : (
        <>
          <style>{`@media print { .host-card { border: 1px solid #d1d5db !important; } }`}</style>
          {Array.from({ length: Math.ceil(sorted.length / 4) }, (_, pageIdx) => {
            const pageCards = sorted.slice(pageIdx * 4, pageIdx * 4 + 4)
            return (
              <div key={pageIdx} className="print-page-grid mb-4 grid grid-cols-2 gap-3">
                {pageCards.map((card) => (
                  <div key={`${card.hostId}-${card.course}`} className="flex flex-col gap-2">
                    <HostCard card={card} />
                    <a
                      href={emailHref(card)}
                      target="_blank"
                      rel="noreferrer"
                      className="print:hidden inline-flex items-center gap-1.5 self-start rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-600 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 transition-colors"
                    >
                      ✉️ Opstellen als e-mail
                    </a>
                  </div>
                ))}
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}

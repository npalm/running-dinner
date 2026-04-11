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
        gap: '4mm',
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
        backgroundColor: '#fff',
        position: 'relative',
      }}
    >
      {/* Organizer label */}
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

      {/* Message */}
      <p
        style={{
          fontSize: '10pt',
          color: '#374151',
          lineHeight: 1.6,
          paddingRight: '28mm',
          whiteSpace: 'pre-line',
          marginTop: '6mm',
        }}
      >
        {`Hallo!\n\nJij kookt het ${courseLabel.toLowerCase()} ${emoji} voor ${card.guestCount} ${card.guestCount === 1 ? 'gast' : 'gasten'}.`}
      </p>

      {/* Dietary wishes */}
      <div
        style={{
          marginTop: 'auto',
          marginBottom: 'auto',
          padding: '4mm 0',
          textAlign: 'center',
        }}
      >
        {card.dietaryWishes.length > 0 ? (
          <>
            <p
              style={{
                fontSize: '9pt',
                color: '#6b7280',
                marginBottom: '3mm',
                fontWeight: 600,
              }}
            >
              ⚠️ Dieetwensen van je gasten:
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {card.dietaryWishes.map((wish, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: '11pt',
                    fontWeight: 700,
                    color: '#111827',
                    lineHeight: 1.6,
                  }}
                >
                  {wish}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p
            style={{
              fontSize: '10pt',
              fontWeight: 700,
              color: '#111827',
            }}
          >
            Geen bijzondere dieetwensen 🎉
          </p>
        )}
      </div>

      {/* Footer */}
      <p style={{ fontSize: '9pt', color: '#6b7280', marginTop: '1mm' }}>
        Veel kookplezier! 🍳
      </p>
    </div>
  )
}

export function HostCards({ cards }: Props) {
  if (cards.length === 0) return null

  // Sort: starter → main → dessert
  const order = { starter: 0, main: 1, dessert: 2 }
  const sorted = [...cards].sort((a, b) => order[a.course] - order[b.course])

  return (
    <>
      <style>{`
        @media print {
          .host-card { border: 1px solid #d1d5db !important; }
        }
      `}</style>
      {Array.from({ length: Math.ceil(sorted.length / 4) }, (_, pageIdx) => {
        const pageCards = sorted.slice(pageIdx * 4, pageIdx * 4 + 4)
        return (
          <div key={pageIdx} className="print-page-grid mb-4 grid grid-cols-2 gap-3">
            {pageCards.map((card) => (
              <HostCard key={`${card.hostId}-${card.course}`} card={card} />
            ))}
          </div>
        )
      })}
    </>
  )
}

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  mode: 'generate' | 'optimize'
  progress?: number      // current attempt (0-30)
  totalAttempts?: number // 30
  bestScore?: number     // duplicate pairs in best so far
}

const TOTAL = 30

const TABLE_POSITIONS = [
  { x: 300, y: 120 }, // top  — starter
  { x: 120, y: 420 }, // bottom-left — main
  { x: 480, y: 420 }, // bottom-right — dessert
]

const COURSE_COLORS = ['#22c55e', '#f97316', '#a855f7'] // green, orange, purple

/** Evenly space N runners around a table circle */
function runnerPositions(tableX: number, tableY: number, n: number, t: number, radius = 42) {
  return Array.from({ length: n }, (_, i) => {
    const angle = (2 * Math.PI * i) / n + t * 0.8
    return {
      x: tableX + radius * Math.cos(angle),
      y: tableY + radius * Math.sin(angle),
    }
  })
}

/** Interpolate a runner between fromTable and toTable based on phase [0,1] */
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

export function GeneratingAnimation({ mode, progress = 0, totalAttempts = TOTAL, bestScore }: Props) {
  const { t } = useTranslation()
  const messages: string[] = t('schedule.animMessages', { returnObjects: true }) as string[]

  const [tick, setTick] = useState(0)
  const [msgIndex, setMsgIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setTick((p) => p + 1), 50)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((p) => (p + 1) % messages.length)
    }, 1800)
    return () => clearInterval(interval)
  }, [messages.length])

  const time = tick * 0.05
  const isOptimize = mode === 'optimize'
  const pct = isOptimize ? Math.min(progress / totalAttempts, 1) : 0
  // Arc for progress ring around center of SVG (cx=300, cy=280)
  const ARC_R = 55
  const circumference = 2 * Math.PI * ARC_R
  const dashOffset = circumference * (1 - pct)
  // Pair 0→1, 1→2, 2→0 (cycling clockwise)
  // Phase drives position along the arc
  const runners = [0, 1, 2, 3, 4, 5].map((i) => {
    const fromIdx = i % 3
    const toIdx = (i + 1) % 3
    const phase = ((time * 0.4 + i * 0.33) % 1)
    const from = TABLE_POSITIONS[fromIdx]
    const to = TABLE_POSITIONS[toIdx]
    // Use sine easing for natural movement
    const eased = (1 - Math.cos(phase * Math.PI)) / 2
    return {
      x: lerp(from.x, to.x, eased),
      y: lerp(from.y, to.y, eased),
      color: COURSE_COLORS[fromIdx],
      size: i < 3 ? 7 : 5,
    }
  })

  // Orbiting dots around each table
  const orbiters = TABLE_POSITIONS.map((pos, tableIdx) => ({
    pos,
    color: COURSE_COLORS[tableIdx],
    dots: runnerPositions(pos.x, pos.y, 4, time + tableIdx * 1.2),
  }))

  // Pulsing table rings
  const pulseScale = 1 + 0.06 * Math.sin(time * 3)

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-10">
      {/* SVG animation */}
      <div className="w-full max-w-xs">
        <svg viewBox="0 0 600 560" className="w-full" aria-hidden="true">
          {/* Connection lines between tables */}
          {TABLE_POSITIONS.map((from, i) => {
            const to = TABLE_POSITIONS[(i + 1) % 3]
            return (
              <line
                key={i}
                x1={from.x} y1={from.y}
                x2={to.x} y2={to.y}
                stroke="#e5e7eb"
                strokeWidth="1.5"
                strokeDasharray="6 4"
                className="dark:stroke-gray-600"
              />
            )
          })}
          {/* Also connect 0→2 */}
          <line
            x1={TABLE_POSITIONS[0].x} y1={TABLE_POSITIONS[0].y}
            x2={TABLE_POSITIONS[2].x} y2={TABLE_POSITIONS[2].y}
            stroke="#e5e7eb"
            strokeWidth="1.5"
            strokeDasharray="6 4"
            className="dark:stroke-gray-600"
          />

          {/* Tables */}
          {TABLE_POSITIONS.map(({ x, y }, i) => (
            <g key={i}>
              {/* Pulse ring */}
              <circle
                cx={x} cy={y}
                r={32 * pulseScale}
                fill="none"
                stroke={COURSE_COLORS[i]}
                strokeWidth="1.5"
                opacity="0.25"
              />
              {/* Table circle */}
              <circle cx={x} cy={y} r={26} fill={COURSE_COLORS[i]} opacity="0.15" />
              <circle cx={x} cy={y} r={26} fill="none" stroke={COURSE_COLORS[i]} strokeWidth="2" />
              {/* Table icon — plate emoji substitute */}
              <text
                x={x} y={y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="22"
              >
                {['🍽️', '🍲', '🍰'][i]}
              </text>
              {/* Course label */}
              <text
                x={x}
                y={y + 44}
                textAnchor="middle"
                fontSize="11"
                fill={COURSE_COLORS[i]}
                fontWeight="600"
              >
                {[
                  t('schedule.starter'),
                  t('schedule.main'),
                  t('schedule.dessert'),
                ][i]}
              </text>
              {/* Orbiting dots (seated guests) */}
              {orbiters[i].dots.map((dot, d) => (
                <circle key={d} cx={dot.x} cy={dot.y} r="4" fill={COURSE_COLORS[i]} opacity="0.6" />
              ))}
            </g>
          ))}

          {/* Running people between tables */}
          {runners.map((r, i) => (
            <g key={i}>
              {/* Body */}
              <circle cx={r.x} cy={r.y} r={r.size} fill={r.color} />
              {/* Head */}
              <circle cx={r.x} cy={r.y - r.size * 1.6} r={r.size * 0.65} fill={r.color} opacity="0.9" />
              {/* Motion trail */}
              <circle cx={r.x} cy={r.y} r={r.size * 1.5} fill={r.color} opacity="0.12" />
            </g>
          ))}

          {/* Optimize mode: progress ring in center of triangle */}
          {isOptimize && (
            <g>
              {/* Background ring */}
              <circle cx="300" cy="280" r={ARC_R} fill="none" stroke="#e5e7eb" strokeWidth="6"
                className="dark:stroke-gray-700" />
              {/* Progress arc */}
              <circle
                cx="300" cy="280" r={ARC_R}
                fill="none"
                stroke={bestScore === 0 ? '#22c55e' : '#3b82f6'}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 300 280)"
                style={{ transition: 'stroke-dashoffset 0.3s ease, stroke 0.3s ease' }}
              />
              {/* Attempt counter */}
              <text x="300" y="274" textAnchor="middle" fontSize="18" fontWeight="700" fill="#374151"
                className="dark:fill-gray-200">
                {progress}
              </text>
              <text x="300" y="290" textAnchor="middle" fontSize="10" fill="#6b7280">
                / {totalAttempts}
              </text>
              {/* Score indicator */}
              {bestScore !== undefined && bestScore < Infinity && (
                <text x="300" y="308" textAnchor="middle" fontSize="10"
                  fill={bestScore === 0 ? '#22c55e' : '#f97316'} fontWeight="600">
                  {bestScore === 0 ? '✓ perfect' : `${bestScore} ×`}
                </text>
              )}
            </g>
          )}
        </svg>
      </div>

      {/* Cycling message */}
      <div className="flex flex-col items-center gap-2">
        <p
          key={msgIndex}
          className="text-center text-base font-medium text-gray-700 dark:text-gray-300"
          style={{ animation: 'fadeInUp 0.4s ease' }}
        >
          {messages[msgIndex]}
        </p>
        {/* Progress bar for optimize */}
        {isOptimize && (
          <div className="h-1.5 w-48 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-300 ease-out"
              style={{ width: `${pct * 100}%` }}
            />
          </div>
        )}
        {/* Bouncing dots */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="inline-block h-2 w-2 rounded-full bg-blue-500"
              style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40%            { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  )
}

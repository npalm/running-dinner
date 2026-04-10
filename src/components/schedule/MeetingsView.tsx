import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Participant, Course, Schedule } from '../../types'
import type { MeetingsSummary } from '../../lib/schedule'

interface Props {
  summary: MeetingsSummary
  participants: Participant[]
  schedule: Schedule
}

type TabId = 'list' | 'journey' | 'network' | 'matrix'

const COURSE_ORDER: Course[] = ['starter', 'main', 'dessert']

const COURSE_COLORS: Record<Course, string> = {
  starter: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  main: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  dessert: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
}

const COURSE_BG_COLORS: Record<Course, string> = {
  starter: 'bg-green-50 dark:bg-green-900/10',
  main: 'bg-orange-50 dark:bg-orange-900/10',
  dessert: 'bg-purple-50 dark:bg-purple-900/10',
}

const COURSE_HOST_BG: Record<Course, string> = {
  starter: 'bg-green-100 dark:bg-green-900/30',
  main: 'bg-orange-100 dark:bg-orange-900/30',
  dessert: 'bg-purple-100 dark:bg-purple-900/30',
}

const NODE_COLORS: Record<Course | 'none', string> = {
  starter: '#22c55e',
  main: '#f97316',
  dessert: '#a855f7',
  none: '#9ca3af',
}

/** Color a matrix cell by how many times two people meet. */
function cellColor(count: number): string {
  if (count === 0) return 'bg-gray-50 dark:bg-gray-800'
  if (count === 1) return 'bg-green-200 dark:bg-green-800'
  if (count === 2) return 'bg-orange-300 dark:bg-orange-700'
  return 'bg-red-400 dark:bg-red-700'
}

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

export function MeetingsView({ summary, participants, schedule }: Props) {
  const { t } = useTranslation()
  const [tab, setTab] = useState<TabId>('network')
  const [networkShowAll, setNetworkShowAll] = useState(true)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  const pMap = new Map(participants.map((p) => [p.id, p]))

  // Pairwise meeting count (includes non-duplicate pairs)
  const pairCount = new Map<string, number>()
  for (const p of participants) {
    for (const entry of summary.byParticipant.get(p.id) ?? []) {
      for (const mateId of entry.tablemates) {
        const key = [p.id, mateId].sort().join('::')
        if (!pairCount.has(key)) {
          let cnt = 0
          for (const e of summary.byParticipant.get(p.id) ?? []) {
            if (e.tablemates.includes(mateId)) cnt++
          }
          pairCount.set(key, cnt)
        }
      }
    }
  }

  function getMeetingCount(aId: string, bId: string): number {
    if (aId === bId) return -1
    const key = [aId, bId].sort().join('::')
    return pairCount.get(key) ?? 0
  }

  // Build host lookup: participantId -> course they host
  const hostCourse = new Map<string, Course>()
  for (const table of schedule.tables) {
    hostCourse.set(table.hostId, table.course)
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: 'network', label: t('schedule.network') },
    { id: 'matrix', label: t('schedule.matrix') },
    { id: 'list', label: 'Lijst' },
    { id: 'journey', label: t('schedule.journey') },
  ]

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {t('schedule.meetings')}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('schedule.meetingsHint')}</p>
        </div>
        <div className="flex gap-1 rounded-md border border-gray-200 p-1 dark:border-gray-700">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={[
                'rounded px-2 py-0.5 text-xs font-medium transition-colors',
                tab === id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Duplicate summary banner */}
      <div className={[
        'mx-4 mt-3 rounded-md px-3 py-2 text-sm',
        summary.duplicatePairs.length > 0
          ? 'bg-orange-50 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300'
          : 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      ].join(' ')}>
        {summary.duplicatePairs.length > 0 ? (
          <>⚠️ {summary.duplicatePairs.length} {t('schedule.duplicateWarning')}</>
        ) : (
          <>✓ {t('schedule.noDuplicates')}</>
        )}
      </div>

      <div className="p-4">
        {tab === 'list' && (
          <ListTab summary={summary} participants={participants} pMap={pMap} />
        )}
        {tab === 'journey' && (
          <JourneyTab schedule={schedule} participants={participants} pMap={pMap} hostCourse={hostCourse} />
        )}
        {tab === 'network' && (
          <NetworkTab
            participants={participants}
            pairCount={pairCount}
            hostCourse={hostCourse}
            showAll={networkShowAll}
            setShowAll={setNetworkShowAll}
            hoveredNode={hoveredNode}
            setHoveredNode={setHoveredNode}
          />
        )}
        {tab === 'matrix' && (
          <MatrixTab participants={participants} getMeetingCount={getMeetingCount} />
        )}
      </div>
    </div>
  )
}

/* ─── Tab: List ─────────────────────────────────────────────────────────── */

function ListTab({
  summary,
  participants,
  pMap,
}: {
  summary: MeetingsSummary
  participants: Participant[]
  pMap: Map<string, Participant>
}) {
  const { t } = useTranslation()
  return (
    <div className="space-y-3">
      {participants.map((p) => {
        const entries = (summary.byParticipant.get(p.id) ?? [])
          .slice()
          .sort((a, b) => COURSE_ORDER.indexOf(a.course) - COURSE_ORDER.indexOf(b.course))
        return (
          <div key={p.id} className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/50">
            <p className="mb-1.5 text-sm font-medium text-gray-900 dark:text-white">{p.name}</p>
            <div className="flex flex-wrap gap-2">
              {entries.map((entry) => (
                <div key={entry.course} className="flex items-start gap-1.5">
                  <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${COURSE_COLORS[entry.course]}`}>
                    {t(`schedule.${entry.course}`)}
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {entry.tablemates.map((id) => pMap.get(id)?.name ?? id).join(', ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Tab: Journey ───────────────────────────────────────────────────────── */

function JourneyTab({
  schedule,
  participants,
  pMap,
  hostCourse,
}: {
  schedule: Schedule
  participants: Participant[]
  pMap: Map<string, Participant>
  hostCourse: Map<string, Course>
}) {
  const { t } = useTranslation()

  // Build: participantId -> course -> { hostId, tablemates }
  const journey = new Map<string, Map<Course, { hostId: string; tablemates: string[] }>>()
  for (const p of participants) journey.set(p.id, new Map())

  for (const table of schedule.tables) {
    const all = [table.hostId, ...table.guestIds]
    for (const pid of all) {
      journey.get(pid)?.set(table.course, {
        hostId: table.hostId,
        tablemates: all.filter((id) => id !== pid),
      })
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="min-w-32 pb-2 pr-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
              {t('participants.name')}
            </th>
            {COURSE_ORDER.map((course) => (
              <th key={course} className="pb-2 px-2 text-left">
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${COURSE_COLORS[course]}`}>
                  {t(`schedule.${course}`)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {participants.map((p) => (
            <tr key={p.id} className="border-t border-gray-100 dark:border-gray-700">
              <td className="py-2 pr-3 text-xs font-medium text-gray-900 dark:text-white">{p.name}</td>
              {COURSE_ORDER.map((course) => {
                const info = journey.get(p.id)?.get(course)
                const isHost = hostCourse.get(p.id) === course
                const hostName = info ? (pMap.get(info.hostId)?.name ?? info.hostId) : '—'
                return (
                  <td
                    key={course}
                    className={`px-2 py-2 align-top text-xs ${isHost ? COURSE_HOST_BG[course] : COURSE_BG_COLORS[course]} rounded`}
                  >
                    {info ? (
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {isHost && <span className="mr-0.5">📍</span>}
                          {hostName}
                        </p>
                        <p className="mt-0.5 text-gray-500 dark:text-gray-400">
                          {info.tablemates.map((id) => pMap.get(id)?.name ?? id).join(', ')}
                        </p>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ─── Tab: Network ───────────────────────────────────────────────────────── */

function NetworkTab({
  participants,
  pairCount,
  hostCourse,
  showAll,
  setShowAll,
  hoveredNode,
  setHoveredNode,
}: {
  participants: Participant[]
  pairCount: Map<string, number>
  hostCourse: Map<string, Course>
  showAll: boolean
  setShowAll: (v: boolean) => void
  hoveredNode: string | null
  setHoveredNode: (id: string | null) => void
}) {
  const { t } = useTranslation()
  const cx = 300
  const cy = 300
  const r = 230
  const n = participants.length

  const nodePositions = participants.map((_, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
  })

  const edges: Array<{ x1: number; y1: number; x2: number; y2: number; count: number; aId: string; bId: string }> = []
  for (let i = 0; i < participants.length; i++) {
    for (let j = i + 1; j < participants.length; j++) {
      const aId = participants[i].id
      const bId = participants[j].id
      const key = [aId, bId].sort().join('::')
      const count = pairCount.get(key) ?? 0
      if (count === 0) continue
      if (!showAll && count < 2) continue
      edges.push({
        x1: nodePositions[i].x,
        y1: nodePositions[i].y,
        x2: nodePositions[j].x,
        y2: nodePositions[j].y,
        count,
        aId,
        bId,
      })
    }
  }

  function edgeColor(count: number): string {
    if (count >= 3) return '#ef4444'
    if (count === 2) return '#f97316'
    return '#d1d5db'
  }

  function edgeWidth(count: number): number {
    if (count >= 3) return 4
    if (count === 2) return 2.5
    return 1
  }

  function isEdgeHighlighted(aId: string, bId: string): boolean {
    if (!hoveredNode) return true
    return aId === hoveredNode || bId === hoveredNode
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setShowAll(!showAll)}
          className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          {showAll ? t('schedule.network') + ': alle' : t('schedule.network') + ': herhalingen'}
        </button>
        <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <svg width="20" height="4"><line x1="0" y1="2" x2="20" y2="2" stroke="#d1d5db" strokeWidth="1" /></svg>
            1×
          </span>
          <span className="flex items-center gap-1">
            <svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke="#f97316" strokeWidth="2.5" /></svg>
            2×
          </span>
          <span className="flex items-center gap-1">
            <svg width="20" height="8"><line x1="0" y1="4" x2="20" y2="4" stroke="#ef4444" strokeWidth="4" /></svg>
            3×+
          </span>
        </div>
      </div>
      <svg
        viewBox="0 0 600 600"
        width="100%"
        className="overflow-visible"
        onMouseLeave={() => setHoveredNode(null)}
      >
        {/* Edges */}
        {edges.map((e, i) => {
          const highlighted = isEdgeHighlighted(e.aId, e.bId)
          return (
            <line
              key={i}
              x1={e.x1}
              y1={e.y1}
              x2={e.x2}
              y2={e.y2}
              stroke={edgeColor(e.count)}
              strokeWidth={edgeWidth(e.count)}
              opacity={highlighted ? 1 : 0.15}
            />
          )
        })}
        {/* Nodes */}
        {participants.map((p, i) => {
          const { x, y } = nodePositions[i]
          const course = hostCourse.get(p.id) ?? 'none'
          const color = NODE_COLORS[course as Course | 'none']
          const isHovered = hoveredNode === p.id
          const radius = p.count === 2 ? 18 : 14
          return (
            <g
              key={p.id}
              onMouseEnter={() => setHoveredNode(p.id)}
              style={{ cursor: 'pointer' }}
            >
              <title>{p.name}{hostCourse.has(p.id) ? ` (${hostCourse.get(p.id)})` : ''}</title>
              <circle
                cx={x}
                cy={y}
                r={isHovered ? radius + 3 : radius}
                fill={color}
                stroke="white"
                strokeWidth="2"
                opacity={hoveredNode && !isHovered ? 0.6 : 1}
              />
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="9"
                fontWeight="600"
                fill="white"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {initials(p.name)}
              </text>
            </g>
          )
        })}
      </svg>
      {/* Node color legend */}
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
        {(Object.entries(NODE_COLORS) as Array<[Course | 'none', string]>).map(([key, color]) => (
          <span key={key} className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
            {key === 'none' ? 'Geen host' : t(`schedule.${key}`)}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ─── Tab: Matrix ────────────────────────────────────────────────────────── */

function MatrixTab({
  participants,
  getMeetingCount,
}: {
  participants: Participant[]
  getMeetingCount: (aId: string, bId: string) => number
}) {
  const { t } = useTranslation()
  return (
    <div>
      <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">{t('schedule.matrixHint')}</p>
      <div className="overflow-x-auto">
        <table className="border-collapse text-xs">
          <thead>
            <tr>
              <th className="w-36 max-w-36" />
              {participants.map((p) => (
                <th key={p.id} className="w-6 px-0 align-bottom pb-1">
                  <div
                    style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                    className="h-28 py-1 text-left text-xs font-medium whitespace-nowrap text-gray-700 dark:text-gray-300"
                    title={p.name}
                  >
                    {p.name}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {participants.map((row) => (
              <tr key={row.id}>
                <td className="w-36 max-w-36 truncate pr-2 text-right text-xs text-gray-700 dark:text-gray-300" title={row.name}>
                  {row.name}
                </td>
                {participants.map((col) => {
                  if (row.id === col.id) {
                    return (
                      <td key={col.id} className="h-5 w-5 bg-gray-200 dark:bg-gray-700" title="—" />
                    )
                  }
                  const count = getMeetingCount(row.id, col.id)
                  return (
                    <td
                      key={col.id}
                      className={`h-5 w-5 border border-white/50 ${cellColor(count)}`}
                      title={`${row.name} ↔ ${col.name}: ${count}×`}
                    />
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-3">
        {[
          { color: 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700', label: '0×' },
          { color: 'bg-green-200 dark:bg-green-800', label: '1×' },
          { color: 'bg-orange-300 dark:bg-orange-700', label: '2×' },
          { color: 'bg-red-400 dark:bg-red-700', label: '3×+' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1">
            <div className={`h-4 w-4 rounded-sm ${color}`} />
            <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

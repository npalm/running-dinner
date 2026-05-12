import { useTranslation } from 'react-i18next'
import type { Participant, Schedule } from '../../types'

interface Props {
  schedule: Schedule
  participants: Participant[]
}

const COURSE_LABEL: Record<string, string> = {
  starter: '🥗 Voorgerecht',
  main: '🍲 Hoofdgerecht',
  dessert: '🍮 Nagerecht',
}

const PREF_LABEL: Record<string, string> = {
  starter: 'voorgerecht',
  main: 'hoofdgerecht',
  dessert: 'nagerecht',
  'prefer-not': 'niet koken',
}

export function ScheduleInsights({ schedule, participants }: Props) {
  const { t } = useTranslation()

  const hostIds = new Set(schedule.tables.map((t) => t.hostId))
  const hostCourse = new Map(schedule.tables.map((t) => [t.hostId, t.course]))

  // Who is NOT cooking
  const nonCooks = participants.filter((p) => !hostIds.has(p.id))

  // Who cannot cook
  const cannotCookParticipants = participants.filter((p) => p.canCook === false)

  // Who didn't get their preference honored
  const preferenceIssues = participants
    .filter((p) => p.preference)
    .filter((p) => {
      const assigned = hostCourse.get(p.id) ?? null
      if (p.preference === 'prefer-not') {
        // Wanted not to cook but IS cooking
        return assigned !== null
      }
      // Had a course preference but got a different course (or didn't cook at all)
      return assigned !== p.preference
    })
    .map((p) => ({
      participant: p,
      wanted: p.preference!,
      got: hostCourse.get(p.id) ?? null,
    }))

  if (nonCooks.length === 0 && preferenceIssues.length === 0 && cannotCookParticipants.length === 0) return null

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        ℹ️ {t('schedule.insights')}
      </h3>

      {nonCooks.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            🍽️ {t('schedule.nonCooks')} ({nonCooks.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {nonCooks.map((p) => (
              <span
                key={p.id}
                className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
              >
                {p.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {cannotCookParticipants.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            🚫 {t('schedule.cannotCook')} ({cannotCookParticipants.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {cannotCookParticipants.map((p) => (
              <span
                key={p.id}
                className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/40 dark:text-red-300"
              >
                {p.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {preferenceIssues.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            ⚠️ {t('schedule.preferenceNotMet')} ({preferenceIssues.length})
          </p>
          <div className="flex flex-col gap-1">
            {preferenceIssues.map(({ participant, wanted, got }) => (
              <div
                key={participant.id}
                className="flex flex-wrap items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs dark:bg-amber-900/20"
              >
                <span className="font-medium text-gray-900 dark:text-white">
                  {participant.name}
                </span>
                <span className="text-gray-400">·</span>
                <span className="text-gray-500 dark:text-gray-400">
                  {t('schedule.wanted')}: <span className="font-medium text-amber-700 dark:text-amber-400">{PREF_LABEL[wanted]}</span>
                </span>
                <span className="text-gray-400">·</span>
                <span className="text-gray-500 dark:text-gray-400">
                  {t('schedule.got')}:{' '}
                  <span className="font-medium text-gray-700 dark:text-gray-200">
                    {got ? COURSE_LABEL[got] : '—  kookt niet'}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

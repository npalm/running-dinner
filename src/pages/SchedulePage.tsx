import { useTranslation } from 'react-i18next'
import { useParticipantsStore } from '../store/participants'
import { useScheduleStore } from '../store/schedule'
import { exportData } from '../lib/storage'
import { validateSchedule, computeMeetings } from '../lib/schedule'
import { ScheduleBoard } from '../components/schedule/ScheduleBoard'
import { MeetingsView } from '../components/schedule/MeetingsView'
import { GeneratingAnimation } from '../components/schedule/GeneratingAnimation'
import { Button } from '../components/ui/Button'

export function SchedulePage() {
  const { t } = useTranslation()
  const participants = useParticipantsStore((s) => s.participants)
  const { schedule, generating, optimizing, optimizeProgress, optimizeBestScore, generate, optimize, setSchedule } = useScheduleStore()

  const handleResetSchedule = () => {
    if (window.confirm(t('common.resetConfirmSchedule'))) {
      setSchedule(null)
    }
  }

  const warnings = schedule ? validateSchedule(schedule, participants) : []
  const meetings = schedule ? computeMeetings(schedule, participants) : null

  const handleGenerate = () => {
    generate(participants)
  }

  const handleOptimize = () => {
    optimize(participants)
  }

  const handleExport = () => {
    exportData(participants, schedule)
  }

  const duplicateCount = meetings ? meetings.duplicatePairs.length : 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('schedule.title')}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {schedule && (
            <>
              <Button variant="danger" size="sm" onClick={handleResetSchedule}>
                {t('common.resetSchedule')}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleExport}>
                {t('schedule.export')}
              </Button>
            </>
          )}
          <div className="relative group">
            <Button
              variant="secondary"
              loading={optimizing}
              disabled={participants.length === 0 || generating}
              onClick={handleOptimize}
            >
              {optimizing ? t('schedule.optimizing') : t('schedule.optimize')}
            </Button>
            <div className="pointer-events-none absolute bottom-full right-0 mb-1.5 hidden w-64 rounded-md bg-gray-900 px-3 py-2 text-xs text-white shadow-lg group-hover:block dark:bg-gray-700">
              {t('schedule.optimizeHint')}
            </div>
          </div>
          <Button
            variant="primary"
            loading={generating}
            disabled={participants.length === 0 || optimizing}
            onClick={handleGenerate}
          >
            {generating
              ? t('schedule.generating')
              : schedule
                ? t('schedule.regenerate')
                : t('schedule.generate')}
          </Button>
        </div>
      </div>

      {schedule && meetings && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {t('schedule.meetingScore')}:
          </span>
          <span className={[
            'rounded-full px-2.5 py-0.5 text-xs font-semibold',
            duplicateCount === 0
              ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
              : duplicateCount <= 3
                ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300'
                : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
          ].join(' ')}>
            {duplicateCount}
          </span>
        </div>
      )}

      {participants.length === 0 && (
        <div className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
          {t('schedule.noParticipants')}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="rounded-lg bg-orange-50 p-4 dark:bg-orange-900/20">
          <p className="mb-2 text-sm font-medium text-orange-800 dark:text-orange-300">
            Validation warnings:
          </p>
          <ul className="list-inside list-disc space-y-1">
            {warnings.map((w, i) => (
              <li key={i} className="text-sm text-orange-700 dark:text-orange-400">
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(generating || optimizing) ? (
        <GeneratingAnimation
          mode={optimizing ? 'optimize' : 'generate'}
          progress={optimizeProgress}
          totalAttempts={30}
          bestScore={optimizeBestScore < Infinity ? optimizeBestScore : undefined}
        />
      ) : schedule ? (
        <ScheduleBoard schedule={schedule} participants={participants} />
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-16 text-center dark:border-gray-600">
          <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
            {t('schedule.noSchedule')}
          </p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            {t('schedule.noScheduleHint')}
          </p>
        </div>
      )}

      {!generating && !optimizing && schedule && meetings && (
        <MeetingsView summary={meetings} participants={participants} schedule={schedule} />
      )}
    </div>
  )
}

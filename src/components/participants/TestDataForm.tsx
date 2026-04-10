import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { TestDataConfig } from '../../types'
import { loadTestDataConfig, saveTestDataConfig } from '../../lib/storage'
import { generateTestData } from '../../lib/testdata'
import { geocodeAddress } from '../../lib/geocoding'
import { useParticipantsStore } from '../../store/participants'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

export function TestDataForm() {
  const { t } = useTranslation()
  const setAll = useParticipantsStore((s) => s.setAll)

  const [open, setOpen] = useState(false)
  const [config, setConfig] = useState<TestDataConfig>(loadTestDataConfig)
  const [generated, setGenerated] = useState<number | null>(null)
  const [generating, setGenerating] = useState(false)
  const [geocodingBase, setGeocodingBase] = useState(false)
  const [baseError, setBaseError] = useState<string | null>(null)

  useEffect(() => {
    if (open) setConfig(loadTestDataConfig())
  }, [open])

  const handleBaseAddressBlur = async () => {
    if (!config.baseAddress.trim()) return
    setGeocodingBase(true)
    setBaseError(null)
    try {
      const result = await geocodeAddress(config.baseAddress)
      setConfig((prev) => ({
        ...prev,
        baseAddress: result.address,
        baseCoordinates: result.coordinates,
      }))
    } catch {
      setBaseError(t('participants.geocodeError'))
    } finally {
      setGeocodingBase(false)
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const participants = await generateTestData(config)
      setAll(participants)
      saveTestDataConfig(config)
      setGenerated(participants.length)
    } finally {
      setGenerating(false)
    }
  }

  const update = <K extends keyof TestDataConfig>(key: K, value: TestDataConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
    setGenerated(null)
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        <span>{t('testData.title')}</span>
        <svg
          className={['h-5 w-5 text-gray-400 transition-transform', open ? 'rotate-180' : ''].join(
            ' ',
          )}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="border-t border-gray-200 px-4 py-4 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Input
              label={t('testData.totalPersons')}
              type="number"
              min={4}
              max={100}
              value={config.totalPersons}
              onChange={(e) => update('totalPersons', Number(e.target.value))}
            />
            <Input
              label={t('testData.singlesCount')}
              type="number"
              min={0}
              max={config.totalPersons}
              value={config.singlesCount}
              onChange={(e) => update('singlesCount', Number(e.target.value))}
            />
            <Input
              label={t('testData.minRadius')}
              type="number"
              min={0}
              value={config.minRadiusM}
              onChange={(e) => update('minRadiusM', Number(e.target.value))}
            />
            <Input
              label={t('testData.maxRadius')}
              type="number"
              min={0}
              value={config.maxRadiusM}
              onChange={(e) => update('maxRadiusM', Number(e.target.value))}
            />
            <div className="col-span-2">
              <Input
                label={t('testData.baseAddress')}
                type="text"
                value={config.baseAddress}
                onChange={(e) => update('baseAddress', e.target.value)}
                onBlur={handleBaseAddressBlur}
                hint={geocodingBase ? t('participants.geocoding') : undefined}
                error={baseError ?? undefined}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              loading={generating || geocodingBase}
              onClick={handleGenerate}
            >
              {generating ? t('testData.generating') : t('testData.generate')}
            </Button>
            {generated !== null && (
              <span className="text-sm text-green-600 dark:text-green-400">
                ✓ {generated} {t('nav.participants').toLowerCase()}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

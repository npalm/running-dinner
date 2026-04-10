import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { CookingPreference, Participant } from '../../types'
import { geocodeAddress } from '../../lib/geocoding'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'

interface ParticipantFormProps {
  initial?: Participant
  onSave: (data: Omit<Participant, 'id'>) => void
  onCancel: () => void
}

interface FormState {
  name: string
  count: 1 | 2
  address: string
  coordinates: Participant['coordinates']
  preference: CookingPreference
}

export function ParticipantForm({ initial, onSave, onCancel }: ParticipantFormProps) {
  const { t } = useTranslation()

  const [form, setForm] = useState<FormState>({
    name: initial?.name ?? '',
    count: initial?.count ?? 1,
    address: initial?.address ?? '',
    coordinates: initial?.coordinates ?? null,
    preference: initial?.preference ?? null,
  })

  const [geocoding, setGeocoding] = useState(false)
  const [geocodeError, setGeocodeError] = useState<string | null>(null)

  const handleAddressBlur = useCallback(async () => {
    if (!form.address.trim()) return
    setGeocoding(true)
    setGeocodeError(null)
    try {
      const result = await geocodeAddress(form.address)
      setForm((prev) => ({
        ...prev,
        address: result.address,
        coordinates: result.coordinates,
      }))
    } catch {
      setGeocodeError(t('participants.geocodeError'))
    } finally {
      setGeocoding(false)
    }
  }, [form.address, t])

  const preferenceOptions = [
    { value: '', label: t('preferences.noPreference') },
    { value: 'starter', label: t('preferences.starter') },
    { value: 'main', label: t('preferences.main') },
    { value: 'dessert', label: t('preferences.dessert') },
    { value: 'prefer-not', label: t('preferences.preferNot') },
  ]

  const countOptions = [
    { value: '1', label: t('count.one') },
    { value: '2', label: t('count.two') },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      name: form.name,
      count: form.count,
      address: form.address,
      coordinates: form.coordinates,
      preference: form.preference,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label={t('participants.name')}
        value={form.name}
        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
        required
      />
      <Select
        label={t('participants.count')}
        value={String(form.count)}
        options={countOptions}
        onChange={(e) =>
          setForm((prev) => ({ ...prev, count: Number(e.target.value) as 1 | 2 }))
        }
      />
      <Input
        label={t('participants.address')}
        value={form.address}
        onChange={(e) => {
          setForm((prev) => ({ ...prev, address: e.target.value, coordinates: null }))
          setGeocodeError(null)
        }}
        onBlur={handleAddressBlur}
        hint={geocoding ? t('participants.geocoding') : t('participants.addressHint')}
        error={geocodeError ?? undefined}
        required
      />
      <Select
        label={t('participants.preference')}
        value={form.preference ?? ''}
        options={preferenceOptions}
        onChange={(e) =>
          setForm((prev) => ({
            ...prev,
            preference: (e.target.value as CookingPreference) || null,
          }))
        }
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" variant="primary" loading={geocoding}>
          {t('common.save')}
        </Button>
      </div>
    </form>
  )
}

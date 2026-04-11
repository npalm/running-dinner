import { useTranslation } from 'react-i18next'
import type { CardTemplates } from '../../lib/cards'
import { saveTemplates } from '../../lib/templates'

interface Props {
  templates: CardTemplates
  onChange: (templates: CardTemplates) => void
}

export function TemplateEditor({ templates, onChange }: Props) {
  const { t } = useTranslation()

  const fields: { key: keyof CardTemplates; label: string; hint: string }[] = [
    {
      key: 'welcome',
      label: t('organizer.templateWelcome'),
      hint: t('organizer.templateHint'),
    },
    {
      key: 'starterToMain',
      label: t('organizer.templateStarterToMain'),
      hint: t('organizer.templateHint'),
    },
    {
      key: 'mainToDessert',
      label: t('organizer.templateMainToDessert'),
      hint: t('organizer.templateHint'),
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t('organizer.templateDesc')}
      </p>
      {fields.map(({ key, label, hint }) => (
        <div key={key} className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
          <textarea
            rows={3}
            value={templates[key]}
            onChange={(e) => {
              const updated = { ...templates, [key]: e.target.value }
              onChange(updated)
              saveTemplates(updated)
            }}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
          <p className="text-xs text-gray-400 dark:text-gray-500">{hint}</p>
        </div>
      ))}
    </div>
  )
}

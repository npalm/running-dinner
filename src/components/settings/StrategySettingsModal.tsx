import { useTranslation } from 'react-i18next'
import { Modal } from '../ui/Modal'
import { StrategySettings } from './StrategySettings'

interface Props {
  open: boolean
  onClose: () => void
}

export function StrategySettingsModal({ open, onClose }: Props) {
  const { t } = useTranslation()

  return (
    <Modal open={open} onClose={onClose} title={t('settings.title')}>
      <StrategySettings />
    </Modal>
  )
}

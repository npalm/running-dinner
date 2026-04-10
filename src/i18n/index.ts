import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import nl from './nl'
import en from './en'

export type Language = 'nl' | 'en'

const LANG_KEY = 'running-dinner-lang'

function resolveInitialLang(): Language {
  const saved = localStorage.getItem(LANG_KEY)
  if (saved === 'nl' || saved === 'en') return saved
  const browserLang = navigator.language ?? 'nl'
  return browserLang.startsWith('nl') ? 'nl' : 'en'
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      nl: { translation: nl },
      en: { translation: en },
    },
    lng: resolveInitialLang(),
    fallbackLng: 'nl',
    interpolation: {
      escapeValue: false,
    },
  })

// Persist every language change to localStorage
i18n.on('languageChanged', (lng) => {
  if (lng === 'nl' || lng === 'en') {
    localStorage.setItem(LANG_KEY, lng)
  }
})

export default i18n

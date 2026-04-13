import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import esTranslations from './locales/es.json'
import enTranslations from './locales/en.json'

const storedLng = (() => {
  try {
    const v = localStorage.getItem('i18nextLng')
    if (v === 'en' || v === 'es') return v
  } catch {}
  return 'es'
})()

i18n
  .use(initReactI18next)
  .init({
    resources: {
      es: {
        translation: esTranslations
      },
      en: {
        translation: enTranslations
      }
    },
    lng: storedLng,
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false // React ya escapa los valores
    }
  })

export default i18n

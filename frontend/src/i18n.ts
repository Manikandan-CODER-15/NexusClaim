import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation resources
import en from './locales/en/translation.json';
import ta from './locales/ta/translation.json';
import hi from './locales/hi/translation.json';

const resources = {
  en: { translation: en },
  ta: { translation: ta },
  hi: { translation: hi },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  })
  .catch(console.error);

export default i18n;


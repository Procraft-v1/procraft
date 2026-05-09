import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import uz from './locales/uz.json';
import ru from './locales/ru.json';
import en from './locales/en.json';

const resources = {
  uz: { translation: uz },
  ru: { translation: ru },
  en: { translation: en },
};

/** Call once before rendering React roots that need translations. */
export async function configureI18n(options = {}) {
  const lng = options.lng ?? 'uz';

  if (!i18next.isInitialized) {
    await i18next.use(initReactI18next).init({
      resources,
      lng,
      fallbackLng: 'uz',
      interpolation: { escapeValue: false },
    });

    return i18next;
  }

  await i18next.changeLanguage(lng);
  return i18next;
}

export { i18next };
export { getErrorFieldMessages, getErrorMessage } from './error-message.js';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { TFunction } from 'i18next';
import { resources, type AppLanguage, type TranslationKey } from './resources';

export const LANGUAGE_STORAGE_KEY = 'invite-maker-language';
export const SUPPORTED_LANGUAGES = Object.keys(resources) as AppLanguage[];

export function resolveLanguage(language: string | null | undefined): AppLanguage | null {
  if (!language) return null;
  const normalized = language.trim().replace('_', '-').toLowerCase();
  if (normalized === 'zh-tw' || normalized === 'zh-hk' || normalized === 'zh-mo' || normalized.startsWith('zh-hant')) return 'zh-TW';
  if (normalized === 'zh-cn' || normalized === 'zh-sg' || normalized.startsWith('zh-hans') || normalized === 'zh') return 'zh-CN';
  const base = normalized.split('-')[0];
  if (base === 'en' || base === 'de' || base === 'ja' || base === 'ko' || base === 'es' || base === 'fr') return base;
  return null;
}

export function detectLanguage(): AppLanguage {
  try {
    const stored = resolveLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY));
    if (stored) return stored;
  } catch {}

  if (typeof navigator !== 'undefined') {
    for (const candidate of navigator.languages ?? [navigator.language]) {
      const resolved = resolveLanguage(candidate);
      if (resolved) return resolved;
    }
  }
  return 'en';
}

void i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: detectLanguage(),
    initAsync: false,
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES,
    load: 'currentOnly',
    keySeparator: false,
    // Invitation templates use {{...}} tokens, so i18next must not consume them.
    interpolation: { escapeValue: false, prefix: '%{', suffix: '}' },
    react: { useSuspense: false },
  });

i18n.on('languageChanged', (language) => {
  const resolved = resolveLanguage(language) ?? 'en';
  document.documentElement.lang = resolved;
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, resolved);
  } catch {}
});

document.documentElement.lang = resolveLanguage(i18n.resolvedLanguage) ?? 'en';

export function translate(
  t: TFunction,
  key: TranslationKey,
  values: Record<string, string | number> = {},
) {
  return Object.entries(values).reduce(
    (message, [name, value]) => message.replaceAll(`{{${name}}}`, String(value)),
    t(key),
  );
}

export default i18n;

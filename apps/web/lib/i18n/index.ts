import {
  defaultLocale,
  locales,
  messages,
  type Locale,
  type TranslationKey,
} from "./messages";

export { defaultLocale, locales };
export type { Locale, TranslationKey };

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function resolveLocale(locale?: string): Locale {
  if (locale && isLocale(locale)) {
    return locale;
  }

  return defaultLocale;
}

export function getMessages(locale?: string): Record<TranslationKey, string> {
  const resolvedLocale = resolveLocale(locale);

  return { ...messages[resolvedLocale] };
}

export function translate(locale: string | undefined, key: TranslationKey): string {
  const resolvedLocale = resolveLocale(locale);

  return messages[resolvedLocale][key];
}

export function useTranslations(locale?: string) {
  const resolvedLocale = resolveLocale(locale);

  return function t(key: TranslationKey): string {
    return messages[resolvedLocale][key];
  };
}

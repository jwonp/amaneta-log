export const defaultLocale = "ko";

export const locales = ["ko", "en", "jp"] as const;

export type Locale = (typeof locales)[number];

export const messages = {
  ko: {
    appTitle: "아마네타 로그",
    greeting: "안녕하세요, Next.js!",
    description: "Tailwind, Vitest, i18n이 적용된 시작 화면입니다.",
  },
  en: {
    appTitle: "Amaneta Log",
    greeting: "Hello, Next.js!",
    description: "A starter screen with Tailwind, Vitest, and i18n applied.",
  },
  jp: {
    appTitle: "Amaneta Log",
    greeting: "Hello, Next.js!",
    description: "A starter screen with Tailwind, Vitest, and i18n applied.",
  },
} as const satisfies Record<string, Record<string, string>>;

export type TranslationKey = keyof (typeof messages)[typeof defaultLocale];

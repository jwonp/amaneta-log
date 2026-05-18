import { describe, expect, it } from "vitest";

import {
  defaultLocale,
  getMessages,
  isLocale,
  resolveLocale,
  translate,
  useTranslations,
} from ".";

describe("i18n", () => {
  it("recognizes supported locales", () => {
    expect(isLocale("ko")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("fr")).toBe(false);
  });

  it("falls back to the default locale for unsupported input", () => {
    expect(resolveLocale("fr")).toBe(defaultLocale);
    expect(resolveLocale()).toBe(defaultLocale);
  });

  it("returns translated messages for the requested locale", () => {
    expect(translate("ko", "greeting")).toBe("안녕하세요, Next.js!");
    expect(translate("en", "greeting")).toBe("Hello, Next.js!");
  });

  it("creates a translation function for the requested locale", () => {
    const t = useTranslations("ko");

    expect(t("appTitle")).toBe("아마네타 로그");
    expect(t("description")).toBe("Tailwind, Vitest, i18n이 적용된 시작 화면입니다.");
  });

  it("returns a copy of the locale messages", () => {
    const koMessages = getMessages("ko");

    expect(koMessages).toEqual({
      appTitle: "아마네타 로그",
      greeting: "안녕하세요, Next.js!",
      description: "Tailwind, Vitest, i18n이 적용된 시작 화면입니다.",
    });
  });
});

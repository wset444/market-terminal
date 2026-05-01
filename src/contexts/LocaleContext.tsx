"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AppLocale } from "@/i18n/dictionaries";
import { LOCALE_STORAGE_KEY, dictionaries } from "@/i18n/dictionaries";
import { getMessage } from "@/i18n/getMessage";

type LocaleContextValue = {
  locale: AppLocale;
  setLocale: (next: AppLocale) => void;
  t: (path: string) => string;
  /** 与东财 klt 顺序一致的周期展示文案 */
  chartPeriods: string[];
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * 读取 `localStorage` 中的语言；无效或缺失时默认 **英文**。
 */
function readStoredLocale(): AppLocale {
  if (typeof window === "undefined") return "en";
  const raw = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return raw === "zh" || raw === "en" ? raw : "en";
}

/**
 * 全局语言：Context + `localStorage` 持久化；同步 `document.documentElement.lang`。
 */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLocaleState(readStoredLocale());
    setMounted(true);
  }, []);

  const setLocale = useCallback((next: AppLocale) => {
    setLocaleState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
      document.documentElement.lang = next === "zh" ? "zh-Hans" : "en";
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.lang = locale === "zh" ? "zh-Hans" : "en";
  }, [locale, mounted]);

  const value = useMemo((): LocaleContextValue => {
    const dict = dictionaries[locale];
    return {
      locale,
      setLocale,
      t: (path: string) => getMessage(dict, path),
      chartPeriods: dict.stockHeaderPeriods,
    };
  }, [locale, setLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/**
 * 获取当前语言、`setLocale` 与 `t('a.b.c')` 翻译函数。
 */
export function useI18n(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useI18n must be used within LocaleProvider");
  return ctx;
}

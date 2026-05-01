"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/** `localStorage` 键：`'dark' | 'light'`，与 `html.dark` 一致 */
export const THEME_STORAGE_KEY = "react-ai-theme";

type ThemeContextValue = {
  /** `true` 为深色（根节点挂 `dark` 类） */
  isDark: boolean;
  /** 直接设为深色/浅色并写入本地缓存 */
  setDark: (next: boolean) => void;
  /** 在深浅之间切换并写入本地缓存 */
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * 读取已保存的主题偏好。
 *
 * 步骤：
 * 1. 读 `THEME_STORAGE_KEY`。
 * 2. 仅识别 `dark` / `light`；缺省或非法时默认深色（与历史默认一致）。
 *
 * @returns 是否使用深色主题
 */
function readStoredIsDark(): boolean {
  if (typeof window === "undefined") return true;
  const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (raw === "light") return false;
  if (raw === "dark") return true;
  return true;
}

/**
 * 全局深浅色：Context + `localStorage`；同步 `document.documentElement` 的 `dark` 类。
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDarkState] = useState(true);

  /**
   * 步骤：
   * 1. 挂载后从本地缓存恢复（避免 SSR 与客户端不一致）。
   * 2. 后续由 `isDark` 的 layout effect 统一写 DOM。
   */
  useLayoutEffect(() => {
    setIsDarkState(readStoredIsDark());
  }, []);

  /**
   * 步骤：根据 `isDark` 切换根节点 class，供 Tailwind `dark` 变体使用。
   */
  useLayoutEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const setDark = useCallback((next: boolean) => {
    setIsDarkState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_STORAGE_KEY, next ? "dark" : "light");
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDarkState((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(THEME_STORAGE_KEY, next ? "dark" : "light");
      }
      return next;
    });
  }, []);

  const value = useMemo(
    (): ThemeContextValue => ({
      isDark,
      setDark,
      toggleTheme,
    }),
    [isDark, setDark, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * 获取当前深浅色、`setDark` 与 `toggleTheme`。
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

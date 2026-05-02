"use client";

import type { ReactNode } from "react";
import { GlobalRefreshProvider } from "@/contexts/GlobalRefreshContext";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

/**
 * 客户端全局 Provider（主题、语言、顶栏「刷新全部」信号等）。
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <GlobalRefreshProvider>{children}</GlobalRefreshProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}

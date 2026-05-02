"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type GlobalRefreshContextValue = {
  /** 每次 `bump` 自增，供各面板 `useEffect` 依赖以触发全量重新拉取 */
  generation: number;
  bump: () => void;
};

const GlobalRefreshContext = createContext<GlobalRefreshContextValue | null>(null);

/**
 * 顶栏「刷新全部」与各业务组件之间的信号：不携带 payload，仅递增代数触发 `fetch`。
 */
export function GlobalRefreshProvider({ children }: { children: ReactNode }) {
  const [generation, setGeneration] = useState(0);
  const bump = useCallback(() => setGeneration((n) => n + 1), []);
  const value = useMemo(() => ({ generation, bump }), [generation, bump]);
  return <GlobalRefreshContext.Provider value={value}>{children}</GlobalRefreshContext.Provider>;
}

export function useGlobalRefresh(): GlobalRefreshContextValue {
  const ctx = useContext(GlobalRefreshContext);
  if (!ctx) {
    throw new Error("useGlobalRefresh must be used within GlobalRefreshProvider");
  }
  return ctx;
}

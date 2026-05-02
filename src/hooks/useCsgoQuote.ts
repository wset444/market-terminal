"use client";

import { useCallback, useEffect, useState } from "react";
import type { CsgoQuote } from "@/types/csgo";

type UseCsgoQuoteOptions = {
  marketHashName: string;
  pollMs?: number;
};

type UseCsgoQuoteResult = {
  quote: CsgoQuote | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

/**
 * 从 `/api/csgo/quote` 拉取 Steam 挂牌概览，可选轮询。
 *
 * 步骤：
 * 1. 用 `market_hash_name` 请求本地 API。
 * 2. 非 2xx 时解析 `error` 字段为文案。
 * 3. `pollMs > 0` 时定时静默刷新。
 */
export function useCsgoQuote({
  marketHashName,
  pollMs = 45_000,
}: UseCsgoQuoteOptions): UseCsgoQuoteResult {
  const [quote, setQuote] = useState<CsgoQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = opts?.silent ?? false;
      if (!marketHashName.trim()) {
        setQuote(null);
        setError(null);
        if (!silent) setLoading(false);
        return;
      }
      if (!silent) setLoading(true);
      try {
        const res = await fetch(
          `/api/csgo/quote?market_hash_name=${encodeURIComponent(marketHashName)}`,
        );
        const data: unknown = await res.json();
        if (!res.ok) {
          const msg =
            typeof data === "object" && data !== null && "error" in data
              ? String((data as { error: unknown }).error)
              : `HTTP ${res.status}`;
          setError(msg);
          setQuote(null);
          return;
        }
        setQuote(data as CsgoQuote);
        setError(null);
      } catch {
        setError("网络错误");
        setQuote(null);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [marketHashName],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (pollMs <= 0 || !marketHashName.trim()) return;
    const t = setInterval(() => void load({ silent: true }), pollMs);
    return () => clearInterval(t);
  }, [load, pollMs, marketHashName]);

  return { quote, loading, error, refresh: () => void load() };
}

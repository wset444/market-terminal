"use client";

import { useCallback, useEffect, useState } from "react";
import type { StockQuote } from "@/types/stock";

type UseStockQuoteOptions = {
  code: string;
  /** 轮询间隔，0 表示只请求一次 */
  pollMs?: number;
};

type UseStockQuoteResult = {
  quote: StockQuote | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

/**
 * 从本应用 `/api/stock/quote` 拉取 A 股快照，可选轮询。
 *
 * 步骤：
 * 1. `fetch` 本地 API，避免把第三方地址暴露给浏览器并统一错误格式。
 * 2. `pollMs > 0` 时用 `setInterval` 定时刷新（默认约 **1 分钟**，减轻接口压力）。
 * 3. 返回 `refresh` 供手动触发。
 */
export function useStockQuote({
  code,
  pollMs = 60_000,
}: UseStockQuoteOptions): UseStockQuoteResult {
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`/api/stock/quote?code=${encodeURIComponent(code)}`);
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
      setQuote(data as StockQuote);
      setError(null);
    } catch {
      setError("网络错误");
      setQuote(null);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (pollMs <= 0) return;
    const t = setInterval(() => void load({ silent: true }), pollMs);
    return () => clearInterval(t);
  }, [load, pollMs]);

  return { quote, loading, error, refresh: () => void load() };
}

"use client";

import { useEffect, useState } from "react";
import { useGlobalRefresh } from "@/contexts/GlobalRefreshContext";
import { useI18n } from "@/contexts/LocaleContext";
import type { TickRow } from "@/types/stock";

type TradeListProps = {
  code: string;
  basePrice?: number;
};

/** 分笔成功时下一轮轮询间隔（ms）：**120s** 自动刷新 */
const TICK_POLL_OK_MS = 120_000;
/** 分笔失败（含 502）时退避间隔（ms） */
const TICK_POLL_ERR_MS = 60_000;

/**
 * 逐笔成交：东财 `details` 接口；成功时 **120s** 刷新，失败时退避 **60s**；顶栏「刷新全部」会立即重拉。
 */
export default function TradeList({ code }: TradeListProps) {
  const { t } = useI18n();
  const { generation } = useGlobalRefresh();
  const [ticks, setTicks] = useState<TickRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    /**
     * 步骤：
     * 1. 请求 `/api/stock/ticks`；`res.ok` 且 `data` 为数组则更新列表并返回 `TICK_POLL_OK_MS`。
     * 2. 否则返回 `TICK_POLL_ERR_MS` 以退避。
     */
    const fetchOnce = async (): Promise<number> => {
      if (cancelled) return TICK_POLL_ERR_MS;
      try {
        const res = await fetch(`/api/stock/ticks?code=${encodeURIComponent(code)}&pos=-40`);
        let j: unknown;
        try {
          j = await res.json();
        } catch {
          j = null;
        }
        if (cancelled) return TICK_POLL_ERR_MS;
        const data =
          j && typeof j === "object" ? (j as { data?: TickRow[] }).data : undefined;
        if (res.ok && Array.isArray(data)) {
          setTicks(data);
          return TICK_POLL_OK_MS;
        }
      } catch {
        /* 保持 ERR 退避 */
      }
      return TICK_POLL_ERR_MS;
    };

    const scheduleNext = async () => {
      const nextMs = await fetchOnce();
      if (!cancelled) {
        timeoutId = setTimeout(() => void scheduleNext(), nextMs);
      }
    };

    void scheduleNext();

    return () => {
      cancelled = true;
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, [code, generation]);

  return (
    <div data-cmp="TradeList" className="flex h-full min-h-0 flex-col">
      <div className="border-border bg-panel-header flex shrink-0 items-center justify-between border-b px-3 py-2">
        <span className="shrink-0 text-xs font-medium text-foreground">{t("tradeList.title")}</span>
        <span className="text-down flex shrink-0 items-center gap-1 text-xs">
          <span className="blink inline-block h-1.5 w-1.5 rounded-full bg-down" />
          {t("tradeList.subtitle")}
        </span>
      </div>
      <div className="flex shrink-0 justify-between border-b border-border px-3 py-1 text-xs text-muted-foreground">
        <span className="w-16">{t("tradeList.time")}</span>
        <span className="w-12 text-right">{t("tradeList.price")}</span>
        <span className="w-14 text-right">{t("tradeList.vol")}</span>
        <span className="w-8 text-right">{t("tradeList.side")}</span>
      </div>
      <div className="scrollbar-thin min-h-0 flex-1 overflow-auto">
        {ticks.length === 0 ? (
          <div className="text-muted-foreground px-3 py-2 text-xs">{t("tradeList.empty")}</div>
        ) : (
          ticks.map((trade, i) => {
            const isBuy = trade.tickType === 1;
            return (
              <div
                key={`${trade.time}-${trade.price}-${i}`}
                className={`flex items-center justify-between border-b border-border/30 px-3 py-1 text-xs transition-all ${
                  i === 0 ? "bg-muted/40" : "hover:bg-muted/20"
                }`}
              >
                <span className="w-16 font-mono text-muted-foreground">{trade.time}</span>
                <span
                  className={`w-12 text-right font-mono font-medium ${isBuy ? "text-up" : "text-down"}`}
                >
                  {trade.price.toFixed(2)}
                </span>
                <span className="w-14 text-right font-mono text-foreground">{trade.volume}</span>
                <span className={`w-8 text-right font-medium ${isBuy ? "text-up" : "text-down"}`}>
                  {isBuy ? t("tradeList.buy") : t("tradeList.sell")}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

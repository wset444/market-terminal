"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/contexts/LocaleContext";
import type { TickRow } from "@/types/stock";

type TradeListProps = {
  code: string;
  basePrice?: number;
};

/**
 * 逐笔成交：东财 `details` 接口；轮询刷新。
 */
export default function TradeList({ code, basePrice = 0 }: TradeListProps) {
  const { t } = useI18n();
  const [ticks, setTicks] = useState<TickRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/stock/ticks?code=${encodeURIComponent(code)}&pos=-40`);
        const j: unknown = await res.json();
        const data = (j as { data?: TickRow[] }).data;
        if (!cancelled && Array.isArray(data)) setTicks(data);
      } catch {
        /* ignore */
      }
    };
    void load();
    const id = setInterval(load, 2000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [code]);

  return (
    <div data-cmp="TradeList" className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border bg-panel-header px-3 py-2">
        <span className="text-xs font-medium text-foreground">{t("tradeList.title")}</span>
        <span className="flex items-center gap-1 text-xs text-down">
          <span className="blink inline-block h-1.5 w-1.5 rounded-full bg-down" />
          {t("tradeList.subtitle")}
        </span>
      </div>
      <div className="flex justify-between border-b border-border px-3 py-1 text-xs text-muted-foreground">
        <span className="w-16">{t("tradeList.time")}</span>
        <span className="w-12 text-right">{t("tradeList.price")}</span>
        <span className="w-14 text-right">{t("tradeList.vol")}</span>
        <span className="w-8 text-right">{t("tradeList.side")}</span>
      </div>
      <div className="scrollbar-thin flex-1 overflow-auto">
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

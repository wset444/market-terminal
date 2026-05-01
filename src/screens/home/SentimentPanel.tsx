"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/contexts/LocaleContext";
import type { MoverRow } from "@/types/stock";

/**
 * 市场情绪：用 A 股涨幅榜（clist）真实数据代替模拟雷达。
 */
export default function SentimentPanel() {
  const { t } = useI18n();
  const [movers, setMovers] = useState<MoverRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/stock/movers?pz=15`);
        const j: unknown = await res.json();
        const data = (j as { data?: MoverRow[] }).data;
        if (!cancelled && Array.isArray(data)) setMovers(data);
      } catch {
        /* ignore */
      }
    };
    void load();
    const id = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div data-cmp="SentimentPanel" className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border bg-panel-header px-3 py-2">
        <span className="text-xs font-medium text-foreground">{t("sentiment.title")}</span>
        <span className="text-xs text-muted-foreground">{t("sentiment.subtitle")}</span>
      </div>

      <div className="flex justify-between border-b border-border px-3 py-1 text-xs text-muted-foreground">
        <span>{t("sentiment.name")}</span>
        <span>{t("sentiment.turnoverPct")}</span>
        <span>{t("sentiment.changePct")}</span>
      </div>
      <div className="scrollbar-thin flex-1 overflow-auto">
        {movers.length === 0 ? (
          <div className="text-muted-foreground px-3 py-2 text-xs">{t("sentiment.loading")}</div>
        ) : (
          movers.map((s, i) => (
            <div
              key={s.code}
              className="flex cursor-pointer items-center gap-2 border-b border-border/40 px-3 py-1.5 transition-colors hover:bg-muted/30"
            >
              <div
                className="flex h-4 w-4 shrink-0 items-center justify-center rounded text-xs font-bold text-white"
                style={{ background: i < 3 ? "var(--up)" : "var(--muted-foreground)" }}
              >
                {i + 1}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-xs text-foreground">{s.name}</span>
                <span className="text-xs text-muted-foreground">{s.code}</span>
              </div>
              <span className="w-10 text-right font-mono text-xs text-muted-foreground">
                {s.turnoverPct.toFixed(1)}
              </span>
              <span className="w-12 text-right font-mono text-xs font-medium text-up">
                +{s.changePct.toFixed(2)}%
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

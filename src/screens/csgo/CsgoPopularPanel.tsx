"use client";

import { useEffect, useState } from "react";
import { useGlobalRefresh } from "@/contexts/GlobalRefreshContext";
import { useI18n } from "@/contexts/LocaleContext";
import type { CsgoPopularRow } from "@/types/csgo";

type CsgoPopularPanelProps = {
  onPickItem: (marketHashName: string) => void;
  activeHash: string;
};

/**
 * Steam 热门饰品列表：与 `SentimentPanel` 同槽位，点击切换主图饰品。
 */
export default function CsgoPopularPanel({ onPickItem, activeHash }: CsgoPopularPanelProps) {
  const { t } = useI18n();
  const { generation } = useGlobalRefresh();
  const [rows, setRows] = useState<CsgoPopularRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/csgo/popular?count=18`);
        const j: unknown = await res.json();
        const data = (j as { data?: CsgoPopularRow[] }).data;
        if (!cancelled && Array.isArray(data)) setRows(data);
      } catch {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    const id = setInterval(load, 120_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [generation]);

  return (
    <div data-cmp="CsgoPopularPanel" className="flex h-full flex-col">
      <div className="border-border bg-panel-header flex items-center justify-between border-b px-3 py-2">
        <span className="text-xs font-medium text-foreground">{t("csgo.popularTitle")}</span>
        <span className="text-xs text-muted-foreground">{t("csgo.popularSub")}</span>
      </div>
      <div className="scrollbar-thin flex-1 overflow-auto">
        {loading ? (
          <div className="text-muted-foreground px-3 py-2 text-xs">{t("sentiment.loading")}</div>
        ) : rows.length === 0 ? (
          <div className="text-muted-foreground px-3 py-2 text-xs">{t("csgo.popularEmpty")}</div>
        ) : (
          rows.map((s, i) => {
            const active = s.market_hash_name === activeHash;
            return (
              <button
                key={s.market_hash_name}
                type="button"
                onClick={() => onPickItem(s.market_hash_name)}
                className={`hover:bg-muted/50 flex w-full items-start gap-2 border-b border-border/40 px-3 py-1.5 text-left text-xs transition-colors ${
                  active ? "bg-muted/40" : ""
                }`}
              >
                <span
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white"
                  style={{ background: i < 3 ? "var(--up)" : "var(--muted-foreground)" }}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 leading-snug text-foreground">{s.name}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

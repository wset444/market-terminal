"use client";

import { useEffect, useState } from "react";
import { RefreshCwIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import { useI18n } from "@/contexts/LocaleContext";
import type { CsgoWatchlistApiRow } from "@/types/csgo";
import { CsgoItemIcon } from "./CsgoItemIcon";

type CsgoWatchlistTableProps = {
  onSelectItem: (marketHashName: string) => void;
  activeHash: string;
};

/**
 * CS2「库存/关注」表：数据来自 `/api/csgo/watchlist`（Steam 价 + 本地 `watchlist-config`）。
 */
export default function CsgoWatchlistTable({ onSelectItem, activeHash }: CsgoWatchlistTableProps) {
  const { t } = useI18n();
  const [rows, setRows] = useState<CsgoWatchlistApiRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await fetch(`/api/csgo/watchlist`);
      const j: unknown = await res.json();
      const data = (j as { data?: CsgoWatchlistApiRow[] }).data;
      if (Array.isArray(data)) setRows(data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const id = setInterval(load, 45_000);
    return () => clearInterval(id);
  }, []);

  const totalCost = rows.reduce((s, p) => s + p.avgCost * p.qty, 0);
  const totalValue = rows.reduce((s, p) => s + p.price * p.qty, 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  return (
    <div data-cmp="CsgoWatchlistTable" className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-4 border-b border-border bg-panel-header px-4 py-2">
        <span className="text-xs font-medium text-foreground">{t("csgo.watchlistTitle")}</span>
        <div className="ml-2 flex flex-wrap items-center gap-3">
          <div className="text-xs">
            <span className="text-muted-foreground">{t("csgo.watchlistTotalValue")}</span>
            <span className="ml-1 font-mono font-medium text-foreground">
              ${totalValue.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            </span>
          </div>
          <div className="text-xs">
            <span className="text-muted-foreground">{t("csgo.watchlistTotalPnl")}</span>
            <span
              className={`ml-1 font-mono font-medium ${totalPnl >= 0 ? "text-up" : "text-down"}`}
            >
              {totalPnl >= 0 ? "+" : ""}
              {totalPnl.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            </span>
          </div>
          <div className="text-xs">
            <span className="text-muted-foreground">{t("csgo.watchlistReturnPct")}</span>
            <span
              className={`ml-1 font-mono font-medium ${totalPnlPct >= 0 ? "text-up" : "text-down"}`}
            >
              {totalPnlPct >= 0 ? "+" : ""}
              {totalPnlPct.toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="flex-1" />
        <span className="text-muted-foreground hidden text-xs sm:inline">{t("csgo.watchlistConfigHint")}</span>
        <button
          type="button"
          onClick={() => void load()}
          className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <RefreshCwIcon size={11} />
          <span>{t("csgo.watchlistRefresh")}</span>
        </button>
      </div>

      <div className="flex items-center border-b border-border bg-muted/30 px-4 py-1.5 text-xs text-muted-foreground">
        <span className="w-11 shrink-0" aria-hidden />
        <span className="min-w-0 flex-1 pl-1">{t("csgo.watchlistColName")}</span>
        <span className="w-12 shrink-0 text-right">{t("csgo.watchlistColQty")}</span>
        <span className="w-16 shrink-0 text-right">{t("csgo.watchlistColCost")}</span>
        <span className="w-16 shrink-0 text-right">{t("csgo.watchlistColLast")}</span>
        <span className="w-20 shrink-0 text-right">{t("csgo.watchlistColPnl")}</span>
        <span className="w-14 shrink-0 text-right">{t("csgo.watchlistColPnlPct")}</span>
        <span className="w-20 shrink-0 text-right">{t("csgo.watchlistColValue")}</span>
        <span className="w-14 shrink-0 text-right">{t("csgo.watchlistColRefChg")}</span>
        <span className="w-20 shrink-0 text-right">{t("csgo.watchlistColAction")}</span>
      </div>

      <div className="scrollbar-thin flex-1 overflow-auto">
        {loading && rows.length === 0 ? (
          <div className="text-muted-foreground px-4 py-3 text-xs">{t("csgo.watchlistLoading")}</div>
        ) : (
          rows.map((p) => {
            const pnl = (p.price - p.avgCost) * p.qty;
            const pnlPct = p.avgCost !== 0 ? ((p.price - p.avgCost) / p.avgCost) * 100 : 0;
            const value = p.price * p.qty;
            const isUp = pnl >= 0;
            const active = p.market_hash_name === activeHash;
            return (
              <div
                key={p.market_hash_name}
                role="button"
                tabIndex={0}
                onClick={() => onSelectItem(p.market_hash_name)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectItem(p.market_hash_name);
                  }
                }}
                className={`flex cursor-pointer items-center border-b border-border/50 px-4 py-2 transition-colors hover:bg-muted/30 ${
                  active ? "bg-primary/5" : ""
                }`}
              >
                <CsgoItemIcon src={p.iconUrl} alt={p.name} size="sm" />
                <div className="min-w-0 flex-1 pr-2 pl-1">
                  <div className="line-clamp-2 text-xs font-medium text-foreground">{p.name}</div>
                  {p.dataSource === "demo" ? (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400">demo</span>
                  ) : null}
                </div>
                <span className="w-12 shrink-0 text-right font-mono text-xs text-foreground">
                  {p.qty}
                </span>
                <span className="w-16 shrink-0 text-right font-mono text-xs text-muted-foreground">
                  {p.avgCost.toFixed(2)}
                </span>
                <span
                  className={`w-16 shrink-0 text-right font-mono text-xs font-medium ${p.changePct >= 0 ? "text-up" : "text-down"}`}
                >
                  {p.price > 0 ? p.price.toFixed(2) : "—"}
                </span>
                <div className="flex w-20 shrink-0 items-center justify-end gap-1">
                  {p.price > 0 ? (
                    isUp ? (
                      <TrendingUpIcon size={10} className="text-up" />
                    ) : (
                      <TrendingDownIcon size={10} className="text-down" />
                    )
                  ) : null}
                  <span className={`font-mono text-xs font-medium ${isUp ? "text-up" : "text-down"}`}>
                    {p.price > 0 ? `${isUp ? "+" : ""}${pnl.toFixed(0)}` : "—"}
                  </span>
                </div>
                <span className={`w-14 shrink-0 text-right font-mono text-xs ${isUp ? "text-up" : "text-down"}`}>
                  {p.price > 0 ? `${isUp ? "+" : ""}${pnlPct.toFixed(2)}%` : "—"}
                </span>
                <span className="w-20 shrink-0 text-right font-mono text-xs text-foreground">
                  {p.price > 0 ? value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "—"}
                </span>
                <span
                  className={`w-14 shrink-0 text-right font-mono text-xs ${p.changePct >= 0 ? "text-up" : "text-down"}`}
                >
                  {p.price > 0 ? `${p.changePct >= 0 ? "+" : ""}${p.changePct.toFixed(2)}%` : "—"}
                </span>
                <div className="w-20 shrink-0 text-right">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectItem(p.market_hash_name);
                    }}
                    className="border-border text-primary rounded border bg-primary/10 px-2 py-0.5 text-xs transition-colors hover:bg-primary/20"
                  >
                    {t("csgo.watchlistOpenChart")}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

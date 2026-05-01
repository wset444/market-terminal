"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUpIcon, TrendingDownIcon, RefreshCwIcon } from "lucide-react";
import { useI18n } from "@/contexts/LocaleContext";

type WatchlistPositionRow = {
  code: string;
  name: string;
  shares: number;
  avgCost: number;
  price: number;
  prevClose: number;
  changePct: number;
};

type PositionTableProps = {
  /**
   * 若设为 `/`，在操作列增加「看盘」链到 `/?code=`（用于自选独立页）。
   * 行情页内嵌不传，避免重复入口。
   */
  quoteLinkBase?: string;
};

/**
 * 自选持仓：现价与昨收为接口真实数据；股数与成本价来自 `watchlist-config.ts`。
 */
export default function PositionTable({ quoteLinkBase }: PositionTableProps = {}) {
  const { t } = useI18n();
  const [rows, setRows] = useState<WatchlistPositionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await fetch(`/api/stock/watchlist`);
      const j: unknown = await res.json();
      const data = (j as { data?: WatchlistPositionRow[] }).data;
      if (Array.isArray(data)) setRows(data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const id = setInterval(load, 6000);
    return () => clearInterval(id);
  }, []);

  const totalCost = rows.reduce((s, p) => s + p.avgCost * p.shares, 0);
  const totalValue = rows.reduce((s, p) => s + p.price * p.shares, 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  return (
    <div data-cmp="PositionTable" className="flex h-full flex-col">
      <div className="flex items-center gap-4 border-b border-border bg-panel-header px-4 py-2">
        <span className="text-xs font-medium text-foreground">{t("positionTable.title")}</span>
        <div className="ml-2 flex items-center gap-3">
          <div className="text-xs">
            <span className="text-muted-foreground">{t("positionTable.totalValue")}</span>
            <span className="ml-1 font-mono font-medium text-foreground">
              ¥{totalValue.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            </span>
          </div>
          <div className="text-xs">
            <span className="text-muted-foreground">{t("positionTable.totalPnl")}</span>
            <span
              className={`ml-1 font-mono font-medium ${totalPnl >= 0 ? "text-up" : "text-down"}`}
            >
              {totalPnl >= 0 ? "+" : ""}
              {totalPnl.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            </span>
          </div>
          <div className="text-xs">
            <span className="text-muted-foreground">{t("positionTable.returnPct")}</span>
            <span
              className={`ml-1 font-mono font-medium ${totalPnlPct >= 0 ? "text-up" : "text-down"}`}
            >
              {totalPnlPct >= 0 ? "+" : ""}
              {totalPnlPct.toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => void load()}
          className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <RefreshCwIcon size={11} />
          <span>{t("positionTable.refresh")}</span>
        </button>
      </div>

      <div className="flex items-center border-b border-border bg-muted/30 px-4 py-1.5 text-xs text-muted-foreground">
        <span className="w-28">{t("positionTable.colName")}</span>
        <span className="w-16 text-right">{t("positionTable.colShares")}</span>
        <span className="w-16 text-right">{t("positionTable.colCost")}</span>
        <span className="w-16 text-right">{t("positionTable.colPrice")}</span>
        <span className="w-20 text-right">{t("positionTable.colPnl")}</span>
        <span className="w-16 text-right">{t("positionTable.colPnlPct")}</span>
        <span className="w-20 text-right">{t("positionTable.colValue")}</span>
        <span className="w-16 text-right">{t("positionTable.colChg")}</span>
        <span className="flex-1 text-right">{t("positionTable.colAction")}</span>
      </div>

      <div className="scrollbar-thin flex-1 overflow-auto">
        {loading && rows.length === 0 ? (
          <div className="text-muted-foreground px-4 py-3 text-xs">{t("positionTable.loading")}</div>
        ) : (
          rows.map((p) => {
            const pnl = (p.price - p.avgCost) * p.shares;
            const pnlPct = p.avgCost !== 0 ? ((p.price - p.avgCost) / p.avgCost) * 100 : 0;
            const value = p.price * p.shares;
            const isUp = pnl >= 0;
            return (
              <div
                key={p.code}
                className="flex cursor-pointer items-center border-b border-border/50 px-4 py-2 transition-colors hover:bg-muted/30"
              >
                <div className="w-28">
                  <div className="text-xs font-medium text-foreground">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.code}</div>
                </div>
                <span className="w-16 text-right font-mono text-xs text-foreground">{p.shares}</span>
                <span className="w-16 text-right font-mono text-xs text-muted-foreground">
                  {p.avgCost.toFixed(2)}
                </span>
                <span
                  className={`w-16 text-right font-mono text-xs font-medium ${p.changePct >= 0 ? "text-up" : "text-down"}`}
                >
                  {p.price.toFixed(2)}
                </span>
                <div className="flex w-20 items-center justify-end gap-1">
                  {isUp ? (
                    <TrendingUpIcon size={10} className="text-up" />
                  ) : (
                    <TrendingDownIcon size={10} className="text-down" />
                  )}
                  <span className={`font-mono text-xs font-medium ${isUp ? "text-up" : "text-down"}`}>
                    {isUp ? "+" : ""}
                    {pnl.toFixed(0)}
                  </span>
                </div>
                <span className={`w-16 text-right font-mono text-xs ${isUp ? "text-up" : "text-down"}`}>
                  {isUp ? "+" : ""}
                  {pnlPct.toFixed(2)}%
                </span>
                <span className="w-20 text-right font-mono text-xs text-foreground">
                  {value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                </span>
                <span
                  className={`w-16 text-right font-mono text-xs ${p.changePct >= 0 ? "text-up" : "text-down"}`}
                >
                  {p.changePct >= 0 ? "+" : ""}
                  {p.changePct.toFixed(2)}%
                </span>
                <div className="flex flex-1 items-center justify-end gap-1">
                  {quoteLinkBase ? (
                    <Link
                      href={`${quoteLinkBase}?code=${encodeURIComponent(p.code)}`}
                      className="border-border text-primary rounded border bg-primary/10 px-2 py-0.5 text-xs transition-colors hover:bg-primary/20"
                    >
                      {t("positionTable.openChart")}
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    className="rounded bg-up/10 px-2 py-0.5 text-xs text-up transition-colors hover:bg-up/20"
                  >
                    {t("positionTable.buy")}
                  </button>
                  <button
                    type="button"
                    className="rounded bg-down/10 px-2 py-0.5 text-xs text-down transition-colors hover:bg-down/20"
                  >
                    {t("positionTable.sell")}
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

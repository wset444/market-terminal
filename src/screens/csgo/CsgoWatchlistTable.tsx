"use client";

import { useEffect, useState } from "react";
import { GripVertical, TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import { useGlobalRefresh } from "@/contexts/GlobalRefreshContext";
import { useI18n } from "@/contexts/LocaleContext";
import {
  mergeOrderWithConfig,
  readCsgoWatchlistOrderRaw,
  reorderCsgoWatchlistOrder,
  sortCsgoWatchlistRows,
} from "@/services/csgo/watchlistOrder";
import type { CsgoWatchlistApiRow } from "@/types/csgo";
import { CsgoItemIcon } from "./CsgoItemIcon";

type CsgoWatchlistTableProps = {
  onSelectItem: (marketHashName: string) => void;
  activeHash: string;
};

/**
 * CS2「库存/关注」表：数据来自 `/api/csgo/watchlist`；行顺序可拖动手柄重排并写入 `watchlistOrder`。
 * 顶栏与 A 股 `PositionTable` 一致：`flex items-center` 单行、左右控件同一基线。
 */
export default function CsgoWatchlistTable({ onSelectItem, activeHash }: CsgoWatchlistTableProps) {
  const { t } = useI18n();
  const { generation } = useGlobalRefresh();
  const [rows, setRows] = useState<CsgoWatchlistApiRow[]>([]);
  const [orderKeys, setOrderKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const load = async () => {
    try {
      const res = await fetch(`/api/csgo/watchlist`);
      const j: unknown = await res.json();
      const data = (j as { data?: CsgoWatchlistApiRow[] }).data;
      const list = Array.isArray(data) ? data : [];
      const merged = mergeOrderWithConfig(readCsgoWatchlistOrderRaw());
      setOrderKeys(merged);
      setRows(sortCsgoWatchlistRows(list, merged));
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const boot = window.setTimeout(() => {
      void load();
    }, 0);
    const id = setInterval(() => {
      void load();
    }, 45_000);
    return () => {
      clearTimeout(boot);
      clearInterval(id);
    };
  }, [generation]);

  const totalCost = rows.reduce((s, p) => s + p.avgCost * p.qty, 0);
  const totalValue = rows.reduce((s, p) => s + p.price * p.qty, 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  return (
    <div data-cmp="CsgoWatchlistTable" className="flex h-full flex-col">
      <div className="border-border bg-panel-header flex items-center gap-4 border-b px-4 py-2">
        <span className="shrink-0 text-xs font-medium text-foreground">{t("csgo.watchlistTitle")}</span>
        <div className="ml-2 flex shrink-0 items-center gap-3">
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
        <div className="min-w-0 flex-1" />
        <span
          className="text-muted-foreground hidden max-w-[min(20rem,42vw)] shrink-0 truncate text-xs lg:inline"
          title={t("csgo.watchlistConfigHint")}
        >
          {t("csgo.watchlistConfigHint")}
        </span>
      </div>

      <div className="flex items-center border-b border-border bg-muted/30 px-4 py-1.5 text-xs text-muted-foreground">
        <span className="flex w-5 shrink-0 justify-center" title={t("positionTable.dragHandleAria")}>
          <span className="sr-only">{t("positionTable.reorderColumnSrOnly")}</span>
          <GripVertical size={12} className="text-muted-foreground/50" aria-hidden />
        </span>
        <span className="w-11 shrink-0" aria-hidden />
        <span className="min-w-0 flex-1 pl-1">{t("csgo.watchlistColName")}</span>
        <span className="w-12 shrink-0 text-right">{t("csgo.watchlistColQty")}</span>
        <span className="w-16 shrink-0 text-right">{t("csgo.watchlistColCost")}</span>
        <span className="w-16 shrink-0 text-right">{t("csgo.watchlistColLast")}</span>
        <span className="w-20 shrink-0 text-right">{t("csgo.watchlistColPnl")}</span>
        <span className="w-14 shrink-0 text-right">{t("csgo.watchlistColPnlPct")}</span>
        <span className="w-20 shrink-0 text-right">{t("csgo.watchlistColValue")}</span>
        <span className="w-14 shrink-0 text-right">{t("csgo.watchlistColRefChg")}</span>
      </div>

      <div className="scrollbar-thin flex-1 overflow-auto">
        {loading && rows.length === 0 ? (
          <div className="text-muted-foreground px-4 py-3 text-xs">{t("csgo.watchlistLoading")}</div>
        ) : (
          rows.map((p, index) => {
            const pnl = (p.price - p.avgCost) * p.qty;
            const pnlPct = p.avgCost !== 0 ? ((p.price - p.avgCost) / p.avgCost) * 100 : 0;
            const value = p.price * p.qty;
            const isUp = pnl >= 0;
            const active = p.market_hash_name === activeHash;
            const dragActive = draggingIndex !== null;
            const isDragOver = dragActive && dragOverIndex === index && draggingIndex !== index;
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
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  setDragOverIndex(index);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const raw = e.dataTransfer.getData("application/x-csgo-watchlist-index");
                  const from = Number.parseInt(raw, 10);
                  setDragOverIndex(null);
                  setDraggingIndex(null);
                  if (!Number.isFinite(from) || orderKeys.length === 0) return;
                  const nextOrder = reorderCsgoWatchlistOrder(from, index, orderKeys);
                  setOrderKeys(nextOrder);
                  setRows((prev) => sortCsgoWatchlistRows(prev, nextOrder));
                }}
                className={`flex cursor-pointer items-center border-b border-border/50 px-4 py-2 transition-colors hover:bg-muted/30 ${
                  active ? "bg-primary/5" : ""
                } ${draggingIndex === index ? "opacity-50" : ""} ${
                  isDragOver ? "bg-primary/15 ring-1 ring-inset ring-primary/30" : ""
                }`}
              >
                <div
                  className="text-muted-foreground flex w-5 shrink-0 cursor-grab items-center justify-center active:cursor-grabbing"
                  draggable
                  aria-label={t("positionTable.dragHandleAria")}
                  title={t("positionTable.dragHandleAria")}
                  onClick={(e) => e.stopPropagation()}
                  onDragStart={(e) => {
                    e.stopPropagation();
                    setDraggingIndex(index);
                    e.dataTransfer.setData("application/x-csgo-watchlist-index", String(index));
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragEnd={() => {
                    setDraggingIndex(null);
                    setDragOverIndex(null);
                  }}
                >
                  <GripVertical size={14} />
                </div>
                <div className="flex w-11 shrink-0 justify-center">
                  <CsgoItemIcon src={p.iconUrl} alt={p.name} size="sm" />
                </div>
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
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

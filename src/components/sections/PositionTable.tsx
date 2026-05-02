"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GripVertical, TrendingUpIcon, TrendingDownIcon, RefreshCwIcon } from "lucide-react";
import { useI18n } from "@/contexts/LocaleContext";
import { reorderFavoriteCodes } from "@/services/stock/watchlistFavorites";

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
   * 已收藏的 6 位代码（来自 `localStorage`，仅这些会请求批价并展示）。
   */
  favoriteCodes: string[];
  /**
   * 若设为 `/`，在操作列增加「看盘」链到 `/?code=`（用于自选独立页）。
   * 行情页内嵌不传，避免重复入口。
   */
  quoteLinkBase?: string;
  /**
   * 1. 点击数据行（非操作列内按钮）时回调 6 位 `code`。
   * 2. 由 `StockDashboard` 传入以切换主图、盘口等。
   * 3. 未传时行仍可 hover，但不切换主图。
   */
  onSelectCode?: (code: string) => void;
  /** 当前主图标的，用于行背景高亮 */
  selectedCode?: string;
  /**
   * 自选顺序变更（拖拽排序后）：由父组件 `setFavoriteCodes`；与 `localStorage` 写入在 `reorderFavoriteCodes` 内完成。
   */
  onFavoritesReorder?: (codes: string[]) => void;
};

/**
 * 自选持仓：仅展示 `favoriteCodes` 中的标的；现价来自接口，股数/成本优先 `watchlist-config` 命中项否则默认演示值。
 *
 * 若传入 `onFavoritesReorder`，左侧手柄支持 HTML5 拖拽调整自选顺序并持久化。
 */
export default function PositionTable({
  favoriteCodes,
  quoteLinkBase,
  onSelectCode,
  selectedCode,
  onFavoritesReorder,
}: PositionTableProps) {
  const { t } = useI18n();
  const [rows, setRows] = useState<WatchlistPositionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const codesKey = favoriteCodes.join(",");

  const load = async () => {
    if (favoriteCodes.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const q = encodeURIComponent(favoriteCodes.join(","));
      const res = await fetch(`/api/stock/watchlist?codes=${q}`);
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
    const boot = window.setTimeout(() => {
      void load();
    }, 0);
    const id = setInterval(() => {
      void load();
    }, 60_000);
    return () => {
      clearTimeout(boot);
      clearInterval(id);
    };
  }, [codesKey]);

  const totalCost = rows.reduce((s, p) => s + p.avgCost * p.shares, 0);
  const totalValue = rows.reduce((s, p) => s + p.price * p.shares, 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  return (
    <div data-cmp="PositionTable" className="flex h-full flex-col">
      <div className="border-border bg-panel-header flex items-center gap-4 border-b px-4 py-2">
        <span className="shrink-0 text-xs font-medium text-foreground">{t("positionTable.title")}</span>
        <div className="ml-2 flex shrink-0 items-center gap-3">
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
        <div className="min-w-0 flex-1" />
        <button
          type="button"
          onClick={() => void load()}
          className="text-muted-foreground hover:text-foreground flex shrink-0 items-center gap-1 text-xs transition-colors"
        >
          <RefreshCwIcon size={11} />
          <span>{t("positionTable.refresh")}</span>
        </button>
      </div>

      <div className="flex items-center border-b border-border bg-muted/30 px-4 py-1.5 text-xs text-muted-foreground">
        {onFavoritesReorder ? (
          <span className="flex w-5 shrink-0 justify-center" title={t("positionTable.dragHandleAria")}>
            <span className="sr-only">{t("positionTable.reorderColumnSrOnly")}</span>
            <GripVertical size={12} className="text-muted-foreground/50" aria-hidden />
          </span>
        ) : null}
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
        {!loading && favoriteCodes.length === 0 ? (
          <div className="text-muted-foreground px-4 py-3 text-xs leading-relaxed">
            {t("positionTable.emptyFavorites")}
          </div>
        ) : loading && rows.length === 0 ? (
          <div className="text-muted-foreground px-4 py-3 text-xs">{t("positionTable.loading")}</div>
        ) : (
          rows.map((p, index) => {
            const pnl = (p.price - p.avgCost) * p.shares;
            const pnlPct = p.avgCost !== 0 ? ((p.price - p.avgCost) / p.avgCost) * 100 : 0;
            const value = p.price * p.shares;
            const isUp = pnl >= 0;
            const dragActive = draggingIndex !== null;
            const isDragOver = dragActive && dragOverIndex === index && draggingIndex !== index;
            return (
              <div
                key={p.code}
                role={onSelectCode ? "button" : undefined}
                tabIndex={onSelectCode ? 0 : undefined}
                onClick={() => onSelectCode?.(p.code)}
                onKeyDown={(e) => {
                  if (!onSelectCode) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectCode(p.code);
                  }
                }}
                onDragOver={
                  onFavoritesReorder
                    ? (e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        setDragOverIndex(index);
                      }
                    : undefined
                }
                onDrop={
                  onFavoritesReorder
                    ? (e) => {
                        e.preventDefault();
                        const raw = e.dataTransfer.getData("application/x-watchlist-index");
                        const from = Number.parseInt(raw, 10);
                        setDragOverIndex(null);
                        setDraggingIndex(null);
                        if (!Number.isFinite(from)) return;
                        onFavoritesReorder(reorderFavoriteCodes(from, index));
                      }
                    : undefined
                }
                className={`flex cursor-pointer items-center border-b border-border/50 px-4 py-2 transition-colors hover:bg-muted/30 ${
                  selectedCode === p.code ? "bg-primary/10" : ""
                } ${draggingIndex === index ? "opacity-50" : ""} ${
                  isDragOver ? "bg-primary/15 ring-1 ring-inset ring-primary/30" : ""
                }`}
              >
                {onFavoritesReorder ? (
                  <div
                    className="text-muted-foreground flex w-5 shrink-0 cursor-grab items-center justify-center active:cursor-grabbing"
                    draggable
                    aria-label={t("positionTable.dragHandleAria")}
                    title={t("positionTable.dragHandleAria")}
                    onClick={(e) => e.stopPropagation()}
                    onDragStart={(e) => {
                      e.stopPropagation();
                      setDraggingIndex(index);
                      e.dataTransfer.setData("application/x-watchlist-index", String(index));
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragEnd={() => {
                      setDraggingIndex(null);
                      setDragOverIndex(null);
                    }}
                  >
                    <GripVertical size={14} />
                  </div>
                ) : null}
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
                <div className="flex flex-1 items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
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

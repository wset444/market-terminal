"use client";

import { useI18n } from "@/contexts/LocaleContext";
import type { BookLevel } from "@/types/stock";

type OrderBookProps = {
  basePrice: number;
  asks: BookLevel[];
  bids: BookLevel[];
};

/**
 * 五档盘口：数据来自东财 `stock/get` 解析结果。
 */
export default function OrderBook({ basePrice, asks, bids }: OrderBookProps) {
  const { t } = useI18n();
  const askRows = [...asks].slice(0, 5).reverse();
  const bidRows = bids.slice(0, 5);
  const vols = [...askRows, ...bidRows].map((x) => x.volume);
  const maxVol = Math.max(1, ...vols);

  const sumAsk = askRows.reduce((s, x) => s + x.volume, 0);
  const sumBid = bidRows.reduce((s, x) => s + x.volume, 0);
  const total = sumAsk + sumBid;
  const bidPct = total > 0 ? (sumBid / total) * 100 : 50;

  const spread =
    askRows.length && bidRows.length
      ? Math.max(0, +(askRows[askRows.length - 1]!.price - bidRows[0]!.price).toFixed(2))
      : 0;

  return (
    <div data-cmp="OrderBook" className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border bg-panel-header px-3 py-2">
        <span className="text-xs font-medium text-foreground">{t("orderBook.title")}</span>
        <span className="text-xs text-muted-foreground">{t("orderBook.subtitle")}</span>
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-3 py-1 text-xs text-muted-foreground">
          <span>{t("orderBook.sell")}</span>
          <span>{t("orderBook.price")}</span>
          <span>{t("orderBook.vol")}</span>
        </div>

        {askRows.length === 0 ? (
          <div className="px-3 py-2 text-xs text-muted-foreground">{t("orderBook.noAsk")}</div>
        ) : (
          askRows.map((level, i) => (
            <div
              key={`ask-${level.price}-${i}`}
              className="group relative flex items-center justify-between px-3 py-1 hover:bg-muted/50"
            >
              <div
                className="absolute right-0 top-0 h-full bg-down/10"
                style={{ width: `${(level.volume / maxVol) * 50}%` }}
              />
              <span className="z-10 text-xs text-muted-foreground">
                {t("orderBook.askPrefix")}
                {askRows.length - i}
              </span>
              <span className="z-10 font-mono text-xs text-down">{level.price.toFixed(2)}</span>
              <span className="z-10 font-mono text-xs text-foreground">{level.volume}</span>
            </div>
          ))
        )}

        <div className="flex items-center justify-center border-y border-border bg-muted/30 py-1.5">
          <span className="font-mono text-xs font-bold text-up">{basePrice.toFixed(2)}</span>
          <span className="ml-2 text-xs text-muted-foreground">
            {t("orderBook.spread")} {spread.toFixed(2)}
          </span>
        </div>

        {bidRows.length === 0 ? (
          <div className="px-3 py-2 text-xs text-muted-foreground">{t("orderBook.noBid")}</div>
        ) : (
          bidRows.map((level, i) => (
            <div
              key={`bid-${level.price}-${i}`}
              className="group relative flex items-center justify-between px-3 py-1 hover:bg-muted/50"
            >
              <div
                className="absolute right-0 top-0 h-full bg-up/10"
                style={{ width: `${(level.volume / maxVol) * 50}%` }}
              />
              <span className="z-10 text-xs text-muted-foreground">
                {t("orderBook.bidPrefix")}
                {i + 1}
              </span>
              <span className="z-10 font-mono text-xs text-up">{level.price.toFixed(2)}</span>
              <span className="z-10 font-mono text-xs text-foreground">{level.volume}</span>
            </div>
          ))
        )}

        <div className="mt-auto flex items-center gap-1 border-t border-border px-3 py-1.5">
          <div className="flex-1 text-center">
            <div className="text-xs text-up">{t("orderBook.bidSide")}</div>
            <div className="font-mono text-xs font-medium text-foreground">{bidPct.toFixed(1)}%</div>
          </div>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-border">
            <div className="h-full rounded-l-full bg-up" style={{ width: `${bidPct}%` }} />
          </div>
          <div className="flex-1 text-center">
            <div className="text-xs text-down">{t("orderBook.askSide")}</div>
            <div className="font-mono text-xs font-medium text-foreground">
              {(100 - bidPct).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

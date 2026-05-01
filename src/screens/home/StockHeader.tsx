"use client";

import { useMemo } from "react";
import { StarIcon, PlusIcon, BarChart2Icon, Share2Icon, BookmarkIcon } from "lucide-react";
import { useI18n } from "@/contexts/LocaleContext";
import type { StockQuote } from "@/types/stock";

type StockHeaderProps = {
  activePeriod?: number;
  onPeriodChange?: (i: number) => void;
  quote: StockQuote | null;
  quoteLoading?: boolean;
  quoteError?: string | null;
};

function boardTag(code: string, t: (p: string) => string): string {
  if (!/^\d{6}$/.test(code)) return t("board.dash");
  if (code.startsWith("68")) return t("board.star");
  if (code.startsWith("30")) return t("board.chiNext");
  if (code.startsWith("60")) return t("board.sh");
  return t("board.sz");
}

function formatVolHands(h: number, suffix: string, dash: string): string {
  if (h <= 0) return dash;
  return `${(h / 10000).toFixed(2)}${suffix}`;
}

function formatTurnoverYuan(y: number, yi: string, dash: string): string {
  if (y <= 0) return dash;
  return `${(y / 1e8).toFixed(2)}${yi}`;
}

function formatMarketCapYuan(y: number, t: (p: string) => string): string {
  const dash = t("board.dash");
  if (y <= 0) return dash;
  if (y >= 1e12) return `${(y / 1e12).toFixed(2)}${t("units.trillionSuffix")}`;
  return `${(y / 1e8).toFixed(0)}${t("units.yiShort")}`;
}

/**
 * 个股标题栏：对接 `StockQuote` 时展示真实行情；加载/失败时保留占位与提示。
 */
export default function StockHeader({
  activePeriod = 6,
  onPeriodChange = () => {},
  quote,
  quoteLoading = false,
  quoteError = null,
}: StockHeaderProps) {
  const { t, chartPeriods } = useI18n();
  const dash = t("board.dash");
  const price = quote?.price ?? null;
  const prevClose = quote?.prevClose ?? null;
  const hasPair = price !== null && prevClose !== null;
  const change = hasPair ? +(price - prevClose).toFixed(2) : 0;
  const changePct = hasPair && prevClose !== 0 ? +((change / prevClose) * 100).toFixed(2) : 0;
  const isUp = change >= 0;

  const name = quote?.name ?? dash;
  const code = quote?.code ?? `------`;
  const open = quote?.open;
  const high = quote?.high;
  const low = quote?.low;

  const stats = useMemo(() => {
    const volSuffix = t("units.wanLotsSuffix");
    const yi = t("units.yiShort");
    return quote
      ? [
          { label: t("stockHeader.open"), value: open != null ? open.toFixed(2) : dash, colored: false },
          {
            label: t("stockHeader.prevClose"),
            value: prevClose != null ? prevClose.toFixed(2) : dash,
            colored: false,
          },
          {
            label: t("stockHeader.high"),
            value: high != null ? high.toFixed(2) : dash,
            colored: true,
            up: high != null && prevClose != null ? high >= prevClose : true,
          },
          {
            label: t("stockHeader.low"),
            value: low != null ? low.toFixed(2) : dash,
            colored: true,
            up: low != null && prevClose != null ? low >= prevClose : false,
          },
          {
            label: t("stockHeader.volume"),
            value: formatVolHands(quote.volumeHands, volSuffix, dash),
            colored: false,
          },
          {
            label: t("stockHeader.turnover"),
            value: formatTurnoverYuan(quote.turnoverYuan, yi, dash),
            colored: false,
          },
          {
            label: t("stockHeader.turnoverRate"),
            value: quote.turnoverRatePct > 0 ? `${quote.turnoverRatePct.toFixed(2)}%` : dash,
            colored: false,
          },
          {
            label: t("stockHeader.pe"),
            value: quote.peDynamic != null ? quote.peDynamic.toFixed(2) : dash,
            colored: false,
          },
          {
            label: t("stockHeader.mcap"),
            value: formatMarketCapYuan(quote.marketCapYuan, t),
            colored: false,
          },
        ]
      : [
          { label: t("stockHeader.open"), value: dash, colored: false },
          { label: t("stockHeader.prevClose"), value: dash, colored: false },
          { label: t("stockHeader.high"), value: dash, colored: true, up: true },
          { label: t("stockHeader.low"), value: dash, colored: true, up: false },
          { label: t("stockHeader.volume"), value: dash, colored: false },
          { label: t("stockHeader.turnover"), value: dash, colored: false },
          { label: t("stockHeader.turnoverRate"), value: dash, colored: false },
          { label: t("stockHeader.pe"), value: dash, colored: false },
          { label: t("stockHeader.mcap"), value: dash, colored: false },
        ];
  }, [quote, open, high, low, prevClose, t, dash]);

  const actions = useMemo(
    () => [
      { icon: BarChart2Icon, label: t("stockHeader.compare") },
      { icon: Share2Icon, label: t("stockHeader.share") },
      { icon: BookmarkIcon, label: t("stockHeader.bookmark") },
      { icon: PlusIcon, label: t("stockHeader.addWatchlist") },
    ],
    [t],
  );

  return (
    <div data-cmp="StockHeader" className="border-b border-border bg-panel px-4 py-2.5">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-foreground">{name}</span>
              <span className="text-xs text-muted-foreground">{code}</span>
              <span className="rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground">
                {boardTag(code, t)}
              </span>
              <span className="rounded bg-accent px-1.5 py-0.5 text-xs text-accent-foreground">
                {t("stockHeader.quoteTab")}
              </span>
              {quoteLoading ? (
                <span className="text-xs text-muted-foreground">{t("stockHeader.updating")}</span>
              ) : null}
              {quoteError ? (
                <span className="text-xs text-destructive" title={quoteError}>
                  {t("stockHeader.apiError")} {quoteError}
                </span>
              ) : null}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {quote ? t("stockHeader.dataSource") : t("stockHeader.loadingQuote")}
            </div>
          </div>
          <button
            type="button"
            className="p-1 text-muted-foreground transition-colors hover:text-chart-3"
          >
            <StarIcon size={14} />
          </button>
        </div>

        <div className="ml-2 flex items-end gap-3">
          <div
            className={`font-mono text-3xl font-bold ${hasPair ? (isUp ? "text-up" : "text-down") : "text-foreground"}`}
          >
            {price != null ? price.toFixed(2) : `—.——`}
          </div>
          <div className="flex flex-col items-start pb-0.5">
            <span
              className={`font-mono text-sm font-medium ${hasPair ? (isUp ? "text-up" : "text-down") : "text-muted-foreground"}`}
            >
              {hasPair ? `${isUp ? "+" : ""}${change.toFixed(2)}` : `—`}
            </span>
            <span
              className={`font-mono text-sm font-medium ${hasPair ? (isUp ? "text-up" : "text-down") : "text-muted-foreground"}`}
            >
              {hasPair ? `${isUp ? "+" : ""}${changePct.toFixed(2)}%` : `—`}
            </span>
          </div>
        </div>

        <div className="ml-2 flex gap-4 text-xs">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col gap-0.5">
              <span className="text-muted-foreground">{s.label}</span>
              <span
                className={`font-mono font-medium ${
                  s.colored ? (s.up ? "text-up" : "text-down") : "text-foreground"
                }`}
              >
                {s.value}
              </span>
            </div>
          ))}
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-0.5 rounded bg-muted p-0.5">
          {chartPeriods.map((p, i) => (
            <button
              key={p}
              type="button"
              onClick={() => onPeriodChange(i)}
              className={`rounded px-2 py-1 text-xs transition-colors ${
                activePeriod === i
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          {actions.map(({ icon: Icon, label }) => (
            <button
              key={label}
              type="button"
              className="flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Icon size={12} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

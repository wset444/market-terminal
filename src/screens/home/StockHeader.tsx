"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  StarIcon,
  PlusIcon,
  BarChart2Icon,
  Share2Icon,
  BookmarkIcon,
  SearchIcon,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { shareNativeOrClipboard } from "@/utils/shareNativeOrClipboard";
import { useI18n } from "@/contexts/LocaleContext";
import { addFavoriteCodeIfMissing } from "@/services/stock/watchlistFavorites";
import type { StockQuote, StockSuggestItem } from "@/types/stock";

type StockHeaderProps = {
  activePeriod?: number;
  onPeriodChange?: (i: number) => void;
  quote: StockQuote | null;
  quoteLoading?: boolean;
  quoteError?: string | null;
  activeStockCode: string;
  watchlistFavorited: boolean;
  onToggleWatchlistFavorite: () => void;
  /** 自选代码列表，用于对比弹窗快速点选 */
  favoriteCodes: string[];
  /** 自选列表变更后由父组件同步状态（如「加自选」） */
  onFavoritesUpdated: (codes: string[]) => void;
  /** 当前标的是否已「标记」 */
  marked: boolean;
  onToggleMark: () => void;
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

function pctFromQuote(q: StockQuote | null): number | null {
  if (!q || q.prevClose === 0) return null;
  return +(((q.price - q.prevClose) / q.prevClose) * 100).toFixed(2);
}

/**
 * 个股标题栏：行情区、周期切换、收藏星标，以及对比 / 分享 / 标记 / 加自选操作。
 */
export default function StockHeader({
  activePeriod = 6,
  onPeriodChange = () => {},
  quote,
  quoteLoading = false,
  quoteError = null,
  activeStockCode,
  watchlistFavorited,
  onToggleWatchlistFavorite,
  favoriteCodes,
  onFavoritesUpdated,
  marked,
  onToggleMark,
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
  const code = quote?.code ?? activeStockCode;
  const canFavorite = /^\d{6}$/.test(activeStockCode);
  const open = quote?.open;
  const high = quote?.high;
  const low = quote?.low;

  const [compareOpen, setCompareOpen] = useState(false);
  const [compareQuery, setCompareQuery] = useState("");
  const [compareSuggestions, setCompareSuggestions] = useState<StockSuggestItem[]>([]);
  const [compareSuggestOpen, setCompareSuggestOpen] = useState(false);
  const compareSuggestWrapRef = useRef<HTMLDivElement>(null);
  const [compareQuote, setCompareQuote] = useState<StockQuote | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareErr, setCompareErr] = useState<string | null>(null);
  const [tip, setTip] = useState<string | null>(null);
  const tipTimerRef = useRef<number | undefined>(undefined);

  /** 输入变化时清掉上次对比错误，避免与新的联想搜索混淆 */
  useEffect(() => {
    setCompareErr(null);
  }, [compareQuery]);

  const flashTip = useCallback((msg: string) => {
    setTip(msg);
    window.clearTimeout(tipTimerRef.current);
    tipTimerRef.current = window.setTimeout(() => setTip(null), 2400);
  }, []);

  useEffect(() => {
    return () => window.clearTimeout(tipTimerRef.current);
  }, []);

  useEffect(() => {
    if (!compareOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCompareOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [compareOpen]);

  /** 对比弹窗内：联想 `/api/stock/suggest`，与顶栏搜索一致防抖 */
  useEffect(() => {
    if (!compareOpen) {
      setCompareSuggestions([]);
      return;
    }
    const q = compareQuery.trim();
    if (q.length < 1) {
      setCompareSuggestions([]);
      return;
    }
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(`/api/stock/suggest?q=${encodeURIComponent(q)}&count=10`);
          const j: unknown = await res.json();
          const data = (j as { data?: StockSuggestItem[] }).data;
          setCompareSuggestions(Array.isArray(data) ? data : []);
        } catch {
          setCompareSuggestions([]);
        }
      })();
    }, 280);
    return () => window.clearTimeout(timer);
  }, [compareOpen, compareQuery]);

  /** 点击联想层外关闭下拉 */
  useEffect(() => {
    if (!compareSuggestOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!compareSuggestWrapRef.current?.contains(e.target as Node)) setCompareSuggestOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [compareSuggestOpen]);

  const fetchCompareFor = useCallback(
    async (raw: string) => {
      const c = raw.trim();
      if (!/^\d{6}$/.test(c) || c === activeStockCode) {
        setCompareErr(t("stockHeader.compareErr"));
        setCompareQuote(null);
        setCompareLoading(false);
        return;
      }
      setCompareLoading(true);
      setCompareErr(null);
      setCompareQuote(null);
      try {
        const res = await fetch(`/api/stock/quote?code=${encodeURIComponent(c)}`);
        const j: unknown = await res.json();
        if (!res.ok) {
          const err =
            typeof j === "object" && j !== null && "error" in j
              ? String((j as { error: string }).error)
              : "";
          setCompareErr(err || t("stockHeader.compareErr"));
          return;
        }
        setCompareQuote(j as StockQuote);
      } catch {
        setCompareErr(t("stockHeader.compareErr"));
      } finally {
        setCompareLoading(false);
      }
    },
    [activeStockCode, t],
  );

  const pickCompareSuggestion = useCallback(
    (s: StockSuggestItem) => {
      if (s.code === activeStockCode) {
        setCompareErr(t("stockHeader.compareErr"));
        setCompareQuote(null);
        setCompareSuggestOpen(false);
        return;
      }
      setCompareQuery(`${s.name} ${s.code}`);
      setCompareSuggestOpen(false);
      void fetchCompareFor(s.code);
    },
    [activeStockCode, fetchCompareFor, t],
  );

  const tryCompareFromInput = useCallback(() => {
    const six = compareQuery.replace(/\D/g, "").slice(0, 6);
    if (/^\d{6}$/.test(six)) {
      void fetchCompareFor(six);
      setCompareSuggestOpen(false);
      return;
    }
    const first = compareSuggestions[0];
    if (first) pickCompareSuggestion(first);
  }, [compareQuery, compareSuggestions, fetchCompareFor, pickCompareSuggestion]);

  const onShare = useCallback(async () => {
    if (!canFavorite) return;
    const url = `${window.location.origin}${ROUTES.home}?code=${encodeURIComponent(activeStockCode)}`;
    const r = await shareNativeOrClipboard({
      url,
      title: t("stockHeader.shareNativeTitle"),
      text: `${name} ${code}`,
    });
    if (r === "aborted") return;
    if (r === "failed") flashTip(t("stockHeader.shareFailed"));
    else flashTip(t("stockHeader.shareCopied"));
  }, [flashTip, name, code, activeStockCode, canFavorite, t]);

  const onAddWatchlist = useCallback(() => {
    if (!canFavorite) return;
    const { codes, added } = addFavoriteCodeIfMissing(activeStockCode);
    onFavoritesUpdated(codes);
    flashTip(added ? t("stockHeader.watchlistAdded") : t("stockHeader.watchlistAlready"));
  }, [activeStockCode, canFavorite, flashTip, onFavoritesUpdated, t]);

  const onToggleMarkClick = useCallback(() => {
    if (!canFavorite) return;
    flashTip(marked ? t("stockHeader.markedOff") : t("stockHeader.markedOn"));
    onToggleMark();
  }, [canFavorite, flashTip, marked, onToggleMark, t]);

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

  const comparePickCodes = favoriteCodes.filter((c) => c !== activeStockCode).slice(0, 8);

  const renderMainCompareCard = () => {
    const label = t("stockHeader.compareMain");
    const q = quote;
    const p = q?.price;
    const pc = pctFromQuote(q);
    const up = pc !== null && pc >= 0;
    return (
      <div className="border-border bg-muted/20 flex min-w-0 flex-1 flex-col gap-1 rounded border p-3">
        <span className="text-muted-foreground text-xs">{label}</span>
        {q ? (
          <>
            <span className="truncate text-sm font-medium text-foreground">
              {q.name} <span className="text-muted-foreground font-mono">{q.code}</span>
            </span>
            <span className="font-mono text-lg font-semibold text-foreground">{p?.toFixed(2) ?? dash}</span>
            <span className={`font-mono text-xs font-medium ${up ? "text-up" : "text-down"}`}>
              {pc === null ? dash : `${up ? "+" : ""}${pc.toFixed(2)}%`}
            </span>
          </>
        ) : (
          <span className="text-muted-foreground text-xs">{t("stockHeader.compareLoading")}</span>
        )}
      </div>
    );
  };

  const renderOtherCompareCard = () => {
    const label = t("stockHeader.compareOther");
    const q = compareQuote;
    const p = q?.price;
    const pc = pctFromQuote(q);
    const up = pc !== null && pc >= 0;
    return (
      <div className="border-border bg-muted/20 flex min-w-0 flex-1 flex-col gap-1 rounded border p-3">
        <span className="text-muted-foreground text-xs">{label}</span>
        {q ? (
          <>
            <span className="truncate text-sm font-medium text-foreground">
              {q.name} <span className="text-muted-foreground font-mono">{q.code}</span>
            </span>
            <span className="font-mono text-lg font-semibold text-foreground">{p?.toFixed(2) ?? dash}</span>
            <span className={`font-mono text-xs font-medium ${up ? "text-up" : "text-down"}`}>
              {pc === null ? dash : `${up ? "+" : ""}${pc.toFixed(2)}%`}
            </span>
          </>
        ) : compareLoading ? (
          <span className="text-muted-foreground text-xs">{t("stockHeader.compareLoading")}</span>
        ) : compareErr ? (
          <span className="text-destructive text-xs">{compareErr}</span>
        ) : (
          <span className="text-muted-foreground text-xs">{t("stockHeader.compareNoData")}</span>
        )}
      </div>
    );
  };

  return (
    <div className="relative">
      {tip ? (
        <div
          className="border-border bg-panel pointer-events-none fixed left-1/2 top-16 z-[220] -translate-x-1/2 rounded border px-4 py-2 text-xs font-medium text-foreground shadow-lg"
          role="status"
        >
          {tip}
        </div>
      ) : null}

      {compareOpen ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/55 p-4"
          role="presentation"
          onClick={() => setCompareOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="compare-dialog-title"
            className="border-border bg-panel max-h-[90vh] w-full max-w-lg overflow-visible rounded-lg border shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-border flex items-center justify-between border-b px-4 py-3">
              <h2 id="compare-dialog-title" className="text-sm font-semibold text-foreground">
                {t("stockHeader.compareDialogTitle")}
              </h2>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground rounded px-2 py-1 text-xs"
                onClick={() => setCompareOpen(false)}
              >
                {t("stockHeader.close")}
              </button>
            </div>
            <div className="flex flex-col gap-3 p-4">
              <div ref={compareSuggestWrapRef} className="relative w-full min-w-0 max-w-md">
                <div className="border-border bg-muted/40 flex items-center gap-2 rounded border px-3 py-2">
                  <SearchIcon size={14} className="shrink-0 text-muted-foreground" />
                  <input
                    type="search"
                    name="compare-stock-suggest"
                    autoComplete="off"
                    placeholder={t("topBar.searchPlaceholder")}
                    value={compareQuery}
                    onChange={(e) => {
                      setCompareQuery(e.target.value);
                      setCompareSuggestOpen(true);
                    }}
                    onFocus={() => setCompareSuggestOpen(true)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        tryCompareFromInput();
                      }
                      if (e.key === "Escape") setCompareSuggestOpen(false);
                    }}
                    className="text-foreground placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-xs outline-none"
                  />
                </div>
                {compareSuggestOpen && compareSuggestions.length > 0 ? (
                  <ul className="border-border bg-panel scrollbar-thin absolute left-0 right-0 z-[210] mt-1 max-h-56 overflow-y-auto rounded border shadow-md">
                    {compareSuggestions.map((s) => (
                      <li key={s.code}>
                        <button
                          type="button"
                          className="hover:bg-muted/50 flex w-full items-center gap-2 px-3 py-2 text-left text-xs"
                          onClick={() => pickCompareSuggestion(s)}
                        >
                          <span className="text-foreground min-w-0 flex-1 truncate">{s.name}</span>
                          <span className="text-muted-foreground shrink-0 font-mono tabular-nums">{s.code}</span>
                          <span className="text-muted-foreground/80 w-9 shrink-0 text-right text-[10px]">
                            {s.marketLabel}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              {comparePickCodes.length > 0 ? (
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground text-xs">{t("stockHeader.comparePickHint")}</span>
                  <div className="flex flex-wrap gap-1">
                    {comparePickCodes.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className="border-border bg-muted/30 hover:bg-muted/50 rounded border px-2 py-0.5 font-mono text-xs"
                        onClick={() => {
                          setCompareQuery(c);
                          setCompareErr(null);
                          void fetchCompareFor(c);
                        }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="flex gap-3">
                {renderMainCompareCard()}
                {renderOtherCompareCard()}
              </div>
            </div>
          </div>
        </div>
      ) : null}

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
              disabled={!canFavorite}
              title={watchlistFavorited ? t("stockHeader.favoriteRemove") : t("stockHeader.favoriteAdd")}
              aria-pressed={watchlistFavorited}
              onClick={() => {
                if (canFavorite) onToggleWatchlistFavorite();
              }}
              className={`rounded p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                watchlistFavorited
                  ? "text-amber-400 hover:text-amber-300"
                  : "text-muted-foreground hover:text-chart-3"
              }`}
            >
              <StarIcon size={14} className={watchlistFavorited ? "fill-current" : ""} />
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

          <div className="flex shrink-0 flex-nowrap items-center gap-1">
            <button
              type="button"
              disabled={!canFavorite}
              title={t("stockHeader.compare")}
              onClick={() => {
                setCompareOpen(true);
                setCompareQuery("");
                setCompareSuggestions([]);
                setCompareSuggestOpen(false);
                setCompareQuote(null);
                setCompareErr(null);
                setCompareLoading(false);
              }}
              className="text-muted-foreground hover:text-foreground flex shrink-0 items-center gap-1 whitespace-nowrap rounded px-2 py-1 text-xs transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              <BarChart2Icon size={12} />
              <span>{t("stockHeader.compare")}</span>
            </button>
            <button
              type="button"
              disabled={!canFavorite}
              title={t("stockHeader.share")}
              onClick={() => void onShare()}
              className="text-muted-foreground hover:text-foreground flex shrink-0 items-center gap-1 whitespace-nowrap rounded px-2 py-1 text-xs transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Share2Icon size={12} />
              <span>{t("stockHeader.share")}</span>
            </button>
            <button
              type="button"
              disabled={!canFavorite}
              title={t("stockHeader.bookmark")}
              aria-pressed={marked}
              onClick={onToggleMarkClick}
              className={`flex shrink-0 items-center gap-1 whitespace-nowrap rounded px-2 py-1 text-xs transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 ${
                marked ? "text-sky-400 hover:text-sky-300" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BookmarkIcon size={12} className={marked ? "fill-current" : ""} />
              <span>{t("stockHeader.bookmark")}</span>
            </button>
            <button
              type="button"
              disabled={!canFavorite}
              title={t("stockHeader.addWatchlist")}
              onClick={onAddWatchlist}
              className="text-muted-foreground hover:text-foreground flex shrink-0 items-center gap-1 whitespace-nowrap rounded px-2 py-1 text-xs transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              <PlusIcon size={12} />
              <span>{t("stockHeader.addWatchlist")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

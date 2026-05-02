"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { StarIcon, BarChart2Icon, Share2Icon, BookmarkIcon, PlusIcon } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { useI18n } from "@/contexts/LocaleContext";
import { addCsgoFavoriteIfMissing } from "@/services/csgo/csgoFavorites";
import type { CsgoQuote } from "@/types/csgo";
import { shareNativeOrClipboard } from "@/utils/shareNativeOrClipboard";
import { CsgoItemIcon } from "./CsgoItemIcon";

type CsgoItemHeaderProps = {
  marketHashName: string;
  quote: CsgoQuote | null;
  quoteLoading?: boolean;
  quoteError?: string | null;
  /** 当前饰品是否在自选列表中 */
  watchlistFavorited: boolean;
  /** 星标：加入 / 移出自选 */
  onToggleWatchlistFavorite: () => void;
  /** 「加自选」成功后回传最新列表（与 A 股 `StockHeader` 一致） */
  onFavoritesUpdated: (hashes: string[]) => void;
};

/**
 * CS2 饰品标题区：字号与排布对齐 **A 股 `StockHeader`**；星标切换自选，`+ 加自选` 仅追加不重复项。
 */
export default function CsgoItemHeader({
  marketHashName,
  quote,
  quoteLoading = false,
  quoteError = null,
  watchlistFavorited,
  onToggleWatchlistFavorite,
  onFavoritesUpdated,
}: CsgoItemHeaderProps) {
  const { t } = useI18n();
  const dash = "—";
  const price = quote?.lowest ?? null;
  const median = quote?.median ?? null;
  const vol = quote?.volume ?? null;
  const canFavorite = marketHashName.trim().length > 0;

  const [tip, setTip] = useState<string | null>(null);
  const tipTimerRef = useRef<number | undefined>(undefined);

  const flashTip = useCallback((msg: string) => {
    setTip(msg);
    window.clearTimeout(tipTimerRef.current);
    tipTimerRef.current = window.setTimeout(() => setTip(null), 2400);
  }, []);

  useEffect(() => {
    return () => window.clearTimeout(tipTimerRef.current);
  }, []);

  const onShare = useCallback(async () => {
    const name = marketHashName.trim();
    if (!name) return;
    const url = `${window.location.origin}${ROUTES.csgo}?item=${encodeURIComponent(name)}`;
    const r = await shareNativeOrClipboard({
      url,
      title: t("stockHeader.shareNativeTitle"),
      text: name,
    });
    if (r === "aborted") return;
    if (r === "failed") flashTip(t("stockHeader.shareFailed"));
    else flashTip(t("stockHeader.shareCopied"));
  }, [flashTip, marketHashName, t]);

  const onAddWatchlist = useCallback(() => {
    if (!canFavorite) return;
    const { hashes, added } = addCsgoFavoriteIfMissing(marketHashName);
    onFavoritesUpdated(hashes);
    flashTip(added ? t("stockHeader.watchlistAdded") : t("stockHeader.watchlistAlready"));
  }, [canFavorite, flashTip, marketHashName, onFavoritesUpdated, t]);

  return (
    <div data-cmp="CsgoItemHeader" className="relative border-b border-border bg-panel px-4 py-2.5">
      {tip ? (
        <div
          className="border-border bg-panel pointer-events-none fixed left-1/2 top-16 z-[220] -translate-x-1/2 rounded border px-4 py-2 text-xs font-medium text-foreground shadow-lg"
          role="status"
        >
          {tip}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <CsgoItemIcon src={quote?.iconUrl} alt={marketHashName} size="header" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-bold text-foreground">{marketHashName}</span>
              <span className="rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground">
                {t("csgo.headerTag")}
              </span>
              <span className="rounded bg-accent px-1.5 py-0.5 text-xs text-accent-foreground">
                {t("stockHeader.quoteTab")}
              </span>
              <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                {t("csgo.dailySteam")}
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
            <div className="mt-0.5 max-w-[min(100vw-8rem,52rem)] truncate text-xs text-muted-foreground">
              {t("csgo.dataSource")}
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
          <div className="font-mono text-3xl font-bold leading-none tabular-nums text-foreground">
            {price != null ? price.toFixed(2) : `—.——`}
          </div>
          <div className="text-muted-foreground flex flex-col items-start pb-0.5 text-xs">
            <span className="font-mono">{quote?.lowestRaw ?? dash}</span>
          </div>
        </div>

        <div className="ml-2 flex gap-4 text-xs">
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground">{t("csgo.median")}</span>
            <span className="font-mono font-medium text-foreground">
              {median != null ? median.toFixed(2) : dash}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground">{t("csgo.volume24h")}</span>
            <span className="font-mono font-medium text-foreground">
              {vol != null ? vol.toLocaleString() : dash}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground">{t("csgo.lowest")}</span>
            <span className="font-mono font-medium text-foreground">
              {quote?.lowestRaw ?? dash}
            </span>
          </div>
        </div>

        <div className="flex-1" />

        <div className="flex shrink-0 flex-nowrap items-center gap-1">
          <button
            type="button"
            disabled={!canFavorite}
            title={t("stockHeader.compare")}
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
            className="text-muted-foreground hover:text-foreground flex shrink-0 items-center gap-1 whitespace-nowrap rounded px-2 py-1 text-xs transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            <BookmarkIcon size={12} />
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
  );
}

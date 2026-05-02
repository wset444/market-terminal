"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ColumnResizeHandle } from "@/components/layout/ColumnResizeHandle";
import { RowResizeHandle } from "@/components/layout/RowResizeHandle";
import TopBar from "@/components/layout/TopBar";
import { useI18n } from "@/contexts/LocaleContext";
import { useCsgoQuote } from "@/hooks/useCsgoQuote";
import OrderBook from "@/screens/home/OrderBook";
import KLineChart from "@/screens/home/KLineChart";
import {
  readCsgoLeftColWidth,
  readCsgoOrderbookHeight,
  readCsgoRightColWidth,
  readCsgoRightListingHeight,
  CSGO_LEFT_COL_DEFAULT,
  CSGO_LEFT_COL_MAX,
  CSGO_LEFT_COL_MIN,
  CSGO_ORDERBOOK_H_DEFAULT,
  CSGO_ORDERBOOK_H_MAX,
  CSGO_ORDERBOOK_H_MIN,
  CSGO_RIGHT_COL_DEFAULT,
  CSGO_RIGHT_COL_MAX,
  CSGO_RIGHT_COL_MIN,
  CSGO_RIGHT_LISTING_H_DEFAULT,
  CSGO_RIGHT_LISTING_H_MAX,
  CSGO_RIGHT_LISTING_H_MIN,
  writeCsgoLeftColWidth,
  writeCsgoOrderbookHeight,
  writeCsgoRightColWidth,
  writeCsgoRightListingHeight,
} from "@/utils/layoutPrefs";
import {
  CSGO_FAVORITES_KEY,
  readCsgoFavoriteHashes,
  toggleCsgoFavoriteHash,
} from "@/services/csgo/csgoFavorites";
import CsgoItemHeader from "./CsgoItemHeader";
import CsgoListingStats from "./CsgoListingStats";
import CsgoMarketFeedPanel from "./CsgoMarketFeedPanel";
import CsgoPopularPanel from "./CsgoPopularPanel";
import CsgoTicksStub from "./CsgoTicksStub";
import CsgoWatchlistTable from "./CsgoWatchlistTable";

/** 演示默认饰品（Steam `market_hash_name`） */
export const DEFAULT_CSGO_ITEM = `AK-47 | Redline (Field-Tested)`;

function clampCsgoLeft(w: number): number {
  return Math.min(CSGO_LEFT_COL_MAX, Math.max(CSGO_LEFT_COL_MIN, w));
}

function clampCsgoRight(w: number): number {
  return Math.min(CSGO_RIGHT_COL_MAX, Math.max(CSGO_RIGHT_COL_MIN, w));
}

function clampOrderbookH(h: number): number {
  return Math.min(CSGO_ORDERBOOK_H_MAX, Math.max(CSGO_ORDERBOOK_H_MIN, h));
}

function clampRightListingH(h: number): number {
  return Math.min(CSGO_RIGHT_LISTING_H_MAX, Math.max(CSGO_RIGHT_LISTING_H_MIN, h));
}

export type CsgoDashboardProps = {
  initialMarketHashName?: string;
};

/**
 * CS2 饰品看板：左栏盘口 + Steam 热门（中间可拖高度）；右栏挂牌 + 分时成交（中间可拖高度）；中区 K 线与持仓表。
 */
export function CsgoDashboard({ initialMarketHashName }: CsgoDashboardProps) {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [item, setItem] = useState(
    () => initialMarketHashName?.trim() || DEFAULT_CSGO_ITEM,
  );
  const [leftColW, setLeftColW] = useState(CSGO_LEFT_COL_DEFAULT);
  const [rightColW, setRightColW] = useState(CSGO_RIGHT_COL_DEFAULT);
  const leftColRef = useRef(CSGO_LEFT_COL_DEFAULT);
  const rightColRef = useRef(CSGO_RIGHT_COL_DEFAULT);

  const [orderbookH, setOrderbookH] = useState(CSGO_ORDERBOOK_H_DEFAULT);
  const orderbookHRef = useRef(CSGO_ORDERBOOK_H_DEFAULT);

  const [rightListingH, setRightListingH] = useState(CSGO_RIGHT_LISTING_H_DEFAULT);
  const rightListingHRef = useRef(CSGO_RIGHT_LISTING_H_DEFAULT);

  const [favoriteHashes, setFavoriteHashes] = useState<string[]>([]);

  const urlItem = searchParams.get("item")?.trim() ?? "";
  useEffect(() => {
    if (!urlItem) return;
    const id = window.setTimeout(() => setItem(urlItem), 0);
    return () => clearTimeout(id);
  }, [urlItem]);

  useEffect(() => {
    const boot = window.setTimeout(() => {
      const L = readCsgoLeftColWidth();
      const R = readCsgoRightColWidth();
      setLeftColW((x) => {
        const n = clampCsgoLeft(L ?? x);
        leftColRef.current = n;
        return n;
      });
      setRightColW((x) => {
        const n = clampCsgoRight(R ?? x);
        rightColRef.current = n;
        return n;
      });
      const oh = readCsgoOrderbookHeight();
      if (oh != null) {
        const n = clampOrderbookH(oh);
        orderbookHRef.current = n;
        setOrderbookH(n);
      }
      const rl = readCsgoRightListingHeight();
      if (rl != null) {
        const n = clampRightListingH(rl);
        rightListingHRef.current = n;
        setRightListingH(n);
      }
    }, 0);
    return () => clearTimeout(boot);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => setFavoriteHashes(readCsgoFavoriteHashes()), 0);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === CSGO_FAVORITES_KEY || e.key === null) setFavoriteHashes(readCsgoFavoriteHashes());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persistColWidths = useCallback(() => {
    writeCsgoLeftColWidth(leftColRef.current);
    writeCsgoRightColWidth(rightColRef.current);
  }, []);

  const persistLeftRowHeights = useCallback(() => {
    writeCsgoOrderbookHeight(orderbookHRef.current);
  }, []);

  const persistRightRowHeights = useCallback(() => {
    writeCsgoRightListingHeight(rightListingHRef.current);
  }, []);

  const onLeftDragDelta = useCallback((dx: number) => {
    setLeftColW((w) => {
      const n = clampCsgoLeft(w + dx);
      leftColRef.current = n;
      return n;
    });
  }, []);

  const onRightDragDelta = useCallback((dx: number) => {
    setRightColW((w) => {
      const n = clampCsgoRight(w - dx);
      rightColRef.current = n;
      return n;
    });
  }, []);

  /** 盘口与下方 Steam 热门之间：拖动调整盘口区高度 */
  const onOrderbookPopularRowDrag = useCallback((dy: number) => {
    setOrderbookH((h) => {
      const n = clampOrderbookH(h + dy);
      orderbookHRef.current = n;
      return n;
    });
  }, []);

  /** 右栏挂牌与分时成交之间：拖动调整挂牌区高度 */
  const onRightListingTicksRowDrag = useCallback((dy: number) => {
    setRightListingH((h) => {
      const n = clampRightListingH(h + dy);
      rightListingHRef.current = n;
      return n;
    });
  }, []);

  const onPickItem = useCallback(
    (hash: string) => {
      const v = hash.trim();
      if (!v) return;
      setItem(v);
      const q = new URLSearchParams(searchParams.toString());
      q.set("item", v);
      router.replace(`/csgo?${q.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const { quote, loading: quoteLoading, error: quoteError } = useCsgoQuote({
    marketHashName: item,
    pollMs: 45_000,
  });

  const livePrice = quote?.lowest ?? 0;

  const watchlistFavorited = favoriteHashes.some((h) => h === item);

  const onToggleWatchlistFavorite = useCallback(() => {
    setFavoriteHashes(toggleCsgoFavoriteHash(item));
  }, [item]);

  const onCsgoFavoritesUpdated = useCallback((hashes: string[]) => {
    setFavoriteHashes(hashes);
  }, []);

  return (
    <div
      data-cmp="CsgoDashboard"
      className="bg-background flex h-dvh min-h-0 min-w-[1440px] flex-col overflow-hidden"
    >
      <TopBar searchVariant="csgo" onSelectCsgoItem={onPickItem} />

      <CsgoItemHeader
        marketHashName={item}
        quote={quote}
        quoteLoading={quoteLoading}
        quoteError={quoteError}
        watchlistFavorited={watchlistFavorited}
        onToggleWatchlistFavorite={onToggleWatchlistFavorite}
        onFavoritesUpdated={onCsgoFavoritesUpdated}
      />

      <div className="flex min-h-0 min-w-[1440px] flex-1 overflow-hidden">
        <div
          className="border-border bg-panel flex min-h-0 shrink-0 flex-col overflow-hidden border-r"
          style={{ width: leftColW }}
        >
          <div
            className="border-border flex min-h-0 shrink-0 flex-col overflow-hidden border-b"
            style={{ height: orderbookH }}
          >
            <OrderBook basePrice={livePrice > 0 ? livePrice : 1} asks={[]} bids={[]} />
          </div>

          <RowResizeHandle
            ariaLabel={t("csgo.resizeOrderBookRowAria")}
            onDragDelta={onOrderbookPopularRowDrag}
            onDragComplete={persistLeftRowHeights}
          />

          <div className="bg-panel flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <CsgoPopularPanel onPickItem={onPickItem} activeHash={item} />
          </div>
        </div>

        <ColumnResizeHandle
          ariaLabel={t("csgo.resizeLeftColAria")}
          onDragDelta={onLeftDragDelta}
          onDragComplete={persistColWidths}
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="border-border bg-panel w-full min-w-0 shrink-0 border-b">
            <KLineChart code={item} klt={101} height={380} source="steam" />
          </div>

          <div className="flex min-h-0 flex-1 overflow-hidden">
            <div className="border-border bg-panel flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-r">
              <CsgoWatchlistTable onSelectItem={onPickItem} activeHash={item} />
            </div>
            <div className="bg-panel flex min-h-0 w-[260px] shrink-0 flex-col overflow-hidden">
              <CsgoMarketFeedPanel />
            </div>
          </div>
        </div>

        <ColumnResizeHandle
          ariaLabel={t("csgo.resizeRightColAria")}
          onDragDelta={onRightDragDelta}
          onDragComplete={persistColWidths}
        />

        <div
          className="border-border bg-panel flex h-full min-h-0 shrink-0 flex-col overflow-hidden border-l"
          style={{ width: rightColW }}
        >
          <div
            className="border-border flex min-h-0 shrink-0 flex-col overflow-hidden border-b"
            style={{ height: rightListingH }}
          >
            <CsgoListingStats quote={quote} />
          </div>

          <RowResizeHandle
            ariaLabel={t("csgo.resizeRightListingRowAria")}
            onDragDelta={onRightListingTicksRowDrag}
            onDragComplete={persistRightRowHeights}
          />

          <div className="border-border bg-panel flex min-h-0 flex-1 flex-col overflow-hidden border-b">
            <CsgoTicksStub />
          </div>
        </div>
      </div>

      <div className="border-border bg-panel text-muted-foreground flex shrink-0 items-center gap-6 border-t px-4 py-1 text-xs">
        <span className="text-down flex items-center gap-1 font-medium">
          <span className="bg-down inline-block h-1.5 w-1.5 rounded-full" />
          {t("csgo.footerApi")}
        </span>
        <span>
          {t("csgo.mainItem")}: {item}
        </span>
        <div className="flex-1" />
        <span>{t("stockDashboard.terminalShape")}</span>
        <span>v2.5.0</span>
      </div>
    </div>
  );
}

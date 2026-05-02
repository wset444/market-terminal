"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import PositionTable from "@/components/sections/PositionTable";
import { ROUTES } from "@/constants/routes";
import { useI18n } from "@/contexts/LocaleContext";
import {
  readFavoriteCodes,
  STOCK_WATCHLIST_FAVORITES_KEY,
  toggleFavoriteCode,
} from "@/services/stock/watchlistFavorites";
import { readMarkedCodes, STOCK_MARKED_KEY, toggleMarkedCode } from "@/services/stock/stockMarked";
import { useStockQuote } from "@/hooks/useStockQuote";
import StockHeader from "./StockHeader";
import KLineChart from "./KLineChart";
import OrderBook from "./OrderBook";
import MoneyFlow from "./MoneyFlow";
import TradeList from "./TradeList";
import SentimentPanel from "./SentimentPanel";
import NewsPanel from "./NewsPanel";

/** 演示主图标的（6 位 A 股） */
const DEMO_STOCK_CODE = `300750`;
const FALLBACK_PRICE = 37.48;

/** 右栏「资金流向」固定高度（px），压缩后把纵向空间留给逐笔与涨幅榜 */
const RIGHT_COL_MONEY_FLOW_H = 265;
/** 右栏「逐笔成交」固定高度（px） */
const RIGHT_COL_TRADE_LIST_H = 305;

/**
 * 与 `StockHeader` 周期按钮顺序一致：分时/1分/5分/15分/30分/60分/日K/周K/月K → 东财 klt
 */
const PERIOD_KLT = [1, 1, 5, 15, 30, 60, 101, 102, 103] as const;

export type StockDashboardProps = {
  /** 来自 `/?code=`，URL 带 6 位代码时初始化主图标的 */
  initialStockCode?: string;
};

/**
 * 股票看盘：模块数据均经 `/api/stock/*` 转发东财等接口；布局为 **PC Web**（min-width 1440），非桌面 exe。
 */
export function StockDashboard({ initialStockCode }: StockDashboardProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [activePeriod, setActivePeriod] = useState(6);
  const [stockCode, setStockCode] = useState(() =>
    initialStockCode && /^\d{6}$/.test(initialStockCode) ? initialStockCode : DEMO_STOCK_CODE,
  );
  const [favoriteCodes, setFavoriteCodes] = useState<string[]>([]);
  const [markedCodes, setMarkedCodes] = useState<string[]>([]);

  /** 自选收藏与标记：首屏从 `localStorage` 读取；多标签页通过 `storage` 同步 */
  useEffect(() => {
    setFavoriteCodes(readFavoriteCodes());
    setMarkedCodes(readMarkedCodes());
    const onStorage = (e: StorageEvent) => {
      if (e.key === STOCK_WATCHLIST_FAVORITES_KEY || e.key === null) {
        setFavoriteCodes(readFavoriteCodes());
      }
      if (e.key === STOCK_MARKED_KEY || e.key === null) {
        setMarkedCodes(readMarkedCodes());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /** URL `code` 变化时同步主图（不覆盖用户在当前页已选中的合法修改仅当 URL 带 code） */
  useEffect(() => {
    if (initialStockCode && /^\d{6}$/.test(initialStockCode)) {
      setStockCode(initialStockCode);
    }
  }, [initialStockCode]);

  /**
   * 1. 校验 6 位 A 股代码后更新 `stockCode`。
   * 2. `router.replace` 同步 `?code=`，刷新页与分享链接与主图一致。
   * 3. `scroll: false` 避免切股时页面跳动。
   */
  const selectStockFromWatchlist = (code: string) => {
    if (!/^\d{6}$/.test(code)) return;
    setStockCode(code);
    router.replace(`${ROUTES.home}?code=${encodeURIComponent(code)}`, { scroll: false });
  };

  const toggleWatchlistFavorite = () => {
    if (!/^\d{6}$/.test(stockCode)) return;
    setFavoriteCodes(toggleFavoriteCode(stockCode));
  };

  const toggleMarked = () => {
    if (!/^\d{6}$/.test(stockCode)) return;
    setMarkedCodes(toggleMarkedCode(stockCode));
  };
  const { quote, loading: quoteLoading, error: quoteError } = useStockQuote({ code: stockCode });

  const livePrice = quote?.price ?? FALLBACK_PRICE;
  const klt = useMemo(
    () => PERIOD_KLT[activePeriod] ?? 101,
    [activePeriod],
  );
  const orderBook = quote?.orderBook ?? { asks: [], bids: [] };

  return (
    <div
      data-cmp="StockDashboard"
      className="bg-background flex h-dvh min-h-0 min-w-[1440px] flex-col overflow-hidden"
    >
      <TopBar onSelectStockCode={setStockCode} />

      <StockHeader
        activePeriod={activePeriod}
        onPeriodChange={setActivePeriod}
        quote={quote}
        quoteLoading={quoteLoading}
        quoteError={quoteError}
        activeStockCode={stockCode}
        watchlistFavorited={favoriteCodes.includes(stockCode)}
        onToggleWatchlistFavorite={toggleWatchlistFavorite}
        favoriteCodes={favoriteCodes}
        onFavoritesUpdated={setFavoriteCodes}
        marked={markedCodes.includes(stockCode)}
        onToggleMark={toggleMarked}
      />

      <div className="flex min-h-0 min-w-[1440px] flex-1 overflow-hidden">
        <div
          className="border-border bg-panel flex min-h-0 shrink-0 flex-col border-r"
          style={{ width: 180 }}
        >
          <OrderBook basePrice={livePrice} asks={orderBook.asks} bids={orderBook.bids} />
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="border-border bg-panel w-full min-w-0 shrink-0 border-b">
            <KLineChart code={stockCode} klt={klt} height={380} />
          </div>

          <div className="flex min-h-0 flex-1 overflow-hidden">
            <div className="border-border bg-panel flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-r">
              <PositionTable
                favoriteCodes={favoriteCodes}
                onSelectCode={selectStockFromWatchlist}
                selectedCode={stockCode}
              />
            </div>
            <div
              className="bg-panel flex min-h-0 w-[260px] shrink-0 flex-col overflow-hidden"
            >
              <NewsPanel />
            </div>
          </div>
        </div>

        <div className="border-border flex min-h-0 w-[240px] shrink-0 flex-col border-l">
          <div
            className="border-border bg-panel flex flex-col overflow-hidden border-b"
            style={{ height: RIGHT_COL_MONEY_FLOW_H }}
          >
            <MoneyFlow code={stockCode} />
          </div>
          <div
            className="border-border bg-panel flex flex-col overflow-hidden border-b"
            style={{ height: RIGHT_COL_TRADE_LIST_H }}
          >
            <TradeList code={stockCode} />
          </div>
          <div className="bg-panel flex min-h-0 flex-1 flex-col overflow-hidden">
            <SentimentPanel />
          </div>
        </div>
      </div>

      <div className="border-border bg-panel text-muted-foreground flex shrink-0 items-center gap-6 border-t px-4 py-1 text-xs">
        <span className="text-down flex items-center gap-1 font-medium">
          <span className="bg-down inline-block h-1.5 w-1.5 rounded-full" />
          {t("stockDashboard.quoteApi")}
        </span>
        <span>
          {t("stockDashboard.mainSymbol")}: {stockCode}
        </span>
        <span>
          {t("stockDashboard.periodKlt")}: {klt}
        </span>
        <div className="flex-1" />
        <span>{t("stockDashboard.terminalShape")}</span>
        <span>v2.5.0</span>
      </div>
    </div>
  );
}

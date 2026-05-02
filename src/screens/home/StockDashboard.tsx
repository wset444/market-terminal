"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnResizeHandle } from "@/components/layout/ColumnResizeHandle";
import { RowResizeHandle } from "@/components/layout/RowResizeHandle";
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
import {
  readStockLeftColWidth,
  readStockOrderbookHeight,
  readStockRightColWidth,
  readStockRightMoneyFlowHeight,
  STOCK_LEFT_COL_DEFAULT,
  STOCK_LEFT_COL_MAX,
  STOCK_LEFT_COL_MIN,
  STOCK_ORDERBOOK_H_DEFAULT,
  STOCK_ORDERBOOK_H_MAX,
  STOCK_ORDERBOOK_H_MIN,
  STOCK_RIGHT_COL_DEFAULT,
  STOCK_RIGHT_COL_MAX,
  STOCK_RIGHT_COL_MIN,
  STOCK_RIGHT_MONEY_FLOW_H_DEFAULT,
  STOCK_RIGHT_MONEY_FLOW_H_MAX,
  STOCK_RIGHT_MONEY_FLOW_H_MIN,
  writeStockLeftColWidth,
  writeStockOrderbookHeight,
  writeStockRightColWidth,
  writeStockRightMoneyFlowHeight,
} from "@/utils/layoutPrefs";

/** 演示主图标的（6 位 A 股） */
const DEMO_STOCK_CODE = `300750`;
const FALLBACK_PRICE = 37.48;

/**
 * 与 `StockHeader` 周期按钮顺序一致：分时/1分/5分/15分/30分/60分/日K/周K/月K → 东财 klt
 */
const PERIOD_KLT = [1, 1, 5, 15, 30, 60, 101, 102, 103] as const;

export type StockDashboardProps = {
  /** 来自 `/?code=`，URL 带 6 位代码时初始化主图标的 */
  initialStockCode?: string;
};

function clampLeftCol(w: number): number {
  return Math.min(STOCK_LEFT_COL_MAX, Math.max(STOCK_LEFT_COL_MIN, w));
}

function clampRightCol(w: number): number {
  return Math.min(STOCK_RIGHT_COL_MAX, Math.max(STOCK_RIGHT_COL_MIN, w));
}

function clampStockOrderbookH(h: number): number {
  return Math.min(STOCK_ORDERBOOK_H_MAX, Math.max(STOCK_ORDERBOOK_H_MIN, h));
}

function clampRightMoneyFlowH(h: number): number {
  return Math.min(STOCK_RIGHT_MONEY_FLOW_H_MAX, Math.max(STOCK_RIGHT_MONEY_FLOW_H_MIN, h));
}

/**
 * 股票看盘：模块数据均经 `/api/stock/*` 转发东财等接口；布局为 **PC Web**（min-width 1440），非桌面 exe。
 *
 * 左栏五档 + 涨幅榜（中间可拖高度）；右栏资金流向 + 逐笔（中间可拖高度）；左/右栏宽度竖条拖拽；`layoutPrefs` 持久化。
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
  const [leftColW, setLeftColW] = useState(STOCK_LEFT_COL_DEFAULT);
  const [rightColW, setRightColW] = useState(STOCK_RIGHT_COL_DEFAULT);
  const leftColRef = useRef(STOCK_LEFT_COL_DEFAULT);
  const rightColRef = useRef(STOCK_RIGHT_COL_DEFAULT);

  const [orderbookH, setOrderbookH] = useState(STOCK_ORDERBOOK_H_DEFAULT);
  const orderbookHRef = useRef(STOCK_ORDERBOOK_H_DEFAULT);

  const [rightMoneyFlowH, setRightMoneyFlowH] = useState(STOCK_RIGHT_MONEY_FLOW_H_DEFAULT);
  const rightMoneyFlowHRef = useRef(STOCK_RIGHT_MONEY_FLOW_H_DEFAULT);

  /**
   * 步骤：
   * 1. 首帧后从 `localStorage` 恢复列宽，避免 SSR 与客户端不一致。
   * 2. 使用 `setTimeout(0)` 满足 `react-hooks/set-state-in-effect`。
   */
  useEffect(() => {
    const id = window.setTimeout(() => {
      const L = readStockLeftColWidth();
      const R = readStockRightColWidth();
      setLeftColW((x) => {
        const n = clampLeftCol(L ?? x);
        leftColRef.current = n;
        return n;
      });
      setRightColW((x) => {
        const n = clampRightCol(R ?? x);
        rightColRef.current = n;
        return n;
      });
      const oh = readStockOrderbookHeight();
      if (oh != null) {
        const n = clampStockOrderbookH(oh);
        orderbookHRef.current = n;
        setOrderbookH(n);
      }
      const rm = readStockRightMoneyFlowHeight();
      if (rm != null) {
        const n = clampRightMoneyFlowH(rm);
        rightMoneyFlowHRef.current = n;
        setRightMoneyFlowH(n);
      }
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const persistColWidths = useCallback(() => {
    writeStockLeftColWidth(leftColRef.current);
    writeStockRightColWidth(rightColRef.current);
  }, []);

  const persistLeftRowHeights = useCallback(() => {
    writeStockOrderbookHeight(orderbookHRef.current);
  }, []);

  const persistRightRowHeights = useCallback(() => {
    writeStockRightMoneyFlowHeight(rightMoneyFlowHRef.current);
  }, []);

  const onLeftDragDelta = useCallback((dx: number) => {
    setLeftColW((w) => {
      const n = clampLeftCol(w + dx);
      leftColRef.current = n;
      return n;
    });
  }, []);

  const onRightDragDelta = useCallback((dx: number) => {
    setRightColW((w) => {
      const n = clampRightCol(w - dx);
      rightColRef.current = n;
      return n;
    });
  }, []);

  /** 左栏五档与涨幅榜之间：拖动调整五档区高度 */
  const onOrderbookMoversRowDrag = useCallback((dy: number) => {
    setOrderbookH((h) => {
      const n = clampStockOrderbookH(h + dy);
      orderbookHRef.current = n;
      return n;
    });
  }, []);

  /** 右栏资金流向与逐笔之间：拖动调整资金流向区高度 */
  const onMoneyFlowTicksRowDrag = useCallback((dy: number) => {
    setRightMoneyFlowH((h) => {
      const n = clampRightMoneyFlowH(h + dy);
      rightMoneyFlowHRef.current = n;
      return n;
    });
  }, []);

  /** 自选收藏与标记：首屏从 `localStorage` 读取；多标签页通过 `storage` 同步 */
  useEffect(() => {
    const boot = window.setTimeout(() => {
      setFavoriteCodes(readFavoriteCodes());
      setMarkedCodes(readMarkedCodes());
    }, 0);
    const onStorage = (e: StorageEvent) => {
      if (e.key === STOCK_WATCHLIST_FAVORITES_KEY || e.key === null) {
        setFavoriteCodes(readFavoriteCodes());
      }
      if (e.key === STOCK_MARKED_KEY || e.key === null) {
        setMarkedCodes(readMarkedCodes());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      clearTimeout(boot);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  /** URL `code` 变化时同步主图（不覆盖用户在当前页已选中的合法修改仅当 URL 带 code） */
  useEffect(() => {
    if (!initialStockCode || !/^\d{6}$/.test(initialStockCode)) return;
    const id = window.setTimeout(() => {
      setStockCode(initialStockCode);
    }, 0);
    return () => clearTimeout(id);
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
          className="border-border bg-panel flex min-h-0 shrink-0 flex-col overflow-hidden border-r"
          style={{ width: leftColW }}
        >
          <div
            className="border-border flex min-h-0 shrink-0 flex-col overflow-hidden border-b"
            style={{ height: orderbookH }}
          >
            <OrderBook basePrice={livePrice} asks={orderBook.asks} bids={orderBook.bids} />
          </div>

          <RowResizeHandle
            ariaLabel={t("stockDashboard.resizeOrderBookRowAria")}
            onDragDelta={onOrderbookMoversRowDrag}
            onDragComplete={persistLeftRowHeights}
          />

          <div className="bg-panel flex min-h-0 flex-1 flex-col overflow-hidden">
            <SentimentPanel />
          </div>
        </div>

        <ColumnResizeHandle
          ariaLabel={t("stockDashboard.resizeOrderBookAria")}
          onDragDelta={onLeftDragDelta}
          onDragComplete={persistColWidths}
        />

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
                onFavoritesReorder={setFavoriteCodes}
              />
            </div>
            <div
              className="bg-panel flex min-h-0 w-[260px] shrink-0 flex-col overflow-hidden"
            >
              <NewsPanel />
            </div>
          </div>
        </div>

        <ColumnResizeHandle
          ariaLabel={t("stockDashboard.resizeRightPanelAria")}
          onDragDelta={onRightDragDelta}
          onDragComplete={persistColWidths}
        />

        <div
          className="border-border bg-panel flex h-full min-h-0 shrink-0 flex-col overflow-hidden border-l"
          style={{ width: rightColW }}
        >
          <div
            className="border-border flex min-h-0 shrink-0 flex-col overflow-hidden border-b"
            style={{ height: rightMoneyFlowH }}
          >
            <MoneyFlow code={stockCode} />
          </div>

          <RowResizeHandle
            ariaLabel={t("stockDashboard.resizeRightMoneyFlowRowAria")}
            onDragDelta={onMoneyFlowTicksRowDrag}
            onDragComplete={persistRightRowHeights}
          />

          <div className="border-border flex min-h-0 flex-1 flex-col overflow-hidden border-b">
            <TradeList code={stockCode} />
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

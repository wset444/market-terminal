"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import { useI18n } from "@/contexts/LocaleContext";
import { useCsgoQuote } from "@/hooks/useCsgoQuote";
import OrderBook from "@/screens/home/OrderBook";
import KLineChart from "@/screens/home/KLineChart";
import CsgoItemHeader from "./CsgoItemHeader";
import CsgoListingStats from "./CsgoListingStats";
import CsgoMarketFeedPanel from "./CsgoMarketFeedPanel";
import CsgoPopularPanel from "./CsgoPopularPanel";
import CsgoTicksStub from "./CsgoTicksStub";
import CsgoWatchlistTable from "./CsgoWatchlistTable";

/** 演示默认饰品（Steam `market_hash_name`） */
export const DEFAULT_CSGO_ITEM = `AK-47 | Redline (Field-Tested)`;

const RIGHT_COL_LISTINGS_H = 265;
const RIGHT_COL_TICKS_H = 305;

export type CsgoDashboardProps = {
  initialMarketHashName?: string;
};

/**
 * CS2 饰品看板：布局对齐 `StockDashboard`，数据经 `/api/csgo/*` 代理 Steam 公开接口。
 */
export function CsgoDashboard({ initialMarketHashName }: CsgoDashboardProps) {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [item, setItem] = useState(
    () => initialMarketHashName?.trim() || DEFAULT_CSGO_ITEM,
  );

  const urlItem = searchParams.get("item")?.trim() ?? "";
  useEffect(() => {
    if (urlItem) setItem(urlItem);
  }, [urlItem]);

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
      />

      <div className="flex min-h-0 min-w-[1440px] flex-1 overflow-hidden">
        <div
          className="border-border bg-panel flex min-h-0 shrink-0 flex-col border-r"
          style={{ width: 180 }}
        >
          <OrderBook basePrice={livePrice > 0 ? livePrice : 1} asks={[]} bids={[]} />
        </div>

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

        <div className="border-border flex min-h-0 w-[240px] shrink-0 flex-col border-l">
          <div
            className="border-border bg-panel flex flex-col overflow-hidden border-b"
            style={{ height: RIGHT_COL_LISTINGS_H }}
          >
            <CsgoListingStats quote={quote} />
          </div>
          <div
            className="border-border bg-panel flex flex-col overflow-hidden border-b"
            style={{ height: RIGHT_COL_TICKS_H }}
          >
            <CsgoTicksStub />
          </div>
          <div className="bg-panel flex min-h-0 flex-1 flex-col overflow-hidden">
            <CsgoPopularPanel onPickItem={onPickItem} activeHash={item} />
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

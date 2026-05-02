"use client";

import { useI18n } from "@/contexts/LocaleContext";
import type { CsgoQuote } from "@/types/csgo";

type CsgoListingStatsProps = {
  quote: CsgoQuote | null;
};

/**
 * 右栏上格：复用「资金流向」槽位，展示 Steam 挂牌价量摘要。
 */
export default function CsgoListingStats({ quote }: CsgoListingStatsProps) {
  const { t } = useI18n();
  const dash = "—";

  return (
    <div data-cmp="CsgoListingStats" className="flex h-full flex-col">
      <div className="border-border bg-panel-header flex items-center justify-between border-b px-3 py-2">
        <span className="text-xs font-medium text-foreground">{t("csgo.listingsTitle")}</span>
        <span className="text-xs text-muted-foreground">{t("csgo.listingsSub")}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2 px-3 py-2 text-xs">
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">{t("csgo.lowest")}</span>
          <span className="font-mono text-foreground">{quote?.lowestRaw ?? dash}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">{t("csgo.median")}</span>
          <span className="font-mono text-foreground">{quote?.medianRaw ?? dash}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">{t("csgo.volume24h")}</span>
          <span className="font-mono text-foreground">{quote?.volumeRaw ?? dash}</span>
        </div>
        <p className="text-muted-foreground mt-1 leading-relaxed">{t("csgo.dataSource")}</p>
      </div>
    </div>
  );
}

import { demoQuote, isDemoFallbackDisabled } from "@/services/csgo/demoFallback";
import { csgoPicsumIconUrl } from "@/services/csgo/fallbackIconUrl";
import {
  lookupEconomyIconPath,
  mapPriceOverview,
  priceOverviewUrl,
  steamEconomyImageUrl,
  steamGetJson,
} from "@/services/csgo/steamMarket";
import type { CsgoQuote } from "@/types/csgo";

/**
 * 解析单件饰品 Steam `priceoverview`；并行拉 `search/render` 取 **`icon_url`**（公开接口字段）。
 *
 * @param marketHashName - `market_hash_name`
 * @returns 可展示的报价；`success: false` 表示 Steam 不可用/无数据且已设 `CSGO_DISABLE_DEMO=1` 关闭演示回退。
 */
export async function fetchCsgoQuoteForApi(marketHashName: string): Promise<CsgoQuote> {
  const name = marketHashName.trim();
  const [got, iconRaw] = await Promise.all([
    steamGetJson(priceOverviewUrl(name)),
    lookupEconomyIconPath(name),
  ]);
  const fromSteam = iconRaw ? steamEconomyImageUrl(iconRaw).trim() : "";
  const iconUrl = fromSteam || csgoPicsumIconUrl(name);

  if (got.ok) {
    const m = mapPriceOverview(got.json, name);
    const body: CsgoQuote = {
      market_hash_name: name,
      ...m,
      fetchedAt: new Date().toISOString(),
      orderBook: { asks: [], bids: [] },
      dataSource: "steam",
      iconUrl,
    };
    if (m.success) return body;
    if (!isDemoFallbackDisabled()) return { ...demoQuote(name), iconUrl };
    return body;
  }
  if (!isDemoFallbackDisabled()) return { ...demoQuote(name), iconUrl };
  return {
    market_hash_name: name,
    lowest: null,
    median: null,
    volume: null,
    lowestRaw: null,
    medianRaw: null,
    volumeRaw: null,
    success: false,
    fetchedAt: new Date().toISOString(),
    orderBook: { asks: [], bids: [] },
    dataSource: "steam",
    iconUrl,
  };
}

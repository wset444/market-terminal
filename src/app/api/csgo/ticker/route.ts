import { NextResponse } from "next/server";
import { demoPopular, isDemoFallbackDisabled } from "@/services/csgo/demoFallback";
import { fetchCsgoQuoteForApi } from "@/services/csgo/resolveQuote";
import { extractSuggestFromRender, popularRenderUrl, steamGetJson } from "@/services/csgo/steamMarket";
import type { CsgoPopularRow, CsgoTickerRow } from "@/types/csgo";

const TICKER_QUOTE_COUNT = 8;

/**
 * 1. 拉 Steam 热门 `search/render`，失败且允许演示时用 `demoPopular`。
 * 2. 对前若干件并行 `fetchCsgoQuoteForApi`（内含 Steam / 演示价兜底）。
 * 3. 汇总为 `priceUsd` + `changePct`，供顶栏 `/csgo` 跑马灯消费。
 */
async function resolvePopularRows(count: number): Promise<CsgoPopularRow[]> {
  const got = await steamGetJson(popularRenderUrl(0, count));
  if (got.ok) {
    const raw = extractSuggestFromRender(got.json, count);
    if (raw.length > 0) {
      return raw.map((r) => ({
        market_hash_name: r.market_hash_name,
        name: r.market_hash_name,
      }));
    }
  }
  if (!isDemoFallbackDisabled()) {
    return demoPopular().slice(0, count);
  }
  return [];
}

/**
 * GET /api/csgo/ticker — 顶栏 CS2 跑马灯：热门饰品 + 美元价 + 涨跌幅。
 */
export async function GET() {
  let rows = await resolvePopularRows(TICKER_QUOTE_COUNT);
  if (rows.length === 0 && !isDemoFallbackDisabled()) {
    rows = demoPopular().slice(0, TICKER_QUOTE_COUNT);
  }
  if (rows.length === 0) {
    return NextResponse.json({ data: [] as CsgoTickerRow[], dataSource: "none" as const });
  }

  const quotes = await Promise.all(rows.map((r) => fetchCsgoQuoteForApi(r.market_hash_name)));
  const data: CsgoTickerRow[] = rows.map((r, i) => {
    const q = quotes[i]!;
    const price = q.lowest ?? q.median ?? 0;
    const prevRef = q.median ?? q.lowest ?? price;
    const changePct =
      prevRef > 0 && price > 0 ? +(((price - prevRef) / prevRef) * 100).toFixed(2) : 0;
    return {
      market_hash_name: r.market_hash_name,
      name: r.name || r.market_hash_name,
      priceUsd: price,
      changePct,
      dataSource: q.dataSource,
    };
  });

  const dataSource = quotes.some((q) => q.dataSource === "steam" && q.success)
    ? ("steam" as const)
    : quotes.some((q) => q.dataSource === "demo")
      ? ("demo" as const)
      : ("none" as const);

  return NextResponse.json(
    { data, dataSource },
    { headers: { "Cache-Control": "public, s-maxage=20, stale-while-revalidate=40" } },
  );
}

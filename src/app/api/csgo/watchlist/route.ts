import { NextResponse } from "next/server";
import { fetchCsgoQuoteForApi } from "@/services/csgo/resolveQuote";
import { CSGO_WATCHLIST } from "@/services/csgo/watchlist-config";
import type { CsgoWatchlistApiRow } from "@/types/csgo";

/**
 * CS2 关注列表：合并本地配置与实时挂牌价（`fetchCsgoQuoteForApi`）。
 */
export async function GET() {
  try {
    const quotes = await Promise.all(
      CSGO_WATCHLIST.map((w) => fetchCsgoQuoteForApi(w.market_hash_name)),
    );
    const data: CsgoWatchlistApiRow[] = CSGO_WATCHLIST.map((w, i) => {
      const q = quotes[i]!;
      const price = q.lowest ?? q.median ?? 0;
      const prevRef = q.median ?? q.lowest ?? price;
      const changePct =
        prevRef > 0 && price > 0 ? +(((price - prevRef) / prevRef) * 100).toFixed(2) : 0;
      return {
        market_hash_name: w.market_hash_name,
        name: w.market_hash_name,
        qty: w.qty,
        avgCost: w.avgCostUsd,
        price: price || 0,
        prevRef,
        changePct,
        dataSource: q.dataSource,
        iconUrl: q.iconUrl,
      };
    });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "watchlist failed" }, { status: 502 });
  }
}

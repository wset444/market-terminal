import { NextResponse } from "next/server";
import { fetchWatchlistQuotes } from "@/services/stock/services";
import { STOCK_WATCHLIST } from "@/services/stock/watchlist-config";

export async function GET() {
  try {
    const codes = STOCK_WATCHLIST.map((x) => x.code);
    const rows = await fetchWatchlistQuotes(codes);
    const data = STOCK_WATCHLIST.map((w) => {
      const r = rows.find((x) => x.code === w.code);
      return {
        code: w.code,
        name: r?.name || w.name || w.code,
        shares: w.shares,
        avgCost: w.avgCost,
        price: r?.price ?? 0,
        prevClose: r?.prevClose ?? r?.price ?? 0,
        changePct: r?.changePct ?? 0,
      };
    });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "自选批价失败" }, { status: 502 });
  }
}

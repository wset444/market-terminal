import { NextRequest, NextResponse } from "next/server";
import { fetchWatchlistQuotes } from "@/services/stock/services";
import { STOCK_WATCHLIST } from "@/services/stock/watchlist-config";

const DEFAULT_SHARES = 100;
const DEFAULT_AVG = 0;

function parseCodesParam(req: NextRequest): string[] {
  const raw = req.nextUrl.searchParams.get("codes")?.trim();
  if (!raw) return [];
  const parts = raw.split(/[,，\s]+/).map((s) => s.trim());
  const out: string[] = [];
  const seen = new Set<string>();
  for (const p of parts) {
    if (!/^\d{6}$/.test(p) || seen.has(p)) continue;
    seen.add(p);
    out.push(p);
    if (out.length >= 30) break;
  }
  return out;
}

/**
 * GET `/api/stock/watchlist?codes=300750,002594`：仅对传入代码批价并与本地演示持仓表合并股数/成本。
 * 无 `codes` 或为空时返回 `{ data: [] }`（收藏在浏览器，由前端传代码）。
 */
export async function GET(req: NextRequest) {
  try {
    const codes = parseCodesParam(req);
    if (codes.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const rows = await fetchWatchlistQuotes(codes);
    const data = codes.map((code) => {
      const w = STOCK_WATCHLIST.find((x) => x.code === code);
      const r = rows.find((x) => x.code === code);
      return {
        code,
        name: r?.name || w?.name || code,
        shares: w?.shares ?? DEFAULT_SHARES,
        avgCost: w?.avgCost ?? DEFAULT_AVG,
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

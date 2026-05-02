import { NextResponse } from "next/server";
import { demoPopular, isDemoFallbackDisabled } from "@/services/csgo/demoFallback";
import { extractSuggestFromRender, popularRenderUrl, steamGetJson } from "@/services/csgo/steamMarket";
import type { CsgoPopularRow } from "@/types/csgo";

/**
 * Steam 热门饰品；失败时回退演示列表（可用 `CSGO_DISABLE_DEMO=1` 关闭）。
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const count = Math.min(30, Math.max(5, Number(searchParams.get("count")) || 15));

  const got = await steamGetJson(popularRenderUrl(0, count));
  if (got.ok) {
    const raw = extractSuggestFromRender(got.json, count);
    const data: CsgoPopularRow[] = raw.map((r) => ({
      market_hash_name: r.market_hash_name,
      name: r.market_hash_name,
    }));
    if (data.length > 0) {
      return NextResponse.json({ data, dataSource: "steam" as const });
    }
  }

  if (!isDemoFallbackDisabled()) {
    return NextResponse.json({ data: demoPopular().slice(0, count), dataSource: "demo" as const });
  }

  return NextResponse.json({ error: "Steam unreachable", data: [] as CsgoPopularRow[] }, { status: 503 });
}

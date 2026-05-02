import { NextResponse } from "next/server";
import { demoSuggest, isDemoFallbackDisabled } from "@/services/csgo/demoFallback";
import { extractSuggestFromRender, searchRenderUrl, steamGetJson } from "@/services/csgo/steamMarket";
import type { CsgoSuggestItem } from "@/types/csgo";

/**
 * Steam `search/render` 代理；失败时回退本地演示联想（可用 `CSGO_DISABLE_DEMO=1` 关闭）。
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const count = Math.min(20, Math.max(1, Number(searchParams.get("count")) || 12));
  if (q.length < 1) {
    return NextResponse.json({ data: [] as CsgoSuggestItem[], dataSource: "none" as const });
  }

  const got = await steamGetJson(searchRenderUrl(q, 0, count));
  if (got.ok) {
    const raw = extractSuggestFromRender(got.json, count);
    const data: CsgoSuggestItem[] = raw.map((r) => ({
      market_hash_name: r.market_hash_name,
      name: r.market_hash_name,
    }));
    if (data.length > 0) {
      return NextResponse.json({ data, dataSource: "steam" as const });
    }
  }

  if (!isDemoFallbackDisabled()) {
    const data = demoSuggest(q, count);
    return NextResponse.json({ data, dataSource: "demo" as const });
  }

  return NextResponse.json(
    { error: "Steam unreachable", data: [] as CsgoSuggestItem[] },
    { status: 503 },
  );
}

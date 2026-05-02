import { NextResponse } from "next/server";
import { fetchCsgoQuoteForApi } from "@/services/csgo/resolveQuote";

/**
 * Steam `priceoverview` 代理；**网络不可达时**默认演示数据 `dataSource: "demo"`（可用 `CSGO_DISABLE_DEMO=1` 关闭）。
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = (searchParams.get("market_hash_name") ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "market_hash_name required" }, { status: 400 });
  }

  const body = await fetchCsgoQuoteForApi(name);
  if (body.success) {
    return NextResponse.json(body);
  }

  return NextResponse.json(
    { error: "Steam returned no price data or unreachable", ...body },
    { status: 503 },
  );
}

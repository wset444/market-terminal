import { NextRequest, NextResponse } from "next/server";
import { fetchStockQuoteFull } from "@/services/stock/services";

/**
 * GET /api/stock/quote?code=300750
 * 服务端代理东方财富行情（演示用，请勿高频压测）。
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.trim();
  if (!code) {
    return NextResponse.json({ error: "缺少参数 code（6 位 A 股代码）" }, { status: 400 });
  }

  try {
    const quote = await fetchStockQuoteFull(code);
    if (!quote) {
      return NextResponse.json({ error: "未取到行情或代码无效" }, { status: 404 });
    }
    return NextResponse.json(quote, {
      headers: {
        "Cache-Control": "public, s-maxage=2, stale-while-revalidate=5",
      },
    });
  } catch {
    return NextResponse.json({ error: "上游行情接口不可用" }, { status: 502 });
  }
}

import { NextResponse } from "next/server";
import { demoKline, isDemoFallbackDisabled } from "@/services/csgo/demoFallback";
import { mapPriceHistoryToBars, priceHistoryUrl, steamGetJson } from "@/services/csgo/steamMarket";

/**
 * Steam `pricehistory` 代理；无数据或网络失败时用演示 K 线（可用 `CSGO_DISABLE_DEMO=1` 关闭）。
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = (searchParams.get("market_hash_name") ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "market_hash_name required" }, { status: 400 });
  }

  const got = await steamGetJson(priceHistoryUrl(name));
  if (got.ok) {
    const data = mapPriceHistoryToBars(got.json);
    const success = Boolean((got.json as { success?: boolean }).success);
    if (data.length > 0) {
      return NextResponse.json({
        data,
        dataSource: "steam" as const,
        historyAvailable: success,
      });
    }
  }

  if (!isDemoFallbackDisabled()) {
    return NextResponse.json({
      data: demoKline(name, 90),
      dataSource: "demo" as const,
      historyAvailable: true,
    });
  }

  return NextResponse.json(
    { data: [], historyAvailable: false, error: "Steam unreachable or no history" },
    { status: 503 },
  );
}

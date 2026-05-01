import { NextRequest, NextResponse } from "next/server";
import { fetchStockSuggest } from "@/services/stock/services";

/**
 * 股票联想：转发东财 `suggest/get`（`type=14` A 股）。
 *
 * 步骤：
 * 1. 读取 `q`、`count` 查询参数并裁剪范围。
 * 2. 空查询直接返回 `[]`。
 * 3. 调用 `fetchStockSuggest` 并 JSON 输出。
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const count = Math.min(20, Math.max(1, Number(req.nextUrl.searchParams.get("count") ?? "8")));
  if (!q) return NextResponse.json({ data: [] as const });
  try {
    const data = await fetchStockSuggest(q, count);
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "联想失败" }, { status: 502 });
  }
}

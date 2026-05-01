import { NextRequest, NextResponse } from "next/server";
import {
  fetchFflowDaySummary,
  fetchFflowIntraday,
} from "@/services/stock/services";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.trim();
  const lmt = Math.min(200, Math.max(10, Number(req.nextUrl.searchParams.get("lmt") ?? "40")));
  if (!code) {
    return NextResponse.json({ error: "缺少 code" }, { status: 400 });
  }
  try {
    const [intraday, day] = await Promise.all([
      fetchFflowIntraday(code, lmt),
      fetchFflowDaySummary(code),
    ]);
    return NextResponse.json({ intraday, day });
  } catch {
    return NextResponse.json({ error: "资金流向失败" }, { status: 502 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { fetchStockKline } from "@/services/stock/services";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.trim();
  const klt = Number(req.nextUrl.searchParams.get("klt") ?? "101");
  const limit = Math.min(500, Math.max(30, Number(req.nextUrl.searchParams.get("limit") ?? "120")));
  if (!code) {
    return NextResponse.json({ error: "缺少 code" }, { status: 400 });
  }
  try {
    const data = await fetchStockKline(code, Number.isFinite(klt) ? klt : 101, limit);
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "K 线拉取失败" }, { status: 502 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { fetchStockTicks } from "@/services/stock/services";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.trim();
  const pos = Number(req.nextUrl.searchParams.get("pos") ?? "-30");
  if (!code) {
    return NextResponse.json({ error: "缺少 code" }, { status: 400 });
  }
  try {
    const data = await fetchStockTicks(code, pos);
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "分笔失败" }, { status: 502 });
  }
}

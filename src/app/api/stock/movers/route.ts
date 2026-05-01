import { NextRequest, NextResponse } from "next/server";
import { fetchMovers } from "@/services/stock/services";

export async function GET(req: NextRequest) {
  const pz = Math.min(50, Math.max(5, Number(req.nextUrl.searchParams.get("pz") ?? "20")));
  try {
    const data = await fetchMovers(pz);
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "涨幅榜失败" }, { status: 502 });
  }
}

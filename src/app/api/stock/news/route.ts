import { NextRequest, NextResponse } from "next/server";
import { fetchNewsList } from "@/services/stock/services";

export async function GET(req: NextRequest) {
  const pageSize = Math.min(50, Math.max(5, Number(req.nextUrl.searchParams.get("pageSize") ?? "15")));
  const lastId = req.nextUrl.searchParams.get("lastId") ?? "0";
  try {
    const data = await fetchNewsList(pageSize, lastId);
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "快讯失败" }, { status: 502 });
  }
}

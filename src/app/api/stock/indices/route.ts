import { NextResponse } from "next/server";
import { DEFAULT_INDEX_SECIDS, fetchIndexTickers } from "@/services/stock/services";

export async function GET() {
  try {
    const data = await fetchIndexTickers(DEFAULT_INDEX_SECIDS);
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "指数行情失败" }, { status: 502 });
  }
}

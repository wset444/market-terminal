import { Suspense } from "react";
import { CsgoDashboard, DEFAULT_CSGO_ITEM } from "@/screens/csgo/CsgoDashboard";

type CsgoPageProps = {
  searchParams?: Promise<{ item?: string | string[] }>;
};

/**
 * CS2 饰品看板；`?item=` 为 URL 编码的 Steam `market_hash_name`。
 */
export default async function CsgoPage({ searchParams }: CsgoPageProps) {
  const sp = (await searchParams) ?? {};
  const raw = sp.item;
  const itemStr = Array.isArray(raw) ? raw[0] : raw;
  let initialMarketHashName = DEFAULT_CSGO_ITEM;
  if (typeof itemStr === "string" && itemStr.trim()) {
    try {
      initialMarketHashName = decodeURIComponent(itemStr.trim());
    } catch {
      initialMarketHashName = itemStr.trim();
    }
  }

  return (
    <Suspense
      fallback={<div className="bg-background h-dvh min-w-[1440px] animate-pulse" aria-hidden />}
    >
      <CsgoDashboard initialMarketHashName={initialMarketHashName} />
    </Suspense>
  );
}

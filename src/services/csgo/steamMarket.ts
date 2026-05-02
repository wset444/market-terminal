import type { KlineBar } from "@/types/stock";

/**
 * Steam 社区市场（CS2 appid=730）公开接口拼装与轻量解析。
 * 说明：由服务端 `fetch` 代理，避免浏览器 CORS；不保证 `pricehistory` 在无 Cookie 时始终可用。
 */

export const STEAM_MARKET_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export const CS2_APP_ID = 730;

type SteamFetchInit = RequestInit & { next?: { revalidate?: number } };

/**
 * 带统一 UA 的 Steam 请求（仅服务端使用）。
 *
 * @param url - 完整 URL
 * @param init - 可选 fetch 配置
 */
export async function steamFetch(url: string, init?: SteamFetchInit): Promise<Response> {
  return fetch(url, {
    ...init,
    headers: {
      "User-Agent": STEAM_MARKET_UA,
      Accept: "application/json, text/javascript, */*;q=0.1",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: "https://steamcommunity.com/market/",
      ...init?.headers,
    },
  });
}

const STEAM_FETCH_MS = 12_000;

export type SteamJsonResult =
  | { ok: true; json: unknown }
  | { ok: false; reason: "network" | "bad_json" };

/**
 * Steam GET + 超时 + 安全 JSON 解析（避免 HTML/断连导致 `res.json()` 抛错）。
 *
 * @param url - 完整 URL
 */
export async function steamGetJson(url: string): Promise<SteamJsonResult> {
  try {
    const res = await steamFetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(STEAM_FETCH_MS),
    });
    const text = await res.text();
    try {
      return { ok: true, json: JSON.parse(text) as unknown };
    } catch {
      return { ok: false, reason: "bad_json" };
    }
  } catch {
    return { ok: false, reason: "network" };
  }
}

/**
 * 解析 Steam `priceoverview` 中的价量字符串（美元等）。
 *
 * @param priceStr - 如 `"$12.34"`、`"¥ 123.45"`
 * @returns 数值或 null
 */
export function parseSteamMoney(priceStr: string | undefined): number | null {
  if (!priceStr || typeof priceStr !== "string") return null;
  const n = parseFloat(priceStr.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

/**
 * 解析成交量文案（去除千分位）。
 *
 * @param volStr - 如 `"1,234"`
 */
export function parseSteamVolume(volStr: string | undefined): number | null {
  if (!volStr || typeof volStr !== "string") return null;
  const n = parseInt(volStr.replace(/,/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

type PriceOverviewJson = {
  success?: boolean;
  lowest_price?: string;
  median_price?: string;
  volume?: string;
};

/**
 * 拼装 `priceoverview` URL（美元 + US，便于数值稳定）。
 *
 * @param marketHashName - `market_hash_name`
 */
export function priceOverviewUrl(marketHashName: string): string {
  const q = new URLSearchParams({
    country: "US",
    currency: "1",
    appid: String(CS2_APP_ID),
    market_hash_name: marketHashName,
  });
  return `https://steamcommunity.com/market/priceoverview/?${q.toString()}`;
}

/**
 * 解析 `priceoverview` JSON。
 *
 * @param j - 响应 JSON
 * @param marketHashName - 当前饰品 id
 */
export function mapPriceOverview(
  j: unknown,
  marketHashName: string,
): {
  lowest: number | null;
  median: number | null;
  volume: number | null;
  lowestRaw: string | null;
  medianRaw: string | null;
  volumeRaw: string | null;
  success: boolean;
} {
  const o = j as PriceOverviewJson;
  const ok = o.success === true;
  const lowestRaw = o.lowest_price ?? null;
  const medianRaw = o.median_price ?? null;
  const volumeRaw = o.volume ?? null;
  return {
    success: ok,
    lowest: parseSteamMoney(lowestRaw ?? undefined),
    median: parseSteamMoney(medianRaw ?? undefined),
    volume: parseSteamVolume(volumeRaw ?? undefined),
    lowestRaw,
    medianRaw,
    volumeRaw,
  };
}

/**
 * 拼装 `search/render` URL。
 */
export function searchRenderUrl(query: string, start: number, count: number): string {
  const q = new URLSearchParams({
    query: query.trim(),
    start: String(start),
    count: String(Math.min(50, Math.max(1, count))),
    search_descriptions: "1",
    sort_column: "default",
    sort_dir: "desc",
    appid: String(CS2_APP_ID),
    norender: "1",
  });
  return `https://steamcommunity.com/market/search/render/?${q.toString()}`;
}

/**
 * 从 `search/render` 的 `assets` 中提取饰品 `market_hash_name` 列表。
 *
 * @param j - 响应 JSON
 * @param limit - 最多条数
 */
type SteamAssetRow = {
  market_hash_name?: string;
  /** Steam `economy/image` 路径片段，需拼 CDN */
  icon_url?: string;
};

/**
 * 从 `search/render` 的 `assets` 中取与 `market_hash_name` 匹配的 `icon_url`（无则 null）。
 */
export function extractIconUrlForHash(j: unknown, marketHashName: string): string | null {
  const assets = (j as { assets?: Record<string, Record<string, Record<string, SteamAssetRow>>> })
    .assets;
  const bucket = assets?.[String(CS2_APP_ID)]?.["2"];
  if (!bucket) return null;
  const want = marketHashName.trim();
  const wlow = want.toLowerCase();
  for (const row of Object.values(bucket)) {
    const n = row?.market_hash_name;
    if (typeof n !== "string") continue;
    if (n === want && row.icon_url) return row.icon_url;
  }
  for (const row of Object.values(bucket)) {
    const n = row?.market_hash_name;
    if (typeof n === "string" && n.toLowerCase() === wlow && row.icon_url) return row.icon_url;
  }
  return null;
}

/**
 * 将 Steam 返回的 `icon_url` 转为可展示的 HTTPS 图链（社区 CDN）。
 *
 * @param iconPath - 如 `-9a81dWLwJ2UUGcVs_...`
 */
export function steamEconomyImageUrl(iconPath: string): string {
  const p = iconPath.replace(/^\/+/, "").trim();
  if (!p) return "";
  return `https://community.cloudflare.steamstatic.com/economy/image/${p}/360fx360f`;
}

/**
 * 用市场搜索接口解析单件饰品图标路径（与 `priceoverview` 分离的公开 JSON）。
 */
export async function lookupEconomyIconPath(marketHashName: string): Promise<string | null> {
  const q = marketHashName.trim();
  if (!q) return null;
  const got = await steamGetJson(searchRenderUrl(q, 0, 16));
  if (!got.ok) return null;
  return extractIconUrlForHash(got.json, q);
}

export function extractSuggestFromRender(j: unknown, limit: number): { market_hash_name: string }[] {
  const assets = (j as { assets?: Record<string, Record<string, Record<string, { market_hash_name?: string }>>> })
    .assets;
  const out: { market_hash_name: string }[] = [];
  const seen = new Set<string>();
  const bucket = assets?.[String(CS2_APP_ID)]?.["2"];
  if (!bucket) return out;
  for (const row of Object.values(bucket)) {
    const name = row?.market_hash_name;
    if (typeof name !== "string" || !name.trim()) continue;
    if (seen.has(name)) continue;
    seen.add(name);
    out.push({ market_hash_name: name });
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * 拼装 `pricehistory` URL（可能需在浏览器登录态下才有数据）。
 */
export function priceHistoryUrl(marketHashName: string): string {
  const q = new URLSearchParams({
    appid: String(CS2_APP_ID),
    market_hash_name: marketHashName,
  });
  return `https://steamcommunity.com/market/pricehistory/?${q.toString()}`;
}

type PriceHistoryJson = {
  success?: boolean;
  prices?: [string, number, string][];
};

/**
 * 将 Steam 日级成交价序列转为 OHLC 柱（开收高低同为当日价，量为第三列）。
 *
 * @param j - `pricehistory` JSON
 */
export function mapPriceHistoryToBars(j: unknown): KlineBar[] {
  const o = j as PriceHistoryJson;
  if (!o.success || !Array.isArray(o.prices)) return [];
  const bars: KlineBar[] = [];
  for (const row of o.prices) {
    if (!Array.isArray(row) || row.length < 3) continue;
    const dateLabel = String(row[0]);
    const price = typeof row[1] === "number" ? row[1] : parseFloat(String(row[1]));
    if (!Number.isFinite(price)) continue;
    const volStr = String(row[2]);
    const volume = parseInt(volStr.replace(/,/g, ""), 10) || 0;
    const dayKey = dateLabel.slice(0, 15).trim() || dateLabel;
    bars.push({
      date: dayKey,
      open: price,
      high: price,
      low: price,
      close: price,
      volume,
      amount: price * volume,
    });
  }
  return bars;
}

/**
 * 热门排序的 `search/render` URL。
 */
export function popularRenderUrl(start: number, count: number): string {
  const q = new URLSearchParams({
    query: "",
    start: String(start),
    count: String(Math.min(50, Math.max(1, count))),
    search_descriptions: "0",
    sort_column: "popular",
    sort_dir: "desc",
    appid: String(CS2_APP_ID),
    norender: "1",
  });
  return `https://steamcommunity.com/market/search/render/?${q.toString()}`;
}

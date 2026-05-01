import { buildEastMoneyUrl, EM_PATH, EM_UT, EM_ORIGIN } from "./endpoints";
import { eastMoneyFetchInit } from "./http";
import { aShareCodeToSecid } from "./secid";
import type {
  BookLevel,
  FflowDaySummary,
  FflowMinutePoint,
  IndexTickerItem,
  KlineBar,
  MoverRow,
  NewsItem,
  StockQuote,
  StockSuggestItem,
  TickRow,
  WatchlistRow,
} from "@/types/stock";

type EmJson<T> = { rc?: number; data?: T | null };

const QUOTE_FIELDS =
  "f43,f44,f45,f46,f47,f48,f60,f168,f116,f162,f167,f170,f171,f172,f57,f58," +
  "f31,f32,f33,f34,f35,f36,f37,f38,f39,f40,f19,f20,f17,f18,f15,f16,f13,f14,f11,f12";

function numFrom(d: Record<string, unknown>, k: string): number | null {
  const v = d[k];
  if (v === null || v === undefined || v === "-") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function strFrom(d: Record<string, unknown>, k: string): string {
  const v = d[k];
  return v === null || v === undefined ? "" : String(v);
}

function parseOrderBook(d: Record<string, unknown>): { asks: BookLevel[]; bids: BookLevel[] } {
  const asks: BookLevel[] = [];
  const bidPairs: [string, string][] = [
    ["f31", "f32"],
    ["f33", "f34"],
    ["f35", "f36"],
    ["f37", "f38"],
    ["f39", "f40"],
  ];
  for (const [pk, vk] of bidPairs) {
    const p = numFrom(d, pk);
    const v = numFrom(d, vk);
    if (p !== null && v !== null && p > 0) asks.push({ price: p, volume: v });
  }
  const bids: BookLevel[] = [];
  const askPairs: [string, string][] = [
    ["f19", "f20"],
    ["f17", "f18"],
    ["f15", "f16"],
    ["f13", "f14"],
    ["f11", "f12"],
  ];
  for (const [pk, vk] of askPairs) {
    const p = numFrom(d, pk);
    const v = numFrom(d, vk);
    if (p !== null && v !== null && p > 0) bids.push({ price: p, volume: v });
  }
  return { asks, bids };
}

/**
 * 单券完整报价（含五档）。
 */
export async function fetchStockQuoteFull(code: string): Promise<StockQuote | null> {
  const secid = aShareCodeToSecid(code);
  if (!secid) return null;

  const url = buildEastMoneyUrl("push2", EM_PATH.stockGet, {
    ut: EM_UT,
    invt: 2,
    fltt: 2,
    fields: QUOTE_FIELDS,
    secid,
  });

  const res = await fetch(url, eastMoneyFetchInit);
  if (!res.ok) return null;
  const json = (await res.json()) as EmJson<Record<string, unknown>>;
  const d = json.data;
  if (!d || typeof d !== "object") return null;

  const price = numFrom(d, "f43");
  const prevClose = numFrom(d, "f60");
  if (prevClose === null) return null;

  const { asks, bids } = parseOrderBook(d);
  const displayPrice = price !== null && price > 0 ? price : prevClose;

  return {
    code: strFrom(d, "f57") || code.replace(/\D/g, ""),
    name: strFrom(d, "f58") || code,
    price: displayPrice,
    prevClose,
    open: numFrom(d, "f46") ?? prevClose,
    high: numFrom(d, "f44") ?? prevClose,
    low: numFrom(d, "f45") ?? prevClose,
    volumeHands: numFrom(d, "f47") ?? 0,
    turnoverYuan: numFrom(d, "f48") ?? 0,
    turnoverRatePct: numFrom(d, "f168") ?? 0,
    peDynamic: numFrom(d, "f162"),
    marketCapYuan: numFrom(d, "f116") ?? 0,
    fetchedAt: new Date().toISOString(),
    orderBook: { asks, bids },
  };
}

/**
 * 日 K 线（前复权），取最近 `limit` 根。
 */
export async function fetchStockKline(
  code: string,
  klt: number,
  limit: number,
): Promise<KlineBar[]> {
  const secid = aShareCodeToSecid(code);
  if (!secid) return [];

  const url = buildEastMoneyUrl("push2His", EM_PATH.stockKlineHis, {
    fields1: "f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f11,f12,f13",
    fields2: "f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61",
    beg: 0,
    end: 20500101,
    ut: EM_UT,
    rtntype: 6,
    secid,
    klt,
    fqt: 1,
    lmt: limit,
  });

  const res = await fetch(url, eastMoneyFetchInit);
  if (!res.ok) return [];
  const json = (await res.json()) as EmJson<{ klines?: string[] }>;
  const rows = json.data?.klines;
  if (!Array.isArray(rows)) return [];

  const out: KlineBar[] = [];
  for (const line of rows) {
    const p = line.split(",");
    if (p.length < 7) continue;
    const date = p[0] ?? "";
    const open = parseFloat(p[1] ?? "0");
    const close = parseFloat(p[2] ?? "0");
    const high = parseFloat(p[3] ?? "0");
    const low = parseFloat(p[4] ?? "0");
    const vol = parseFloat(p[5] ?? "0");
    const amount = parseFloat(p[6] ?? "0");
    if (!date) continue;
    out.push({ date, open, close, high, low, volume: vol, amount });
  }
  return out.slice(-limit);
}

/** 分时成交（最近若干笔，东财 `pos` 为负表示从最新往前）。 */
export async function fetchStockTicks(code: string, pos = -20): Promise<TickRow[]> {
  const secid = aShareCodeToSecid(code);
  if (!secid) return [];

  const url = buildEastMoneyUrl("push2", EM_PATH.stockDetails, {
    fields1: "f1,f2,f3,f4",
    fields2: "f51,f52,f53,f54,f55",
    fltt: 2,
    pos,
    secid,
    ut: EM_UT,
  });

  const res = await fetch(url, eastMoneyFetchInit);
  if (!res.ok) return [];
  const json = (await res.json()) as EmJson<{ details?: string[] }>;
  const details = json.data?.details;
  if (!Array.isArray(details)) return [];

  const rows: TickRow[] = [];
  for (const line of details) {
    const p = line.split(",");
    if (p.length < 5) continue;
    const time = (p[0] ?? "").trim();
    const price = parseFloat(p[1] ?? "0");
    const volume = parseFloat(p[2] ?? "0");
    const tickType = parseInt(p[4] ?? "0", 10) || 0;
    rows.push({ time, price, volume, tickType });
  }
  return rows.reverse();
}

/** 顶部指数条：多标的批量（`secid` 逗号分隔，与东财一致）。 */
export async function fetchIndexTickers(secids: string): Promise<IndexTickerItem[]> {
  const url = buildEastMoneyUrl("push2", EM_PATH.ulistNp, {
    fltt: 2,
    secids,
    fields: "f2,f3,f4,f12,f14,f13",
    ut: EM_UT,
  });
  const res = await fetch(url, eastMoneyFetchInit);
  if (!res.ok) return [];
  const json = (await res.json()) as EmJson<{ diff?: Record<string, unknown>[] }>;
  const diff = json.data?.diff;
  if (!Array.isArray(diff)) return [];
  return diff.map((row) => ({
    code: strFrom(row, "f12"),
    name: strFrom(row, "f14"),
    price: numFrom(row, "f2") ?? 0,
    changePct: numFrom(row, "f3") ?? 0,
    changeAmount: numFrom(row, "f4") ?? 0,
  }));
}

/** A 股涨幅榜（与 PC 列表同源 `clist`）。 */
export async function fetchMovers(pz = 20): Promise<MoverRow[]> {
  const url = buildEastMoneyUrl("push2", EM_PATH.clist, {
    pn: 1,
    pz,
    po: 1,
    np: 1,
    ut: "bd1d9ddb04089700cf9c27f6f7426281",
    fltt: 2,
    invt: 2,
    fid: "f3",
    fs: "m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23",
    fields: "f12,f14,f2,f3,f8",
  });
  const res = await fetch(url, eastMoneyFetchInit);
  if (!res.ok) return [];
  const json = (await res.json()) as EmJson<{ diff?: Record<string, unknown>[] }>;
  const diff = json.data?.diff;
  if (!Array.isArray(diff)) return [];
  return diff.map((row) => ({
    code: strFrom(row, "f12"),
    name: strFrom(row, "f14"),
    price: numFrom(row, "f2") ?? 0,
    changePct: numFrom(row, "f3") ?? 0,
    turnoverPct: numFrom(row, "f8") ?? 0,
  }));
}

/** 7x24 快讯 */
export async function fetchNewsList(pageSize = 15, lastId = "0"): Promise<NewsItem[]> {
  const u = new URL(EM_PATH.newsList, EM_ORIGIN.newsKuaixun);
  u.searchParams.set("column", "102");
  u.searchParams.set("lastId", lastId);
  u.searchParams.set("pageSize", String(pageSize));

  const res = await fetch(u.toString(), eastMoneyFetchInit);
  if (!res.ok) return [];
  const json = (await res.json()) as {
    news?: {
      newsid?: string;
      title?: string;
      showtime?: string;
      url_w?: string;
    }[];
  };
  const list = json.news;
  if (!Array.isArray(list)) return [];
  return list.map((n) => ({
    id: String(n.newsid ?? ""),
    title: String(n.title ?? ""),
    time: String(n.showtime ?? "").slice(11, 16) || String(n.showtime ?? "").slice(0, 16),
    url: String(n.url_w ?? "#"),
  }));
}

/**
 * A 股联想搜索：东财 `searchAdapter` + `type=14`。
 *
 * 步骤：
 * 1. 用 `buildEastMoneyUrl` 拼 `suggest/get`。
 * 2. 解析 `QuotationCodeTable.Data`。
 * 3. 只保留 6 位数字代码并去重，最多 `maxCount` 条。
 */
export async function fetchStockSuggest(
  input: string,
  maxCount = 8,
): Promise<StockSuggestItem[]> {
  const q = input.trim();
  if (q.length < 1) return [];

  const url = buildEastMoneyUrl("searchAdapter", EM_PATH.stockSuggest, {
    input: q,
    type: 14,
    count: Math.min(20, Math.max(1, maxCount)),
  });

  const res = await fetch(url, eastMoneyFetchInit);
  if (!res.ok) return [];
  const json = (await res.json()) as {
    QuotationCodeTable?: {
      Data?: {
        Code?: string;
        Name?: string;
        SecurityTypeName?: string;
      }[];
    };
  };
  const rows = json.QuotationCodeTable?.Data;
  if (!Array.isArray(rows)) return [];

  const cap = Math.min(20, Math.max(1, maxCount));
  const seen = new Set<string>();
  const out: StockSuggestItem[] = [];
  for (const row of rows) {
    const code = String(row.Code ?? "").trim();
    if (!/^\d{6}$/.test(code)) continue;
    if (seen.has(code)) continue;
    seen.add(code);
    out.push({
      code,
      name: String(row.Name ?? "").trim() || code,
      marketLabel: String(row.SecurityTypeName ?? "").trim() || `A股`,
    });
    if (out.length >= cap) break;
  }
  return out;
}

/** 分时资金流向（1 分钟），用于面积图 */
export async function fetchFflowIntraday(code: string, lmt = 30): Promise<FflowMinutePoint[]> {
  const secid = aShareCodeToSecid(code);
  if (!secid) return [];

  const url = buildEastMoneyUrl("push2", EM_PATH.stockFflowIntraday, {
    secid,
    lmt,
    klt: 1,
    fields1: "f1,f2,f3,f7",
    fields2: "f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61,f62,f63,f64,f65",
    ut: EM_UT,
  });
  const res = await fetch(url, eastMoneyFetchInit);
  if (!res.ok) return [];
  const json = (await res.json()) as EmJson<{ klines?: string[] }>;
  const klines = json.data?.klines;
  if (!Array.isArray(klines)) return [];

  const out: FflowMinutePoint[] = [];
  for (const line of klines) {
    const p = line.split(",");
    const timeLabel = (p[0] ?? "").trim();
    const mainNet = parseFloat(p[5] ?? "0");
    if (timeLabel) out.push({ timeLabel, mainNetYuan: mainNet });
  }
  return out;
}

/** 当日资金流向汇总（一条） */
export async function fetchFflowDaySummary(code: string): Promise<FflowDaySummary | null> {
  const secid = aShareCodeToSecid(code);
  if (!secid) return null;

  const url = buildEastMoneyUrl("push2", EM_PATH.stockFflowDay, {
    secid,
    lmt: 1,
    klt: 101,
    fields1: "f1,f2,f3,f7",
    fields2: "f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61,f62,f63,f64,f65",
    ut: EM_UT,
  });
  const res = await fetch(url, eastMoneyFetchInit);
  if (!res.ok) return null;
  const json = (await res.json()) as EmJson<{ klines?: string[] }>;
  const k = json.data?.klines?.[0];
  if (!k) return null;
  const p = k.split(",");
  const date = (p[0] ?? "").slice(0, 10);
  const mainNet = parseFloat(p[1] ?? "0");
  const retailNet = parseFloat(p[4] ?? "0");
  return { date, mainNetYuan: mainNet, retailNetYuan: retailNet };
}

/** 自选批价（`ulist.np`） */
export async function fetchWatchlistQuotes(codes: string[]): Promise<WatchlistRow[]> {
  const secids = codes
    .map((c) => aShareCodeToSecid(c.replace(/\D/g, "")))
    .filter(Boolean)
    .join(",");
  if (!secids) return [];

  const url = buildEastMoneyUrl("push2", EM_PATH.ulistNp, {
    fltt: 2,
    secids,
    fields: "f2,f3,f12,f14,f60",
    ut: EM_UT,
  });
  const res = await fetch(url, eastMoneyFetchInit);
  if (!res.ok) return [];
  const json = (await res.json()) as EmJson<{ diff?: Record<string, unknown>[] }>;
  const diff = json.data?.diff;
  if (!Array.isArray(diff)) return [];

  return diff.map((row) => {
    const code = strFrom(row, "f12");
    const name = strFrom(row, "f14");
    const price = numFrom(row, "f2") ?? 0;
    const prev = numFrom(row, "f60") ?? price;
    const changePct = prev !== 0 ? +(((price - prev) / prev) * 100).toFixed(2) : 0;
    return { code, name, price, prevClose: prev, changePct };
  });
}

/** 顶部滚动条默认跟踪的指数（东财 `secid`） */
export const DEFAULT_INDEX_SECIDS =
  "1.000001,0.399001,0.399006,1.000688,100.HSI,100.DJIA,100.NDX";

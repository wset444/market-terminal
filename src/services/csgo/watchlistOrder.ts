import { CSGO_WATCHLIST } from "@/services/csgo/watchlist-config";

/** `localStorage` 键：CS2 关注表行顺序（`market_hash_name` JSON 数组） */
export const CSGO_WATCHLIST_ORDER_KEY = "react-ai-csgo-watchlist-order";

/**
 * 步骤：
 * 1. 用 `CSGO_WATCHLIST` 生成配置内合法 `market_hash_name` 集合。
 * 2. 返回当前配置下默认顺序数组（与 `watchlist-config` 一致）。
 */
export function defaultCsgoWatchlistOrder(): string[] {
  return CSGO_WATCHLIST.map((w) => w.market_hash_name);
}

/**
 * 步骤：
 * 1. 读 `CSGO_WATCHLIST_ORDER_KEY` 的 JSON 数组。
 * 2. 过滤非法项，仅保留仍存在于当前 `CSGO_WATCHLIST` 配置中的名称。
 * 3. 解析失败或空时返回 `null`，由调用方用 `mergeOrderWithConfig(null)`。
 */
export function readCsgoWatchlistOrderRaw(): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CSGO_WATCHLIST_ORDER_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const allowed = new Set(defaultCsgoWatchlistOrder());
    const seen = new Set<string>();
    const out: string[] = [];
    for (const x of parsed) {
      if (typeof x !== "string" || !allowed.has(x) || seen.has(x)) continue;
      seen.add(x);
      out.push(x);
    }
    return out.length > 0 ? out : null;
  } catch {
    return null;
  }
}

/**
 * 步骤：
 * 1. 以 `stored`（若有）为前缀顺序，剔除已不在配置中的项。
 * 2. 将配置中尚未出现在顺序里的项按配置原顺序追加到末尾。
 *
 * @param stored - `readCsgoWatchlistOrderRaw()` 的返回值
 */
export function mergeOrderWithConfig(stored: string[] | null): string[] {
  const fallback = defaultCsgoWatchlistOrder();
  if (!stored || stored.length === 0) return [...fallback];
  const fset = new Set(fallback);
  const head = stored.filter((x) => fset.has(x));
  const tail = fallback.filter((x) => !head.includes(x));
  return [...head, ...tail];
}

/**
 * 步骤：将合法顺序序列化写入 `localStorage`；仅包含当前配置中的名称。
 *
 * @param order - 与表格行一致的 `market_hash_name` 顺序
 */
export function writeCsgoWatchlistOrder(order: string[]): void {
  if (typeof window === "undefined") return;
  const allowed = new Set(defaultCsgoWatchlistOrder());
  const cleaned: string[] = [];
  const seen = new Set<string>();
  for (const x of order) {
    if (!allowed.has(x) || seen.has(x)) continue;
    seen.add(x);
    cleaned.push(x);
  }
  if (cleaned.length !== allowed.size) return;
  window.localStorage.setItem(CSGO_WATCHLIST_ORDER_KEY, JSON.stringify(cleaned));
}

/**
 * 步骤：
 * 1. 复制 `order` 后 `splice` 将 `fromIndex` 移到 `toIndex`。
 * 2. 越界或同位则返回原数组且不写盘。
 * 3. 合法时 `writeCsgoWatchlistOrder` 并返回新数组。
 */
export function reorderCsgoWatchlistOrder(fromIndex: number, toIndex: number, order: string[]): string[] {
  if (fromIndex === toIndex) return order;
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= order.length || toIndex >= order.length) {
    return order;
  }
  const next = [...order];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  writeCsgoWatchlistOrder(next);
  return next;
}

/**
 * 步骤：按 `order` 中 `market_hash_name` 先后排列 `rows`；未出现在 `order` 的项按原数组顺序接在末尾。
 */
export function sortCsgoWatchlistRows<T extends { market_hash_name: string }>(rows: T[], order: string[]): T[] {
  const map = new Map(rows.map((r) => [r.market_hash_name, r]));
  const out: T[] = [];
  for (const k of order) {
    const r = map.get(k);
    if (r) out.push(r);
  }
  for (const r of rows) {
    if (!out.includes(r)) out.push(r);
  }
  return out;
}

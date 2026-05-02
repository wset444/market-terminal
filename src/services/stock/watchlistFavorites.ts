/** 浏览器 `localStorage` 键：自选收藏（6 位 A 股代码有序列表 JSON） */
export const STOCK_WATCHLIST_FAVORITES_KEY = "react-ai-stock-watchlist-favorites";

const MAX_FAVORITES = 30;

function isSixDigit(code: string): boolean {
  return /^\d{6}$/.test(code);
}

/**
 * 1. 从 `localStorage` 读取 JSON 数组字符串。
 * 2. 过滤非法项，去重且保持顺序，最多 `MAX_FAVORITES` 条。
 * 3. `SSR` 或禁用时返回空数组。
 */
export function readFavoriteCodes(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STOCK_WATCHLIST_FAVORITES_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const out: string[] = [];
    const seen = new Set<string>();
    for (const x of parsed) {
      if (typeof x !== "string" || !isSixDigit(x) || seen.has(x)) continue;
      seen.add(x);
      out.push(x);
      if (out.length >= MAX_FAVORITES) break;
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * 1. 将合法代码列表序列化为 JSON 写入 `localStorage`。
 * 2. 写入前再次裁剪长度与格式。
 * 3. 仅应在客户端调用。
 */
export function writeFavoriteCodes(codes: string[]): void {
  if (typeof window === "undefined") return;
  const cleaned = codes.filter(isSixDigit).slice(0, MAX_FAVORITES);
  window.localStorage.setItem(STOCK_WATCHLIST_FAVORITES_KEY, JSON.stringify(cleaned));
}

/**
 * 1. 若 `code` 已在收藏中则移除，否则追加到末尾。
 * 2. 持久化后返回最新列表，供 React `setState`。
 * 3. `code` 非 6 位数字时原样返回当前列表。
 */
export function toggleFavoriteCode(code: string): string[] {
  if (!isSixDigit(code)) return readFavoriteCodes();
  const cur = readFavoriteCodes();
  const exists = cur.includes(code);
  const next = exists ? cur.filter((c) => c !== code) : [...cur, code];
  writeFavoriteCodes(next);
  return next;
}

/**
 * 1. 若 `code` 已在收藏中则 `added: false` 且列表不变。
 * 2. 否则追加并 `added: true`。
 * 3. 供「加自选」按钮与提示文案使用。
 */
export function addFavoriteCodeIfMissing(code: string): { codes: string[]; added: boolean } {
  if (!isSixDigit(code)) return { codes: readFavoriteCodes(), added: false };
  const cur = readFavoriteCodes();
  if (cur.includes(code)) return { codes: cur, added: false };
  const next = [...cur, code].slice(0, MAX_FAVORITES);
  writeFavoriteCodes(next);
  return { codes: next, added: true };
}

/**
 * 步骤：
 * 1. 读取当前收藏顺序（与表格行顺序一致）。
 * 2. 任一索引越界或与 `fromIndex === toIndex` 时原样返回当前列表。
 * 3. `splice` 取出 `fromIndex` 再插入 `toIndex`，写入 `localStorage` 并返回新数组。
 *
 * @param fromIndex - 被拖动行的原下标
 * @param toIndex - 放置目标行的下标（整行作为插入位置）
 */
export function reorderFavoriteCodes(fromIndex: number, toIndex: number): string[] {
  const cur = readFavoriteCodes();
  if (fromIndex === toIndex) return cur;
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= cur.length || toIndex >= cur.length) {
    return cur;
  }
  const next = [...cur];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  writeFavoriteCodes(next);
  return next;
}

/** 浏览器 `localStorage` 键：CS2 饰品自选（`market_hash_name` 有序 JSON 数组） */
export const CSGO_FAVORITES_KEY = "react-ai-csgo-favorites";

const MAX_FAVORITES = 40;

/**
 * 步骤：
 * 1. 去首尾空白，长度在 1～256 之间视为合法饰品名。
 * 2. 否则为非法。
 */
function isValidMarketHashName(s: string): boolean {
  const t = s.trim();
  return t.length > 0 && t.length <= 256;
}

/**
 * 步骤：
 * 1. 从 `localStorage` 读 JSON 数组。
 * 2. 过滤非字符串、非法名、去重保序，最多 `MAX_FAVORITES` 条。
 * 3. 非浏览器或解析失败返回空数组。
 */
export function readCsgoFavoriteHashes(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CSGO_FAVORITES_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const out: string[] = [];
    const seen = new Set<string>();
    for (const x of parsed) {
      if (typeof x !== "string" || !isValidMarketHashName(x)) continue;
      const t = x.trim();
      if (seen.has(t)) continue;
      seen.add(t);
      out.push(t);
      if (out.length >= MAX_FAVORITES) break;
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * 步骤：裁剪后序列化写入 `CSGO_FAVORITES_KEY`；仅客户端调用。
 *
 * @param hashes - 饰品 `market_hash_name` 列表
 */
export function writeCsgoFavoriteHashes(hashes: string[]): void {
  if (typeof window === "undefined") return;
  const cleaned = hashes.filter(isValidMarketHashName).map((s) => s.trim()).slice(0, MAX_FAVORITES);
  window.localStorage.setItem(CSGO_FAVORITES_KEY, JSON.stringify(cleaned));
}

/**
 * 步骤：
 * 1. 若当前名已在列表则移除，否则追加到末尾。
 * 2. 非法名时返回当前列表且不写入。
 * 3. 写入后返回新数组。
 */
export function toggleCsgoFavoriteHash(marketHashName: string): string[] {
  if (!isValidMarketHashName(marketHashName)) return readCsgoFavoriteHashes();
  const key = marketHashName.trim();
  const cur = readCsgoFavoriteHashes();
  const exists = cur.some((h) => h === key);
  const next = exists ? cur.filter((h) => h !== key) : [...cur, key];
  writeCsgoFavoriteHashes(next);
  return next;
}

/**
 * 步骤：
 * 1. 已在列表则 `added: false` 且列表不变。
 * 2. 否则追加（受条数上限约束）并 `added: true`。
 */
export function addCsgoFavoriteIfMissing(marketHashName: string): { hashes: string[]; added: boolean } {
  if (!isValidMarketHashName(marketHashName)) return { hashes: readCsgoFavoriteHashes(), added: false };
  const key = marketHashName.trim();
  const cur = readCsgoFavoriteHashes();
  if (cur.some((h) => h === key)) return { hashes: cur, added: false };
  const next = [...cur, key].slice(0, MAX_FAVORITES);
  writeCsgoFavoriteHashes(next);
  return { hashes: next, added: true };
}

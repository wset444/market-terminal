/** 浏览器 `localStorage` 键：标题栏「标记」角标（与自选收藏独立） */
export const STOCK_MARKED_KEY = "react-ai-stock-marked";

const MAX_MARKED = 50;

function isSixDigit(code: string): boolean {
  return /^\d{6}$/.test(code);
}

/**
 * 1. 读取已标记的 6 位代码列表。
 * 2. 非法 JSON 或 `SSR` 时返回空数组。
 */
export function readMarkedCodes(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STOCK_MARKED_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const out: string[] = [];
    const seen = new Set<string>();
    for (const x of parsed) {
      if (typeof x !== "string" || !isSixDigit(x) || seen.has(x)) continue;
      seen.add(x);
      out.push(x);
      if (out.length >= MAX_MARKED) break;
    }
    return out;
  } catch {
    return [];
  }
}

function writeMarkedCodes(codes: string[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    STOCK_MARKED_KEY,
    JSON.stringify(codes.filter(isSixDigit).slice(0, MAX_MARKED)),
  );
}

/**
 * 1. 切换当前代码是否在「标记」集合中。
 * 2. 持久化后返回最新列表。
 */
export function toggleMarkedCode(code: string): string[] {
  if (!isSixDigit(code)) return readMarkedCodes();
  const cur = readMarkedCodes();
  const exists = cur.includes(code);
  const next = exists ? cur.filter((c) => c !== code) : [...cur, code];
  writeMarkedCodes(next);
  return next;
}

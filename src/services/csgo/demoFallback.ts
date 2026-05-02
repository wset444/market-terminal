import type { KlineBar } from "@/types/stock";
import type { CsgoPopularRow, CsgoQuote, CsgoSuggestItem } from "@/types/csgo";
import { csgoPicsumIconUrl } from "@/services/csgo/fallbackIconUrl";

/**
 * 是否禁止使用 Steam 不可达时的内置演示数据。
 *
 * 1. **默认返回 `false`**：允许 `demoQuote` / `demoKline` 等在 Steam 失败时兜底。
 * 2. 生产或审计场景可设 `CSGO_DISABLE_DEMO=1`，此时返回 `true`，接口不再返回演示价。
 * 3. 与 `resolveQuote`、各 `/api/csgo/*` 及 `/api/csgo/ticker` 中的回退分支一致。
 */
export function isDemoFallbackDisabled(): boolean {
  return process.env.CSGO_DISABLE_DEMO === "1";
}

const POPULAR: CsgoPopularRow[] = [
  { market_hash_name: "AK-47 | Redline (Field-Tested)", name: "AK-47 | Redline (Field-Tested)" },
  { market_hash_name: "AWP | Asiimov (Field-Tested)", name: "AWP | Asiimov (Field-Tested)" },
  { market_hash_name: "M4A4 | Howl (Field-Tested)", name: "M4A4 | Howl (Field-Tested)" },
  { market_hash_name: "★ Karambit | Fade (Factory New)", name: "★ Karambit | Fade (Factory New)" },
  { market_hash_name: "USP-S | Kill Confirmed (Minimal Wear)", name: "USP-S | Kill Confirmed (Minimal Wear)" },
  { market_hash_name: "Glock-18 | Fade (Factory New)", name: "Glock-18 | Fade (Factory New)" },
  { market_hash_name: "Desert Eagle | Blaze (Factory New)", name: "Desert Eagle | Blaze (Factory New)" },
  { market_hash_name: "AK-47 | Fire Serpent (Field-Tested)", name: "AK-47 | Fire Serpent (Field-Tested)" },
  { market_hash_name: "M4A1-S | Printstream (Field-Tested)", name: "M4A1-S | Printstream (Field-Tested)" },
  { market_hash_name: "★ Sport Gloves | Pandora's Box (Field-Tested)", name: "★ Sport Gloves | Pandora's Box (Field-Tested)" },
];

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Steam 不可达时的挂牌演示数据（价格随机种子，仅用于界面联调）。
 */
export function demoQuote(marketHashName: string): CsgoQuote {
  const seed = hashSeed(marketHashName);
  const low = 12 + (seed % 800) / 10;
  const med = +(low * 1.03).toFixed(2);
  const vol = 500 + (seed % 4000);
  const lowS = low.toFixed(2);
  const medS = med.toFixed(2);
  return {
    market_hash_name: marketHashName,
    lowest: +lowS,
    median: med,
    volume: vol,
    lowestRaw: `$${lowS}`,
    medianRaw: `$${medS}`,
    volumeRaw: String(vol),
    success: true,
    fetchedAt: new Date().toISOString(),
    orderBook: { asks: [], bids: [] },
    dataSource: "demo",
    iconUrl: csgoPicsumIconUrl(marketHashName),
  };
}

/**
 * 演示 K 线：近 n 根日 K，价在种子附近波动。
 */
export function demoKline(marketHashName: string, days = 90): KlineBar[] {
  const seed = hashSeed(marketHashName);
  let close = 20 + (seed % 200) / 5;
  const out: KlineBar[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    const delta = ((seed + i * 17) % 17) / 10 - 0.8;
    const open = close;
    close = Math.max(1, +(open + delta).toFixed(2));
    const high = +Math.max(open, close, open + 0.5).toFixed(2);
    const low = +Math.min(open, close, open - 0.5).toFixed(2);
    const vol = 200 + ((seed + i) % 1800);
    out.push({
      date,
      open: +open.toFixed(2),
      close,
      high,
      low,
      volume: vol,
      amount: +(close * vol).toFixed(0),
    });
  }
  return out;
}

export function demoPopular(): CsgoPopularRow[] {
  return [...POPULAR];
}

export function demoSuggest(q: string, limit: number): CsgoSuggestItem[] {
  const ql = q.trim().toLowerCase();
  if (!ql) return [];
  const rows = POPULAR.filter(
    (x) =>
      x.market_hash_name.toLowerCase().includes(ql) || x.name.toLowerCase().includes(ql),
  ).slice(0, limit);
  return rows.map((x) => ({ market_hash_name: x.market_hash_name, name: x.name }));
}

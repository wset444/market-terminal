/**
 * CS2 演示「库存/关注」：件数与成本价为本地配置；**现价**来自 `/api/csgo/watchlist` 批量拉 Steam（或演示回退）。
 */
export const CSGO_WATCHLIST: {
  market_hash_name: string;
  /** 件数 */
  qty: number;
  /** 平均成本（美元，与 Steam 价口径一致） */
  avgCostUsd: number;
}[] = [
  { market_hash_name: "AK-47 | Redline (Field-Tested)", qty: 1, avgCostUsd: 18.5 },
  { market_hash_name: "AWP | Asiimov (Field-Tested)", qty: 1, avgCostUsd: 92 },
  { market_hash_name: "M4A1-S | Printstream (Field-Tested)", qty: 2, avgCostUsd: 45 },
  { market_hash_name: "USP-S | Kill Confirmed (Minimal Wear)", qty: 1, avgCostUsd: 38 },
  { market_hash_name: "★ Karambit | Fade (Factory New)", qty: 1, avgCostUsd: 2100 },
];

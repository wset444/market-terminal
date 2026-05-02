/** Steam 市场联想单条（`search/render` 解析） */
export type CsgoSuggestItem = {
  market_hash_name: string;
  /** 列表展示文案，一般为完整饰品名 */
  name: string;
};

/** `/api/csgo/quote` 返回体（由 Steam `priceoverview` 映射，或演示回退） */
export type CsgoQuote = {
  market_hash_name: string;
  lowest: number | null;
  median: number | null;
  /** 近 24h 成交笔数（Steam 文案解析为整数，失败则为 null） */
  volume: number | null;
  lowestRaw: string | null;
  medianRaw: string | null;
  volumeRaw: string | null;
  success: boolean;
  fetchedAt: string;
  orderBook: {
    asks: { price: number; volume: number }[];
    bids: { price: number; volume: number }[];
  };
  /** `demo`：Steam 不可达或解析失败时由本机生成的演示数据 */
  dataSource: "steam" | "demo";
  /**
   * 饰品图：`search/render` → `assets` → `icon_url`，经 Steam CDN（不可达时多为 null）。
   */
  iconUrl: string | null;
};

/** 热门榜单行（`search/render` popular） */
export type CsgoPopularRow = {
  market_hash_name: string;
  name: string;
};

/** `/api/csgo/ticker` 单行：挂牌价 + 相对参考价涨跌幅，供顶栏跑马灯 */
export type CsgoTickerRow = {
  market_hash_name: string;
  name: string;
  priceUsd: number;
  changePct: number;
  dataSource: "steam" | "demo";
};

/** `/api/csgo/watchlist` 单行 */
export type CsgoWatchlistApiRow = {
  market_hash_name: string;
  name: string;
  qty: number;
  avgCost: number;
  price: number;
  prevRef: number;
  changePct: number;
  dataSource: "steam" | "demo";
  iconUrl: string | null;
};

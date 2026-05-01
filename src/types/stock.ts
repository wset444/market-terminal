/** 买卖一档 */
export type BookLevel = {
  price: number;
  volume: number;
};

/** A 股行情快照 + 五档（东财 `stock/get` 扩展字段）。 */
export type StockQuote = {
  code: string;
  name: string;
  price: number;
  prevClose: number;
  open: number;
  high: number;
  low: number;
  /** 成交量，单位：手 */
  volumeHands: number;
  /** 成交额，单位：元 */
  turnoverYuan: number;
  /** 换手率 % */
  turnoverRatePct: number;
  peDynamic: number | null;
  marketCapYuan: number;
  fetchedAt: string;
  orderBook: {
    asks: BookLevel[];
    bids: BookLevel[];
  };
};

export type KlineBar = {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
  /** 成交量（东财 K 线字段，与个股页面一致） */
  volume: number;
  /** 成交额（元） */
  amount: number;
};

export type TickRow = {
  time: string;
  price: number;
  volume: number;
  /** 1 主动买 2 主动卖（东财明细末位，仅作着色参考） */
  tickType: number;
};

export type IndexTickerItem = {
  code: string;
  name: string;
  price: number;
  /** 涨跌幅 % */
  changePct: number;
  /** 涨跌额 */
  changeAmount: number;
};

export type NewsItem = {
  id: string;
  title: string;
  time: string;
  url: string;
};

export type MoverRow = {
  code: string;
  name: string;
  price: number;
  changePct: number;
  /** 换手率 % */
  turnoverPct: number;
};

export type FflowMinutePoint = {
  timeLabel: string;
  /** 主力净额（元，来自东财分时资金序列近似列） */
  mainNetYuan: number;
};

export type FflowDaySummary = {
  date: string;
  /** 解析自日级资金流向字符串，单位：元 */
  mainNetYuan: number;
  retailNetYuan: number;
};

export type WatchlistRow = {
  code: string;
  name: string;
  price: number;
  prevClose: number;
  changePct: number;
};

/** 东财 `suggest/get` 单条结果（已筛为 6 位 A 股代码） */
export type StockSuggestItem = {
  code: string;
  name: string;
  /** 如 深A、沪A */
  marketLabel: string;
};

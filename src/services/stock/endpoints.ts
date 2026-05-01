/**
 * 东方财富等行情接口的 **基础地址与路径**（仅配置，不含业务解析）。
 * 演示用途；商用请换持牌数据源并遵守对方服务条款。
 */

export const EM_ORIGIN = {
  push2: "https://push2.eastmoney.com",
  push2His: "https://push2his.eastmoney.com",
  newsKuaixun: "https://newsinfo.eastmoney.com",
  /** 股票名称/代码联想（东财 Web 同款，演示用途） */
  searchAdapter: "https://searchadapter.eastmoney.com",
} as const;

/** 通用 query：与东财 Web 端一致的 `ut` */
export const EM_UT = "fa5fd1943c7b386f172d6893dbfba10b";

export const EM_PATH = {
  /** 单券快照（含五档等扩展字段） */
  stockGet: "/api/qt/stock/get",
  /** 分时成交明细 */
  stockDetails: "/api/qt/stock/details/get",
  /** 日/周/月 K（历史域名 push2his） */
  stockKlineHis: "/api/qt/stock/kline/get",
  /** 多标的批量报价（指数、自选批价） */
  ulistNp: "/api/qt/ulist.np/get",
  /** 列表（涨幅榜等） */
  clist: "/api/qt/clist/get",
  /** 分时资金流向序列 */
  stockFflowIntraday: "/api/qt/stock/fflow/kline/get",
  /** 日级资金流向汇总（单条字符串多字段） */
  stockFflowDay: "/api/qt/stock/fflow/daykline/get",
  /** 7x24 快讯 */
  newsList: "/kuaixun/v2/api/list",
  /** A 股联想搜索 `type=14` */
  stockSuggest: "/api/suggest/get",
} as const;

export type EastMoneyHost = keyof typeof EM_ORIGIN;

/**
 * 拼接东财完整 URL（`pathname` 以 `/` 开头）。
 */
export function buildEastMoneyUrl(
  host: EastMoneyHost,
  pathname: string,
  params: Record<string, string | number | undefined>,
): string {
  const base = EM_ORIGIN[host];
  const u = new URL(pathname, base);
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue;
    u.searchParams.set(k, String(v));
  }
  return u.toString();
}

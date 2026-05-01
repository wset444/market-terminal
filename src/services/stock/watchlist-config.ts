/**
 * PC 演示：自选持仓参数。**现价/涨跌等为接口真实数据**；`avgCost`、`shares` 为本地配置（非券商回报）。
 */
export const STOCK_WATCHLIST: {
  code: string;
  name?: string;
  shares: number;
  avgCost: number;
}[] = [
  { code: "300750", name: "宁德时代", shares: 200, avgCost: 420 },
  { code: "002594", name: "比亚迪", shares: 100, avgCost: 265 },
  { code: "601012", name: "隆基绿能", shares: 500, avgCost: 29.5 },
  { code: "300059", name: "东方财富", shares: 1000, avgCost: 18.3 },
  { code: "688981", name: "中芯国际", shares: 300, avgCost: 42.6 },
];

import { StockDashboard } from "@/screens/home/StockDashboard";

type HomeProps = {
  searchParams?: Promise<{ code?: string | string[] }>;
};

/**
 * 首页：股票看盘终端。URL `?code=` 为 6 位 A 股时切换主图（自选页「看盘」跳转用）。
 */
export default async function Home({ searchParams }: HomeProps) {
  const sp = (await searchParams) ?? {};
  const raw = sp.code;
  const codeStr = Array.isArray(raw) ? raw[0] : raw;
  const initialStockCode =
    typeof codeStr === "string" && /^\d{6}$/.test(codeStr) ? codeStr : undefined;

  return <StockDashboard initialStockCode={initialStockCode} />;
}

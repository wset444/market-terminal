import { StockDashboard } from "@/screens/home/StockDashboard";

type HomeProps = {
  searchParams?: Promise<{ code?: string | string[] }>;
};

/**
 * 首页：A 股看盘终端。URL `?code=` 为 6 位代码时指定主图标的。
 */
export default async function Home({ searchParams }: HomeProps) {
  const sp = (await searchParams) ?? {};
  const raw = sp.code;
  const codeStr = Array.isArray(raw) ? raw[0] : raw;
  const initialStockCode =
    typeof codeStr === "string" && /^\d{6}$/.test(codeStr) ? codeStr : undefined;

  return <StockDashboard initialStockCode={initialStockCode} />;
}

"use client";

import { useRouter } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import { ROUTES } from "@/constants/routes";

type MarketPageShellProps = {
  children: React.ReactNode;
  /** 用于测试或 DevTools 标记 */
  dataCmp?: string;
};

/**
 * 非行情主图页的共用外壳：顶栏、搜索跳转主图 `/?code=`（深浅色由 `ThemeProvider` 统一管理）。
 */
export function MarketPageShell({ children, dataCmp = "MarketPageShell" }: MarketPageShellProps) {
  const router = useRouter();

  return (
    <div
      data-cmp={dataCmp}
      className="bg-background flex h-dvh min-h-0 min-w-[1440px] flex-col overflow-hidden"
    >
      <TopBar
        onSelectStockCode={(code) => {
          router.push(`${ROUTES.home}?code=${encodeURIComponent(code)}`);
        }}
      />
      {children}
    </div>
  );
}

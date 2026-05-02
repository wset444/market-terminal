"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { useI18n } from "@/contexts/LocaleContext";

type MarketBoardTabsProps = {
  /** `inline`：嵌入顶栏一行，不占单独横条 */
  variant?: "bar" | "inline";
  className?: string;
};

/**
 * A 股行情与 CS2 饰品看板切换（路由 `/` 与 `/csgo`）。
 *
 * 1. 用 `usePathname` 判断当前是否为 CS2 路由。
 * 2. `inline`：嵌入顶栏；`bar`：独立横条（若某页单独使用该变体）。
 * 3. 两个 `Link` 分别指向 `ROUTES.home` 与 `ROUTES.csgo`，样式区分选中态。
 */
export function MarketBoardTabs({ variant = "bar", className = "" }: MarketBoardTabsProps) {
  const pathname = usePathname();
  const { t } = useI18n();
  const onStock = pathname !== ROUTES.csgo;
  const onCsgo = pathname === ROUTES.csgo;

  const pill = (active: boolean) =>
    `rounded px-3 py-1 text-xs font-medium transition-colors ${
      active
        ? "bg-primary text-white"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`;

  if (variant === "inline") {
    return (
      <div
        data-cmp="MarketBoardTabs"
        className={`flex shrink-0 items-center gap-1 ${className}`}
        role="tablist"
        aria-label={t("boardMode.aria")}
      >
        <Link href={ROUTES.home} className={pill(onStock)} role="tab" aria-selected={onStock}>
          {t("boardMode.stocks")}
        </Link>
        <Link href={ROUTES.csgo} className={pill(onCsgo)} role="tab" aria-selected={onCsgo}>
          {t("boardMode.csgo")}
        </Link>
      </div>
    );
  }

  return (
    <div
      data-cmp="MarketBoardTabs"
      className={`border-border bg-panel-header flex h-9 shrink-0 items-center gap-2 border-b px-6 ${className}`}
      role="tablist"
      aria-label={t("boardMode.aria")}
    >
      <Link href={ROUTES.home} className={pill(onStock)} role="tab" aria-selected={onStock}>
        {t("boardMode.stocks")}
      </Link>
      <Link href={ROUTES.csgo} className={pill(onCsgo)} role="tab" aria-selected={onCsgo}>
        {t("boardMode.csgo")}
      </Link>
    </div>
  );
}

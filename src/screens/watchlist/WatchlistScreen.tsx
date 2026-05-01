"use client";

import { MarketPageShell } from "@/components/layout/MarketPageShell";
import { TerminalStatusFooter } from "@/components/layout/TerminalStatusFooter";
import PositionTable from "@/components/sections/PositionTable";
import { ROUTES } from "@/constants/routes";
import { useI18n } from "@/contexts/LocaleContext";

/**
 * 自选页：表格数据来自 `/api/stock/watchlist`（见 `PositionTable`）。
 */
export function WatchlistScreen() {
  const { t } = useI18n();
  return (
    <MarketPageShell dataCmp="WatchlistScreen">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="border-border flex min-h-0 flex-1 flex-col overflow-hidden border-b bg-panel">
          <div className="border-border shrink-0 border-b px-6 py-3">
            <h1 className="text-sm font-semibold text-foreground">{t("watchlist.title")}</h1>
            <p className="mt-1 text-xs text-muted-foreground">{t("watchlist.desc")}</p>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden px-4 pb-4 pt-2">
            <PositionTable quoteLinkBase={ROUTES.home} />
          </div>
        </div>
        <TerminalStatusFooter left={t("watchlist.configHint")} />
      </div>
    </MarketPageShell>
  );
}

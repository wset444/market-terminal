"use client";

import { MarketPageShell } from "@/components/layout/MarketPageShell";
import { TerminalStatusFooter } from "@/components/layout/TerminalStatusFooter";
import { useI18n } from "@/contexts/LocaleContext";

export type PlaceholderScreenKey = "funds" | "research" | "messages" | "settings";

type PlaceholderScreenProps = {
  screenKey: PlaceholderScreenKey;
  dataCmp: string;
};

/**
 * 顶栏新入口的占位页：统一标题区 + 居中提示 + 底栏（文案随语言切换）。
 */
export function PlaceholderScreen({ screenKey, dataCmp }: PlaceholderScreenProps) {
  const { t } = useI18n();
  const p = `placeholder.${screenKey}` as const;
  return (
    <MarketPageShell dataCmp={dataCmp}>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="border-border flex min-h-0 flex-1 flex-col overflow-hidden border-b bg-panel">
          <div className="border-border shrink-0 border-b px-6 py-3">
            <h1 className="text-sm font-semibold text-foreground">{t(`${p}.title`)}</h1>
            <p className="mt-1 text-xs text-muted-foreground">{t(`${p}.description`)}</p>
          </div>
          <div className="flex flex-1 items-center justify-center px-6 py-12">
            <p className="max-w-md text-center text-sm text-muted-foreground">{t(`${p}.hint`)}</p>
          </div>
        </div>
        <TerminalStatusFooter left={t(`${p}.footer`)} />
      </div>
    </MarketPageShell>
  );
}

"use client";

import { useI18n } from "@/contexts/LocaleContext";

type TerminalStatusFooterProps = {
  /** 左侧说明文案（可选） */
  left?: string;
};

/**
 * 看盘各页底部状态条：左侧自定义提示 + 版本号。
 */
export function TerminalStatusFooter({ left }: TerminalStatusFooterProps) {
  const { t } = useI18n();
  return (
    <div className="border-border bg-panel text-muted-foreground flex shrink-0 items-center gap-6 border-t px-4 py-1 text-xs">
      {left ? (
        <span className="text-down flex items-center gap-1 font-medium">
          <span className="bg-down inline-block h-1.5 w-1.5 rounded-full" />
          {left}
        </span>
      ) : (
        <span className="text-muted-foreground">{t("footer.demo")}</span>
      )}
      <div className="flex-1" />
      <span>v2.5.0</span>
    </div>
  );
}

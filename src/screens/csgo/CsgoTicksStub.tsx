"use client";

import { useI18n } from "@/contexts/LocaleContext";

/**
 * 右栏中格：占位说明（Steam 无公开逐笔推送）。
 */
export default function CsgoTicksStub() {
  const { t } = useI18n();
  return (
    <div data-cmp="CsgoTicksStub" className="flex h-full flex-col">
      <div className="border-border bg-panel-header flex flex-nowrap items-center justify-between gap-2 border-b px-3 py-2">
        <span className="shrink-0 whitespace-nowrap text-xs font-medium text-foreground">
          {t("csgo.ticksTitle")}
        </span>
        <span className="min-w-0 flex-1 truncate text-right text-xs text-muted-foreground">
          {t("csgo.ticksSub")}
        </span>
      </div>
      <div className="text-muted-foreground flex flex-1 items-center px-3 py-2 text-xs leading-relaxed">
        {t("csgo.ticksSub")}
      </div>
    </div>
  );
}

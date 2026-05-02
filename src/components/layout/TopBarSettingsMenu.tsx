"use client";

import { useEffect, useRef, useState } from "react";
import { SettingsIcon } from "lucide-react";
import { useI18n } from "@/contexts/LocaleContext";

type TopBarSettingsMenuProps = {
  /** 跑马灯是否使用 `.ticker-animate` 横向滚动 */
  tickerAnimate: boolean;
  /** 切换跑马灯动画并应由父组件写入 `localStorage` */
  onTickerAnimateChange: (next: boolean) => void;
  /** 顶栏时钟是否显示秒 */
  clockShowSeconds: boolean;
  /** 切换显示秒并应由父组件写入 `localStorage` */
  onClockShowSecondsChange: (next: boolean) => void;
};

/**
 * 顶栏齿轮：弹出「页面设置」面板（语言、跑马灯、时钟等本地偏好；深浅色仍用顶栏太阳/月亮）。
 *
 * 步骤：
 * 1. 点击齿轮切换面板的打开/关闭，并同步 `aria-expanded`。
 * 2. 在 `document` 上监听 `mousedown`：点击面板外关闭。
 * 3. 监听 `keydown`：`Escape` 关闭。
 * 4. 语言走 `LocaleContext`；跑马灯与秒表由父组件持久化。
 */
export function TopBarSettingsMenu({
  tickerAnimate,
  onTickerAnimateChange,
  clockShowSeconds,
  onClockShowSecondsChange,
}: TopBarSettingsMenuProps) {
  const { t, locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocMouse = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocMouse);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouse);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pill = (active: boolean) =>
    `rounded px-2.5 py-1 text-xs font-medium transition-colors ${
      active ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`;

  const switchThumb = (on: boolean) =>
    `absolute top-0.5 block h-4 w-4 rounded-full bg-white shadow transition-transform ${
      on ? "translate-x-4" : "translate-x-0.5"
    }`;

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded p-1.5 transition-colors hover:bg-muted"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={t("settingsPanel.openAria")}
      >
        <SettingsIcon size={15} className="text-muted-foreground" />
      </button>

      {open ? (
        <div
          className="border-border bg-panel absolute right-0 z-[60] mt-1 w-[min(100vw-2rem,18rem)] rounded-md border p-3 shadow-lg"
          role="dialog"
          aria-label={t("settingsPanel.title")}
        >
          <div className="border-border mb-3 border-b pb-2 text-xs font-semibold text-foreground">
            {t("settingsPanel.title")}
          </div>

          <div className="space-y-4 text-xs">
            <section className="space-y-2" aria-labelledby="settings-language">
              <div id="settings-language" className="font-medium text-muted-foreground">
                {t("settingsPanel.language")}
              </div>
              <div className="flex gap-1" role="group" aria-label={t("settingsPanel.language")}>
                <button type="button" className={pill(locale === "zh")} onClick={() => setLocale("zh")}>
                  {t("topBar.langZh")}
                </button>
                <button type="button" className={pill(locale === "en")} onClick={() => setLocale("en")}>
                  {t("topBar.langEn")}
                </button>
              </div>
            </section>

            <section className="space-y-2" aria-labelledby="settings-ticker">
              <div id="settings-ticker" className="font-medium text-muted-foreground">
                {t("settingsPanel.ticker")}
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-foreground">{t("settingsPanel.tickerAnimate")}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={tickerAnimate}
                  onClick={() => onTickerAnimateChange(!tickerAnimate)}
                  className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                    tickerAnimate ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span className={switchThumb(tickerAnimate)} />
                </button>
              </div>
              <p className="text-[11px] leading-snug text-muted-foreground">{t("settingsPanel.tickerAnimateHint")}</p>
            </section>

            <section className="space-y-2" aria-labelledby="settings-clock">
              <div id="settings-clock" className="font-medium text-muted-foreground">
                {t("settingsPanel.clock")}
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-foreground">{t("settingsPanel.clockSeconds")}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={clockShowSeconds}
                  onClick={() => onClockShowSecondsChange(!clockShowSeconds)}
                  className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                    clockShowSeconds ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span className={switchThumb(clockShowSeconds)} />
                </button>
              </div>
              <p className="text-[11px] leading-snug text-muted-foreground">{t("settingsPanel.clockSecondsHint")}</p>
            </section>
          </div>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  SunIcon,
  MoonIcon,
  BellIcon,
  SearchIcon,
  WifiIcon,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { MarketBoardTabs } from "@/components/layout/MarketBoardTabs";
import { TopBarSettingsMenu } from "@/components/layout/TopBarSettingsMenu";
import { useI18n } from "@/contexts/LocaleContext";
import { useTheme } from "@/contexts/ThemeContext";
import type { CsgoSuggestItem, CsgoTickerRow } from "@/types/csgo";
import type { IndexTickerItem, StockSuggestItem } from "@/types/stock";
import {
  appLocaleToDateLocale,
  formatShortWeekdayDate,
  formatTimeHm,
  formatTime24h,
} from "@/utils/timeFormat";
import {
  readClockSecondsPref,
  readTickerAnimatePref,
  writeClockSecondsPref,
  writeTickerAnimatePref,
} from "@/utils/uiPrefs";

type TopBarProps = {
  /** 联想选中 6 位 A 股代码后切换主图 */
  onSelectStockCode?: (code: string) => void;
  /** `csgo`：搜索走 `/api/csgo/suggest`，选中 `market_hash_name` */
  searchVariant?: "stock" | "csgo";
  onSelectCsgoItem?: (marketHashName: string) => void;
};

/**
 * 顶部栏：品牌区、（行情页）A 股/CS2 模式切换、搜索、指数跑马灯等。
 *
 * 1. 主导航六个 Tab 已收敛移除，产品入口仅为 `/` 与 `/csgo`。
 * 2. `MarketBoardTabs` 仅在上述两路由展示，与 `StockDashboard` / CS2 页一致。
 * 3. `/` 跑马灯拉 A 股指数；`/csgo` 拉 `/api/csgo/ticker`（Steam + 演示兜底），左侧文案切换。
 */
export default function TopBar({
  onSelectStockCode = () => {},
  searchVariant = "stock",
  onSelectCsgoItem = () => {},
}: TopBarProps) {
  const { isDark, toggleTheme } = useTheme();
  const { t, locale, setLocale } = useI18n();
  const dateLocale = appLocaleToDateLocale(locale);
  const pathname = usePathname();
  const [clockMounted, setClockMounted] = useState(false);
  const [time, setTime] = useState(() => new Date());
  const [tickerItems, setTickerItems] = useState<
    { label: string; price: string; changeStr: string; up: boolean }[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<StockSuggestItem[]>([]);
  const [csgoSuggestions, setCsgoSuggestions] = useState<CsgoSuggestItem[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [tickerAnimate, setTickerAnimate] = useState(true);
  const [clockShowSeconds, setClockShowSeconds] = useState(true);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  /**
   * 步骤：
   * 1. 用 `setTimeout(0)` 在首帧后读取 `localStorage` 与点亮时钟，避免 SSR 与客户端偏好不一致。
   * 2. 满足 `react-hooks/set-state-in-effect`：不在 effect 同步体内直接 `setState`。
   */
  useEffect(() => {
    const boot = window.setTimeout(() => {
      setTickerAnimate(readTickerAnimatePref());
      setClockShowSeconds(readClockSecondsPref());
      setClockMounted(true);
      setTime(new Date());
    }, 0);
    return () => clearTimeout(boot);
  }, []);

  /**
   * 步骤：
   * 1. 仅在 `clockMounted` 后启动定时器。
   * 2. 显示秒时每秒刷新；仅到分时每分钟刷新。
   * 3. 依赖变化时用 `setTimeout(0)` 刷新一次时间，避免 effect 同步 `setTime`。
   */
  useEffect(() => {
    if (!clockMounted) return;
    const flush = window.setTimeout(() => setTime(new Date()), 0);
    const intervalMs = clockShowSeconds ? 1000 : 60_000;
    const t = setInterval(() => setTime(new Date()), intervalMs);
    return () => {
      clearTimeout(flush);
      clearInterval(t);
    };
  }, [clockShowSeconds, clockMounted]);

  useEffect(() => {
    let cancelled = false;

    if (pathname === ROUTES.csgo) {
      const loadCsgo = async () => {
        try {
          const res = await fetch(`/api/csgo/ticker`);
          const j: unknown = await res.json();
          const data = (j as { data?: CsgoTickerRow[] }).data;
          if (cancelled) return;
          if (!Array.isArray(data) || data.length === 0) {
            setTickerItems([]);
            return;
          }
          setTickerItems(
            data.map((row) => {
              const label = row.name.length > 28 ? `${row.name.slice(0, 28)}…` : row.name;
              return {
                label,
                price: `$${row.priceUsd.toFixed(2)}`,
                changeStr: `${row.changePct >= 0 ? "+" : ""}${row.changePct.toFixed(2)}%`,
                up: row.changePct >= 0,
              };
            }),
          );
        } catch {
          if (!cancelled) setTickerItems([]);
        }
      };
      void loadCsgo();
      const id = setInterval(loadCsgo, 15000);
      return () => {
        cancelled = true;
        clearInterval(id);
      };
    }

    const loadStock = async () => {
      try {
        const res = await fetch(`/api/stock/indices`);
        const j: unknown = await res.json();
        const data = (j as { data?: IndexTickerItem[] }).data;
        if (cancelled) return;
        if (!Array.isArray(data)) {
          setTickerItems([]);
          return;
        }
        setTickerItems(
          data.map((x) => ({
            label: x.name || x.code,
            price:
              x.price >= 1000
                ? x.price.toLocaleString("zh-CN", { maximumFractionDigits: 2 })
                : x.price.toFixed(2),
            changeStr: `${x.changePct >= 0 ? "+" : ""}${x.changePct.toFixed(2)}%`,
            up: x.changePct >= 0,
          })),
        );
      } catch {
        if (!cancelled) setTickerItems([]);
      }
    };
    void loadStock();
    const t = setInterval(loadStock, 10000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [pathname]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setSearchQuery("");
      setSuggestions([]);
      setCsgoSuggestions([]);
    }, 0);
    return () => clearTimeout(id);
  }, [pathname, searchVariant]);

  /**
   * 输入防抖后请求股票或 CS2 联想接口，空串清空下拉。
   */
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 1) {
      const clearId = window.setTimeout(() => {
        setSuggestions([]);
        setCsgoSuggestions([]);
      }, 0);
      return () => clearTimeout(clearId);
    }
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          if (searchVariant === "csgo") {
            const res = await fetch(
              `/api/csgo/suggest?q=${encodeURIComponent(q)}&count=12`,
            );
            const j: unknown = await res.json();
            const data = (j as { data?: CsgoSuggestItem[] }).data;
            setCsgoSuggestions(Array.isArray(data) ? data : []);
            setSuggestions([]);
          } else {
            const res = await fetch(
              `/api/stock/suggest?q=${encodeURIComponent(q)}&count=8`,
            );
            const j: unknown = await res.json();
            const data = (j as { data?: StockSuggestItem[] }).data;
            setSuggestions(Array.isArray(data) ? data : []);
            setCsgoSuggestions([]);
          }
        } catch {
          setSuggestions([]);
          setCsgoSuggestions([]);
        }
      })();
    }, 280);
    return () => window.clearTimeout(timer);
  }, [searchQuery, searchVariant]);

  /** 点击搜索区域外关闭联想层。 */
  useEffect(() => {
    const onDocDown = (e: MouseEvent) => {
      if (!searchWrapRef.current?.contains(e.target as Node)) setSuggestOpen(false);
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  const timeStr = clockShowSeconds ? formatTime24h(time, dateLocale) : formatTimeHm(time, dateLocale);
  const dateStr = formatShortWeekdayDate(time, dateLocale);

  const doubled = tickerItems.length > 0 ? [...tickerItems, ...tickerItems] : [];

  return (
    <div data-cmp="TopBar" className="flex w-full flex-col border-b border-border bg-panel">
      <div className="flex h-12 items-center gap-4 px-6">
        <div className="mr-4 flex shrink-0 items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-primary">
            <span className="text-xs font-bold text-white">{t("topBar.brandMark")}</span>
          </div>
          <span className="text-sm font-bold tracking-wide text-foreground">{t("topBar.brandTitle")}</span>
        </div>

        {pathname === ROUTES.home || pathname === ROUTES.csgo ? (
          <>
            <div className="bg-border h-6 w-px shrink-0" aria-hidden />
            <MarketBoardTabs variant="inline" />
          </>
        ) : null}

        <div className="flex-1" />

        <div ref={searchWrapRef} className="relative w-[min(100%,280px)] shrink-0">
          <div className="flex items-center gap-2 rounded bg-muted px-3 py-1.5">
            <SearchIcon size={12} className="shrink-0 text-muted-foreground" />
            <input
              type="search"
              name="stock-suggest"
              autoComplete="off"
              placeholder={
                searchVariant === "csgo"
                  ? t("topBar.searchPlaceholderCsgo")
                  : t("topBar.searchPlaceholder")
              }
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSuggestOpen(true);
              }}
              onFocus={() => setSuggestOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setSuggestOpen(false);
              }}
              className="text-foreground placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-xs outline-none"
            />
          </div>
          {suggestOpen &&
          (searchVariant === "csgo" ? csgoSuggestions.length > 0 : suggestions.length > 0) ? (
            <ul className="border-border bg-panel scrollbar-thin absolute right-0 z-50 mt-1 max-h-64 w-full overflow-y-auto rounded border shadow-md">
              {searchVariant === "csgo"
                ? csgoSuggestions.map((s) => (
                    <li key={s.market_hash_name}>
                      <button
                        type="button"
                        className="hover:bg-muted/50 flex w-full items-center gap-2 px-3 py-2 text-left text-xs"
                        onClick={() => {
                          onSelectCsgoItem(s.market_hash_name);
                          setSearchQuery("");
                          setCsgoSuggestions([]);
                          setSuggestOpen(false);
                        }}
                      >
                        <span className="text-foreground min-w-0 flex-1 truncate">{s.name}</span>
                      </button>
                    </li>
                  ))
                : suggestions.map((s) => (
                    <li key={s.code}>
                      <button
                        type="button"
                        className="hover:bg-muted/50 flex w-full items-center gap-2 px-3 py-2 text-left text-xs"
                        onClick={() => {
                          onSelectStockCode(s.code);
                          setSearchQuery("");
                          setSuggestions([]);
                          setSuggestOpen(false);
                        }}
                      >
                        <span className="text-foreground min-w-0 flex-1 truncate">{s.name}</span>
                        <span className="text-muted-foreground shrink-0 font-mono tabular-nums">
                          {s.code}
                        </span>
                        <span className="text-muted-foreground/80 w-9 shrink-0 text-right text-[10px]">
                          {s.marketLabel}
                        </span>
                      </button>
                    </li>
                  ))}
            </ul>
          ) : null}
        </div>

        <div className="flex items-center gap-1 text-xs text-down">
          <WifiIcon size={12} />
          <span>{t("topBar.live")}</span>
        </div>

        <div
          className="border-border flex shrink-0 items-center overflow-hidden rounded border text-xs"
          role="group"
          aria-label={t("topBar.langAria")}
        >
          <button
            type="button"
            onClick={() => setLocale("zh")}
            className={`px-2.5 py-1 transition-colors ${
              locale === "zh"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {t("topBar.langZh")}
          </button>
          <button
            type="button"
            onClick={() => setLocale("en")}
            className={`border-border border-l px-2.5 py-1 transition-colors ${
              locale === "en"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {t("topBar.langEn")}
          </button>
        </div>

        <div className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
          <span className="font-medium text-foreground">
            {clockMounted ? timeStr : clockShowSeconds ? "--:--:--" : "--:--"}
          </span>
          <span className="ml-1">{clockMounted ? dateStr : "--/-- --"}</span>
        </div>

        <button type="button" className="relative rounded p-1.5 transition-colors hover:bg-muted">
          <BellIcon size={15} className="text-muted-foreground" />
          <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-up" />
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          className="rounded p-1.5 transition-colors hover:bg-muted"
        >
          <span className={isDark ? "block" : "hidden"}>
            <SunIcon size={15} className="text-muted-foreground" />
          </span>
          <span className={isDark ? "hidden" : "block"}>
            <MoonIcon size={15} className="text-muted-foreground" />
          </span>
        </button>

        <TopBarSettingsMenu
          tickerAnimate={tickerAnimate}
          onTickerAnimateChange={(next) => {
            setTickerAnimate(next);
            writeTickerAnimatePref(next);
          }}
          clockShowSeconds={clockShowSeconds}
          onClockShowSecondsChange={(next) => {
            setClockShowSeconds(next);
            writeClockSecondsPref(next);
          }}
        />
      </div>

      <div className="relative flex h-7 items-center overflow-hidden border-t border-border bg-panel-header">
        <div className="absolute left-0 top-0 z-10 flex h-full w-16 shrink-0 items-center justify-center border-r border-border bg-panel-header">
          <span className="text-xs font-medium text-primary">
            {pathname === ROUTES.csgo ? t("topBar.tickerBannerCsgo") : t("topBar.tickerBanner")}
          </span>
        </div>
        <div className="ml-16 flex-1 overflow-hidden">
          {doubled.length === 0 ? (
            <div className="text-muted-foreground px-2 text-xs">
              {pathname === ROUTES.csgo ? t("topBar.csgoTickerLoading") : t("topBar.indicesLoading")}
            </div>
          ) : (
            <div className={`flex w-max gap-8 ${tickerAnimate ? "ticker-animate" : ""}`}>
              {doubled.map((item, i) => (
                <div key={`${item.label}-${item.price}-${i}`} className="flex shrink-0 items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <span
                    className={`font-mono text-xs font-medium ${item.up ? "text-up" : "text-down"}`}
                  >
                    {item.price}
                  </span>
                  <span className={`font-mono text-xs ${item.up ? "text-up" : "text-down"}`}>
                    {item.changeStr}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

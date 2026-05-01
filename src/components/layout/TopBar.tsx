"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SunIcon,
  MoonIcon,
  BellIcon,
  SearchIcon,
  SettingsIcon,
  WifiIcon,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { useI18n } from "@/contexts/LocaleContext";
import { useTheme } from "@/contexts/ThemeContext";
import type { IndexTickerItem, StockSuggestItem } from "@/types/stock";

const TOP_NAV_DEF = [
  { msg: "topNav.market", href: ROUTES.home },
  { msg: "topNav.watchlist", href: ROUTES.watchlist },
  { msg: "topNav.funds", href: ROUTES.funds },
  { msg: "topNav.research", href: ROUTES.research },
  { msg: "topNav.messages", href: ROUTES.messages },
  { msg: "topNav.settings", href: ROUTES.settings },
] as const;

type TopBarProps = {
  /** 联想选中 6 位 A 股代码后切换主图 */
  onSelectStockCode?: (code: string) => void;
};

/**
 * 顶部导航 + 指数跑马灯（`/api/stock/indices`）+ 股票联想（`/api/stock/suggest`）。
 */
export default function TopBar({ onSelectStockCode = () => {} }: TopBarProps) {
  const { isDark, toggleTheme } = useTheme();
  const { t, locale, setLocale } = useI18n();
  const dateLocale = locale === "zh" ? "zh-CN" : "en-US";
  const pathname = usePathname();
  const [clockMounted, setClockMounted] = useState(false);
  const [time, setTime] = useState(() => new Date());
  const [indices, setIndices] = useState<IndexTickerItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<StockSuggestItem[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setClockMounted(true);
    setTime(new Date());
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/stock/indices`);
        const j: unknown = await res.json();
        const data = (j as { data?: IndexTickerItem[] }).data;
        if (!cancelled && Array.isArray(data)) setIndices(data);
      } catch {
        /* ignore */
      }
    };
    void load();
    const t = setInterval(load, 10000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  /**
   * 输入防抖后请求 `/api/stock/suggest`，空串清空下拉。
   */
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 1) {
      setSuggestions([]);
      return;
    }
    const t = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(
            `/api/stock/suggest?q=${encodeURIComponent(q)}&count=8`,
          );
          const j: unknown = await res.json();
          const data = (j as { data?: StockSuggestItem[] }).data;
          setSuggestions(Array.isArray(data) ? data : []);
        } catch {
          setSuggestions([]);
        }
      })();
    }, 280);
    return () => window.clearTimeout(t);
  }, [searchQuery]);

  /** 点击搜索区域外关闭联想层。 */
  useEffect(() => {
    const onDocDown = (e: MouseEvent) => {
      if (!searchWrapRef.current?.contains(e.target as Node)) setSuggestOpen(false);
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  const timeStr = time.toLocaleTimeString(dateLocale, { hour12: false });
  const dateStr = time.toLocaleDateString(dateLocale, {
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });

  const tickerItems = indices.map((x) => ({
    label: x.name || x.code,
    price:
      x.price >= 1000
        ? x.price.toLocaleString("zh-CN", { maximumFractionDigits: 2 })
        : x.price.toFixed(2),
    changeStr: `${x.changePct >= 0 ? "+" : ""}${x.changePct.toFixed(2)}%`,
    up: x.changePct >= 0,
  }));

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

        <nav className="flex items-center gap-1 text-xs" aria-label={t("topBar.mainNavAria")}>
          {TOP_NAV_DEF.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded px-3 py-1.5 transition-colors ${
                  active
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {t(item.msg)}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        <div ref={searchWrapRef} className="relative w-[min(100%,280px)] shrink-0">
          <div className="flex items-center gap-2 rounded bg-muted px-3 py-1.5">
            <SearchIcon size={12} className="shrink-0 text-muted-foreground" />
            <input
              type="search"
              name="stock-suggest"
              autoComplete="off"
              placeholder={t("topBar.searchPlaceholder")}
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
          {suggestOpen && suggestions.length > 0 ? (
            <ul className="border-border bg-panel absolute right-0 z-50 mt-1 max-h-64 w-full overflow-y-auto rounded border shadow-md">
              {suggestions.map((s) => (
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
            {clockMounted ? timeStr : "--:--:--"}
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

        <button type="button" className="rounded p-1.5 transition-colors hover:bg-muted">
          <SettingsIcon size={15} className="text-muted-foreground" />
        </button>
      </div>

      <div className="relative flex h-7 items-center overflow-hidden border-t border-border bg-panel-header">
        <div className="absolute left-0 top-0 z-10 flex h-full w-16 shrink-0 items-center justify-center border-r border-border bg-panel-header">
          <span className="text-xs font-medium text-primary">{t("topBar.tickerBanner")}</span>
        </div>
        <div className="ml-16 flex-1 overflow-hidden">
          {doubled.length === 0 ? (
            <div className="text-muted-foreground px-2 text-xs">{t("topBar.indicesLoading")}</div>
          ) : (
            <div className="ticker-animate flex w-max gap-8">
              {doubled.map((item, i) => (
                <div key={`${item.label}-${i}`} className="flex shrink-0 items-center gap-1.5">
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

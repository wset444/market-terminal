"use client";

import { useEffect, useState } from "react";
import { BellIcon, ExternalLinkIcon } from "lucide-react";
import { useI18n } from "@/contexts/LocaleContext";
import type { NewsItem } from "@/types/stock";

/** 单次拉取条数上限（与接口 `pageSize` 一致，避免一次渲染过多 DOM） */
const NEWS_FETCH_SIZE = 12;

/**
 * 7×24 快讯：东财 `newsinfo` 列表；列表在面板内滚动，条数有上限。
 */
export default function NewsPanel() {
  const { t } = useI18n();
  const [items, setItems] = useState<NewsItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/stock/news?pageSize=${NEWS_FETCH_SIZE}`);
        const j: unknown = await res.json();
        const data = (j as { data?: NewsItem[] }).data;
        if (!cancelled && Array.isArray(data)) {
          setItems(data.slice(0, NEWS_FETCH_SIZE));
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div data-cmp="NewsPanel" className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-panel-header px-3 py-2">
        <div className="flex items-center gap-1.5">
          <BellIcon size={12} className="text-up" />
          <span className="text-xs font-medium text-foreground">{t("news.title")}</span>
          <span className="rounded-full bg-up px-1.5 py-0.5 text-xs text-white">{items.length}</span>
        </div>
        <a
          className="text-xs text-muted-foreground hover:text-foreground"
          href="https://www.eastmoney.com/"
          target="_blank"
          rel="noreferrer"
        >
          {t("news.homeLink")}
        </a>
      </div>
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
        {items.length === 0 ? (
          <div className="text-muted-foreground px-3 py-2 text-xs">{t("news.loading")}</div>
        ) : (
          items.map((n) => (
            <a
              key={n.id}
              href={n.url}
              target="_blank"
              rel="noreferrer"
              className="group block border-b border-border/50 px-3 py-2 transition-colors hover:bg-muted/30"
            >
              <div className="mb-1 flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">{n.time}</span>
                <span className="rounded bg-primary/15 px-1.5 py-0.5 text-xs text-primary">
                  {t("news.tag")}
                </span>
                <div className="flex-1" />
                <ExternalLinkIcon
                  size={10}
                  className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                />
              </div>
              <p className="line-clamp-2 text-xs leading-relaxed text-foreground">{n.title}</p>
            </a>
          ))
        )}
      </div>
    </div>
  );
}

"use client";

import { ExternalLinkIcon, Link2Icon } from "lucide-react";
import { useI18n } from "@/contexts/LocaleContext";

type FeedItem = {
  id: string;
  href: string;
  titleKey: string;
  hostKey: string;
};

const FEED_ITEMS: FeedItem[] = [
  {
    id: "market",
    href: "https://steamcommunity.com/market/search?appid=730",
    titleKey: "csgo.feedMarketTitle",
    hostKey: "csgo.feedMarketHost",
  },
  {
    id: "status",
    href: "https://store.steampowered.com/stats/",
    titleKey: "csgo.feedStatusTitle",
    hostKey: "csgo.feedStatusHost",
  },
  {
    id: "cs2",
    href: "https://www.counter-strike.net/news",
    titleKey: "csgo.feedNewsTitle",
    hostKey: "csgo.feedNewsHost",
  },
  {
    id: "workshop",
    href: "https://steamcommunity.com/app/730/workshop/",
    titleKey: "csgo.feedWorkshopTitle",
    hostKey: "csgo.feedWorkshopHost",
  },
];

/**
 * CS2 相关外链列表（非东财快讯）；布局对齐 `NewsPanel`。
 */
export default function CsgoMarketFeedPanel() {
  const { t } = useI18n();

  return (
    <div data-cmp="CsgoMarketFeedPanel" className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="border-border bg-panel-header flex shrink-0 items-center justify-between border-b px-3 py-2">
        <div className="flex min-w-0 shrink-0 items-center gap-1.5">
          <Link2Icon size={12} className="shrink-0 text-primary" />
          <span className="text-xs font-medium text-foreground">{t("csgo.feedTitle")}</span>
          <span className="shrink-0 rounded-full bg-primary/20 px-1.5 py-0.5 text-xs leading-none text-primary">
            {FEED_ITEMS.length}
          </span>
        </div>
      </div>
      <p className="text-muted-foreground shrink-0 border-b border-border/50 px-3 py-1.5 text-[10px] leading-snug">
        {t("csgo.feedHint")}
      </p>
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
        {FEED_ITEMS.map((item) => (
          <a
            key={item.id}
            href={item.href}
            target="_blank"
            rel="noreferrer"
            className="group block border-b border-border/50 px-3 py-2 transition-colors hover:bg-muted/30"
          >
            <div className="mb-1 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{t(item.hostKey)}</span>
              <div className="flex-1" />
              <ExternalLinkIcon
                size={10}
                className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
              />
            </div>
            <p className="line-clamp-2 text-xs leading-relaxed text-foreground">{t(item.titleKey)}</p>
          </a>
        ))}
      </div>
    </div>
  );
}

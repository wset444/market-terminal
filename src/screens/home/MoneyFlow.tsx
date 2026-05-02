"use client";

import { useCallback, useEffect, useState } from "react";
import { useGlobalRefresh } from "@/contexts/GlobalRefreshContext";
import { useI18n } from "@/contexts/LocaleContext";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { FflowDaySummary, FflowMinutePoint } from "@/types/stock";

type MoneyFlowProps = {
  code: string;
};

/** 资金流向自动拉取间隔（ms），与 `TradeList` 一致为 120s */
const FFLOW_POLL_MS = 120_000;

/**
 * 将「元」按 1e8（亿 / 100M 量级）格式化，后缀由词典 `units.yiShort` 提供。
 *
 * @param yuan - 金额（元）
 * @param unit - 量级后缀，如中文「亿」或英文「100M」
 * @returns 带符号与两位小数的展示字符串
 */
function fmtYi(yuan: number, unit: string): string {
  const y = yuan / 1e8;
  return `${y >= 0 ? "+" : ""}${y.toFixed(2)}${unit}`;
}

/**
 * 资金流向：分时主力净额曲线 + 日汇总（东财 fflow 接口）。
 * 自动每 **120s** 拉取；顶栏「刷新全部」通过 `GlobalRefreshContext` 也会触发重拉。
 */
export default function MoneyFlow({ code }: MoneyFlowProps) {
  const { t } = useI18n();
  const { generation } = useGlobalRefresh();
  const yiUnit = t("units.yiShort");
  const [intraday, setIntraday] = useState<FflowMinutePoint[]>([]);
  const [day, setDay] = useState<FflowDaySummary | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/stock/fflow?code=${encodeURIComponent(code)}&lmt=48`);
      const j: unknown = await res.json();
      if (!res.ok) return;
      const intr = (j as { intraday?: FflowMinutePoint[] }).intraday;
      const d = (j as { day?: FflowDaySummary | null }).day;
      if (Array.isArray(intr)) setIntraday(intr);
      if (d) setDay(d);
    } catch {
      /* ignore */
    }
  }, [code]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (cancelled) return;
      await load();
    };
    void run();
    const id = window.setInterval(() => {
      if (!cancelled) void load();
    }, FFLOW_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [code, generation, load]);

  const chartData = intraday.map((p) => ({
    t: p.timeLabel.length > 11 ? p.timeLabel.slice(11, 16) : p.timeLabel,
    netWan: p.mainNetYuan / 10000,
  }));

  return (
    <div data-cmp="MoneyFlow" className="flex h-full min-h-0 flex-col">
      <div className="border-border bg-panel-header flex shrink-0 items-center justify-between border-b px-3 py-2">
        <span className="shrink-0 text-xs font-medium text-foreground">{t("moneyFlow.title")}</span>
        <span className="max-w-[min(14rem,50vw)] truncate text-xs text-muted-foreground">
          {t("moneyFlow.subtitle")}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-4 border-b border-border px-3 py-2">
        <div>
          <div className="text-xs text-muted-foreground">{t("moneyFlow.dayMain")}</div>
          <div
            className={`font-mono text-base font-bold ${(day?.mainNetYuan ?? 0) >= 0 ? "text-up" : "text-down"}`}
          >
            {day ? fmtYi(day.mainNetYuan, yiUnit) : `—`}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{t("moneyFlow.retailEst")}</div>
          <div
            className={`font-mono text-sm font-medium ${(day?.retailNetYuan ?? 0) >= 0 ? "text-up" : "text-down"}`}
          >
            {day ? fmtYi(day.retailNetYuan, yiUnit) : `—`}
          </div>
        </div>
      </div>

      <div className="min-h-[100px] shrink-0 px-1 py-1" style={{ height: 100 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="fflowGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f04e35" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f04e35" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="t"
              tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 4,
                fontSize: 10,
              }}
            />
            <Area
              type="monotone"
              dataKey="netWan"
              stroke="#f04e35"
              fill="url(#fflowGrad)"
              strokeWidth={1.2}
              dot={false}
              name={t("moneyFlow.seriesName")}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="text-muted-foreground flex min-h-0 flex-1 px-3 py-2 text-xs leading-relaxed">
        {t("moneyFlow.disclaimer")}
      </div>
    </div>
  );
}

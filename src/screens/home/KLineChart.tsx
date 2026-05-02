"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useGlobalRefresh } from "@/contexts/GlobalRefreshContext";
import { useI18n } from "@/contexts/LocaleContext";
import type { KlineBar } from "@/types/stock";

const MA_COLORS = {
  ma5: "#f59e0b",
  ma10: "#3b82f6",
  ma20: "#a855f7",
  ma60: "#06b6d4",
};

/** MA 指标条固定高度（px），与下方 `height` 相加为组件总占位高度，避免加载/有数据时布局跳动 */
const MA_TOOLBAR_PX = 40;

/**
 * 主图下沿与成交量带之间的留白（px）。
 * 1. 与 `chartH` 计算中的扣减一致，保证总高度不变。
 * 2. 略宽于旧版 8px，减轻左侧最低价数字与成交量区域视觉挤在一起的问题。
 */
const VOL_GAP = 12;

/**
 * 成交量带内部的顶部留白（px）。
 * 1. 成交量纵轴从该留白之下开始映射，柱顶不再顶满到主图分隔线。
 * 2. 为左上角「量」等标签留出垂直空间，避免贴边。
 */
const VOL_INNER_TOP = 8;

function calcMA(closes: number[], period: number): (number | null)[] {
  return closes.map((_, i) => {
    if (i < period - 1) return null;
    const slice = closes.slice(i - period + 1, i + 1);
    return +(slice.reduce((s, c) => s + c, 0) / period).toFixed(2);
  });
}

type KLineChartProps = {
  code: string;
  /** 东财 klt：1=1分 5=5分 … 101日 102周 103月（`source=steam` 时忽略） */
  klt: number;
  height?: number;
  /** `steam`：`code` 视为 `market_hash_name`，走 `/api/csgo/kline` */
  source?: "eastmoney" | "steam";
};

/**
 * K 线：拉取 `/api/stock/kline` 真实 OHLCV，在前端绘制 MA 与成交量柱。
 */
export default function KLineChart({
  code,
  klt,
  height = 380,
  source = "eastmoney",
}: KLineChartProps) {
  const { t } = useI18n();
  const { generation } = useGlobalRefresh();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [bars, setBars] = useState<KlineBar[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [steamEmptyHint, setSteamEmptyHint] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setBars([]);
    setLoadErr(null);
    setSteamEmptyHint(false);
    void (async () => {
      try {
        if (source === "steam") {
          const res = await fetch(
            `/api/csgo/kline?market_hash_name=${encodeURIComponent(code)}`,
          );
          const j: unknown = await res.json();
          if (!res.ok) {
            setLoadErr(
              typeof j === "object" && j && "error" in j
                ? String((j as { error: string }).error)
                : "__LOAD_FAILED__",
            );
            setBars([]);
            return;
          }
          const data = (j as { data?: KlineBar[] }).data;
          const arr = Array.isArray(data) ? data : [];
          if (!cancelled) {
            setBars(arr);
            setSteamEmptyHint(arr.length === 0);
          }
          return;
        }

        const res = await fetch(
          `/api/stock/kline?code=${encodeURIComponent(code)}&klt=${klt}&limit=180`,
        );
        const j: unknown = await res.json();
        if (!res.ok) {
          setLoadErr(
            typeof j === "object" && j && "error" in j
              ? String((j as { error: string }).error)
              : "__LOAD_FAILED__",
          );
          setBars([]);
          return;
        }
        const data = (j as { data?: KlineBar[] }).data;
        if (!cancelled) setBars(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) {
          setLoadErr("__NETWORK__");
          setBars([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, klt, source, generation]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setContainerWidth(w);
    };
    measure();
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      if (w > 0) setContainerWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [code, klt]);

  const padLeft = 52;
  const padRight = 16;
  const padTop = 16;
  /** 略增高，为 X 轴日期留出垂直空间 */
  const padBottom = 32;
  const volHeight = 64;
  const chartH = height - padTop - padBottom - volHeight - VOL_GAP;
  const volBandTop = padTop + chartH + VOL_GAP;
  const volDrawH = volHeight - VOL_INNER_TOP;
  const n = bars.length;
  const W = containerWidth > 8 ? containerWidth : 0;

  const closes = bars.map((b) => b.close);
  const ma5 = calcMA(closes, 5);
  const ma10 = calcMA(closes, 10);
  const ma20 = calcMA(closes, 20);
  const ma60 = calcMA(closes, 60);

  const maxP = n ? Math.max(...bars.map((c) => c.high), 1) : 1;
  const minP = n ? Math.min(...bars.map((c) => c.low), maxP - 1e-6) : 0;
  const maxV = n ? Math.max(...bars.map((c) => c.volume), 1) : 1;

  const scaleY = (v: number) => padTop + (1 - (v - minP) / (maxP - minP || 1)) * chartH;
  const scaleVY = (v: number) =>
    volBandTop + VOL_INNER_TOP + (1 - v / maxV) * volDrawH;

  const plotW = W > 0 ? W : 1;
  const step = n > 0 ? (plotW - padLeft - padRight) / n : 1;
  const candleW = n > 0 ? Math.max(2, Math.floor(step * 0.65)) : 3;
  const cx = (i: number) => padLeft + i * step + step / 2;

  const buildMAPath = (mas: (number | null)[]) => {
    const pts = mas.map((v, i) => (v !== null ? `${cx(i)},${scaleY(v)}` : null));
    let d = "";
    pts.forEach((pt, i) => {
      if (!pt) return;
      if (!pts[i - 1]) d += `M${pt} `;
      else d += `L${pt} `;
    });
    return d;
  };

  const priceLabels = Array.from({ length: 5 }, (_, i) =>
    +(minP + ((maxP - minP) * i) / 4).toFixed(2),
  );

  const hovered = hoveredIndex !== null && bars[hoveredIndex] ? bars[hoveredIndex] : null;
  const hi = hoveredIndex;

  /**
   * X 轴日期刻度：相邻标签中心至少间隔 `minGapPx`，避免末尾「日 K」等场景下最后两根与上一刻度重叠。
   * A 股与 CS2 共用本组件，故此处统一处理。
   */
  const xTickIndices = (() => {
    const minGapPx = 46;
    if (n <= 0 || W <= 0) return [] as number[];
    if (n === 1) return [0];
    const innerW = plotW - padLeft - padRight;
    const approx = Math.max(2, Math.min(n, Math.floor(innerW / minGapPx)));
    const stride = Math.max(1, Math.ceil((n - 1) / (approx - 1)));
    const out: number[] = [];
    for (let i = 0; i < n; i += stride) out.push(i);
    const last = n - 1;
    const lastPlaced = out[out.length - 1]!;
    if (lastPlaced !== last) {
      if (cx(last) - cx(lastPlaced) >= minGapPx) out.push(last);
      else out[out.length - 1] = last;
    }
    return out;
  })();
  const xTickSet = new Set(xTickIndices);

  const fmtVol = (v: number) =>
    v >= 10000 ? `${(v / 10000).toFixed(1)}${t("kline.wan")}` : `${v.toFixed(0)}`;

  const errText =
    loadErr === "__NETWORK__"
      ? t("kline.networkErr")
      : loadErr === "__LOAD_FAILED__"
        ? t("kline.loadFailed")
        : loadErr;

  const showChart = !loadErr && n > 0;
  const showErrOnly = Boolean(loadErr && n === 0);
  const showLoadingOrEmpty = !loadErr && n === 0;

  return (
    <div
      data-cmp="KLineChart"
      className="bg-panel flex w-full min-w-0 flex-col"
      style={{ minHeight: height + MA_TOOLBAR_PX }}
    >
      <div
        className="border-border flex h-10 shrink-0 flex-wrap items-center gap-3 border-b px-3 text-xs"
        aria-hidden={!showChart}
      >
        {(["MA5", "MA10", "MA20", "MA60"] as const).map((label, i) => {
          const colorKey = (["ma5", "ma10", "ma20", "ma60"] as const)[i];
          const series = [ma5, ma10, ma20, ma60][i];
          return (
            <div key={label} className="flex items-center gap-1">
              <div className="h-0.5 w-5 rounded" style={{ backgroundColor: MA_COLORS[colorKey] }} />
              <span style={{ color: MA_COLORS[colorKey] }}>{label}</span>
              {hovered && hi !== null && (
                <span style={{ color: MA_COLORS[colorKey] }}>
                  {series[hi]?.toFixed(2) ?? `-`}
                </span>
              )}
            </div>
          );
        })}
        {hovered && (
          <div className="ml-auto flex items-center gap-3 text-muted-foreground">
            <span>
              {t("kline.open")}:<span className="ml-0.5 text-foreground">{hovered.open}</span>
            </span>
            <span>
              {t("kline.close")}:
              <span
                className={`ml-0.5 ${hovered.close >= hovered.open ? "text-up" : "text-down"}`}
              >
                {hovered.close}
              </span>
            </span>
            <span>
              {t("kline.high")}:<span className="ml-0.5 text-up">{hovered.high}</span>
            </span>
            <span>
              {t("kline.low")}:<span className="ml-0.5 text-down">{hovered.low}</span>
            </span>
            <span>
              {t("kline.vol")}:<span className="ml-0.5 text-foreground">{fmtVol(hovered.volume)}</span>
            </span>
          </div>
        )}
      </div>

      <div
        ref={containerRef}
        className="relative w-full min-w-0 shrink-0 overflow-hidden"
        style={{ height }}
      >
        {showErrOnly ? (
          <div className="text-destructive flex h-full w-full items-center justify-center px-4 text-center text-sm">
            <span>
              {t("kline.loadErr")}
              {errText}
            </span>
          </div>
        ) : null}

        {showLoadingOrEmpty ? (
          <div className="text-muted-foreground absolute inset-0 flex flex-col items-center justify-center gap-1 px-4 text-center text-sm">
            <span>{steamEmptyHint ? t("csgo.chartNoHistory") : t("kline.loading")}</span>
            {steamEmptyHint ? (
              <span className="text-muted-foreground/80 max-w-md text-xs">{t("csgo.chartNoHistoryHint")}</span>
            ) : null}
          </div>
        ) : null}

        {showChart && W <= 0 ? (
          <div className="bg-muted/10 text-muted-foreground flex h-full w-full items-center justify-center text-xs">
            {t("kline.init")}
          </div>
        ) : null}

        {showChart && W > 0 ? (
        <svg
          ref={svgRef}
          width={W}
          height={height}
          className="block"
          onMouseLeave={() => setHoveredIndex(null)}
          onMouseMove={(e) => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect || n === 0 || W <= 0) return;
            const svgEl = svgRef.current;
            const scaleX = svgEl ? svgEl.getBoundingClientRect().width / W : 1;
            const x = (e.clientX - rect.left) / (scaleX || 1) - padLeft;
            const idx = Math.round(x / step - 0.5);
            setHoveredIndex(idx >= 0 && idx < n ? idx : null);
          }}
        >
          {priceLabels.map((v) => {
            const y = scaleY(v);
            return (
              <g key={`grid-${v}`}>
                <line
                  x1={padLeft}
                  x2={plotW - padRight}
                  y1={y}
                  y2={y}
                  stroke="var(--border)"
                  strokeWidth={0.5}
                  strokeDasharray="3,3"
                />
                <text
                  x={padLeft - 4}
                  y={y + 4}
                  textAnchor="end"
                  fontSize={10}
                  fill="var(--muted-foreground)"
                >
                  {v}
                </text>
              </g>
            );
          })}

          <path d={buildMAPath(ma5)} fill="none" stroke={MA_COLORS.ma5} strokeWidth={1} />
          <path d={buildMAPath(ma10)} fill="none" stroke={MA_COLORS.ma10} strokeWidth={1} />
          <path d={buildMAPath(ma20)} fill="none" stroke={MA_COLORS.ma20} strokeWidth={1} />
          <path
            d={buildMAPath(ma60)}
            fill="none"
            stroke={MA_COLORS.ma60}
            strokeWidth={0.8}
            strokeDasharray="4,2"
          />

          {bars.map((c, i) => {
            const isUp = c.close >= c.open;
            const color = isUp ? "var(--up)" : "var(--down)";
            const x = cx(i);
            const bodyTop = scaleY(Math.max(c.open, c.close));
            const bodyBot = scaleY(Math.min(c.open, c.close));
            const bodyH = Math.max(1, bodyBot - bodyTop);
            return (
              <g key={`${c.date}-${i}`} className="candle-bar">
                <line
                  x1={x}
                  x2={x}
                  y1={scaleY(c.high)}
                  y2={scaleY(c.low)}
                  stroke={color}
                  strokeWidth={1}
                />
                <rect
                  x={x - candleW / 2}
                  y={bodyTop}
                  width={candleW}
                  height={bodyH}
                  fill={isUp ? "var(--up)" : "var(--down)"}
                  opacity={hoveredIndex === i ? 0.85 : 1}
                />
                <rect
                  x={x - candleW / 2}
                  y={scaleVY(c.volume)}
                  width={candleW}
                  height={volBandTop + volHeight - scaleVY(c.volume)}
                  fill={color}
                  opacity={0.5}
                />
              </g>
            );
          })}

          {bars.map((c, i) => {
            if (!xTickSet.has(i)) return null;
            const short = c.date.length > 10 ? c.date.slice(5, 10) : c.date.slice(5);
            return (
              <text
                key={`lbl-${i}`}
                x={cx(i)}
                y={volBandTop + volHeight + 14}
                textAnchor="middle"
                fontSize={10}
                fill="var(--muted-foreground)"
              >
                {short}
              </text>
            );
          })}

          <text
            x={padLeft - 4}
            y={volBandTop + VOL_INNER_TOP + 4}
            textAnchor="end"
            fontSize={9}
            fill="var(--muted-foreground)"
          >
            {t("kline.volAxis")}
          </text>

          {hoveredIndex !== null && bars[hoveredIndex] && (
            <g>
              <line
                x1={cx(hoveredIndex)}
                x2={cx(hoveredIndex)}
                y1={padTop}
                y2={volBandTop + volHeight}
                stroke="var(--muted-foreground)"
                strokeWidth={0.8}
                strokeDasharray="3,2"
              />
              <line
                x1={padLeft}
                x2={plotW - padRight}
                y1={scaleY(bars[hoveredIndex].close)}
                y2={scaleY(bars[hoveredIndex].close)}
                stroke="var(--muted-foreground)"
                strokeWidth={0.8}
                strokeDasharray="3,2"
              />
              <rect
                x={plotW - padRight - 48}
                y={scaleY(bars[hoveredIndex].close) - 9}
                width={46}
                height={16}
                rx={2}
                fill="var(--primary)"
              />
              <text
                x={plotW - padRight - 25}
                y={scaleY(bars[hoveredIndex].close) + 4}
                textAnchor="middle"
                fontSize={9}
                fill="white"
              >
                {bars[hoveredIndex].close}
              </text>
            </g>
          )}
        </svg>
        ) : null}
      </div>
    </div>
  );
}

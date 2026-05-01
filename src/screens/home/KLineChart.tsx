"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useI18n } from "@/contexts/LocaleContext";
import type { KlineBar } from "@/types/stock";

const MA_COLORS = {
  ma5: "#f59e0b",
  ma10: "#3b82f6",
  ma20: "#a855f7",
  ma60: "#06b6d4",
};

function calcMA(closes: number[], period: number): (number | null)[] {
  return closes.map((_, i) => {
    if (i < period - 1) return null;
    const slice = closes.slice(i - period + 1, i + 1);
    return +(slice.reduce((s, c) => s + c, 0) / period).toFixed(2);
  });
}

type KLineChartProps = {
  code: string;
  /** 东财 klt：1=1分 5=5分 … 101日 102周 103月 */
  klt: number;
  height?: number;
};

/**
 * K 线：拉取 `/api/stock/kline` 真实 OHLCV，在前端绘制 MA 与成交量柱。
 */
export default function KLineChart({ code, klt, height = 380 }: KLineChartProps) {
  const { t } = useI18n();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [bars, setBars] = useState<KlineBar[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoadErr(null);
    void (async () => {
      try {
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
  }, [code, klt]);

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
  }, [code, klt, bars.length]);

  const padLeft = 52;
  const padRight = 16;
  const padTop = 16;
  const padBottom = 28;
  const volHeight = 64;
  const chartH = height - padTop - padBottom - volHeight - 8;
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
  const scaleVY = (v: number) => padTop + chartH + 8 + (1 - v / maxV) * volHeight;

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

  const labelStride = n > 0 ? Math.max(1, Math.floor(n / 8)) : 1;

  const fmtVol = (v: number) =>
    v >= 10000 ? `${(v / 10000).toFixed(1)}${t("kline.wan")}` : `${v.toFixed(0)}`;

  const errText =
    loadErr === "__NETWORK__"
      ? t("kline.networkErr")
      : loadErr === "__LOAD_FAILED__"
        ? t("kline.loadFailed")
        : loadErr;

  if (loadErr && n === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-destructive" style={{ height }}>
        {t("kline.loadErr")}
        {errText}
      </div>
    );
  }

  if (n === 0) {
    return (
      <div className="text-muted-foreground flex items-center justify-center text-sm" style={{ height }}>
        {t("kline.loading")}
      </div>
    );
  }

  return (
    <div data-cmp="KLineChart" className="flex w-full min-w-0 flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border px-3 py-1.5 text-xs">
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

      <div ref={containerRef} className="relative w-full min-w-0" style={{ height }}>
        {W <= 0 ? (
          <div className="bg-muted/10 text-muted-foreground flex h-full w-full items-center justify-center text-xs">
            {t("kline.init")}
          </div>
        ) : (
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
                  height={padTop + chartH + 8 + volHeight - scaleVY(c.volume)}
                  fill={color}
                  opacity={0.5}
                />
              </g>
            );
          })}

          {bars.map((c, i) => {
            if (i % labelStride !== 0 && i !== n - 1) return null;
            const short = c.date.length > 10 ? c.date.slice(5, 10) : c.date.slice(5);
            return (
              <text
                key={`lbl-${i}`}
                x={cx(i)}
                y={padTop + chartH + 8 + volHeight + 14}
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
            y={padTop + chartH + 12}
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
                y2={padTop + chartH + 8 + volHeight}
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
        )}
      </div>
    </div>
  );
}

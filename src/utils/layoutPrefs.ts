/** `localStorage` 键：A 股看盘左栏（五档 + 涨幅榜）宽度（px 数字字符串） */
export const STOCK_LAYOUT_LEFT_COL_KEY = "react-ai-stock-left-col-w";

/** `localStorage` 键：A 股看盘右栏（资金/逐笔）宽度（px 数字字符串） */
export const STOCK_LAYOUT_RIGHT_COL_KEY = "react-ai-stock-right-col-w";

/** 左栏默认、最小、最大宽度（px） */
export const STOCK_LEFT_COL_DEFAULT = 180;
export const STOCK_LEFT_COL_MIN = 120;
export const STOCK_LEFT_COL_MAX = 380;

/** 右栏默认、最小、最大宽度（px） */
export const STOCK_RIGHT_COL_DEFAULT = 240;
export const STOCK_RIGHT_COL_MIN = 200;
export const STOCK_RIGHT_COL_MAX = 480;

/**
 * 步骤：
 * 1. 读 `STOCK_LAYOUT_LEFT_COL_KEY`，解析为整数。
 * 2. 非有限数或越界时返回 `null`，由调用方用默认值。
 */
export function readStockLeftColWidth(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STOCK_LAYOUT_LEFT_COL_KEY);
  const n = raw === null ? NaN : Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return null;
  if (n < STOCK_LEFT_COL_MIN || n > STOCK_LEFT_COL_MAX) return null;
  return n;
}

/**
 * 步骤：同 `readStockLeftColWidth`，键为右栏。
 */
export function readStockRightColWidth(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STOCK_LAYOUT_RIGHT_COL_KEY);
  const n = raw === null ? NaN : Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return null;
  if (n < STOCK_RIGHT_COL_MIN || n > STOCK_RIGHT_COL_MAX) return null;
  return n;
}

/**
 * 步骤：将宽度写入对应键；非浏览器或越界时静默忽略。
 *
 * @param widthPx - 左栏宽度
 */
export function writeStockLeftColWidth(widthPx: number): void {
  if (typeof window === "undefined") return;
  const n = Math.round(widthPx);
  if (n < STOCK_LEFT_COL_MIN || n > STOCK_LEFT_COL_MAX) return;
  window.localStorage.setItem(STOCK_LAYOUT_LEFT_COL_KEY, String(n));
}

/**
 * 步骤：同 `writeStockLeftColWidth`，写入右栏。
 *
 * @param widthPx - 右栏宽度
 */
export function writeStockRightColWidth(widthPx: number): void {
  if (typeof window === "undefined") return;
  const n = Math.round(widthPx);
  if (n < STOCK_RIGHT_COL_MIN || n > STOCK_RIGHT_COL_MAX) return;
  window.localStorage.setItem(STOCK_LAYOUT_RIGHT_COL_KEY, String(n));
}

/** A 股左栏：五档区高度（px），其下为涨幅榜（flex 占满剩余） */
export const STOCK_LEFT_ORDERBOOK_H_KEY = "react-ai-stock-left-orderbook-h";

export const STOCK_ORDERBOOK_H_DEFAULT = 260;
export const STOCK_ORDERBOOK_H_MIN = 100;
export const STOCK_ORDERBOOK_H_MAX = 420;

/**
 * 步骤：
 * 1. 读 `STOCK_LEFT_ORDERBOOK_H_KEY`，解析为整数。
 * 2. 非有限数或越界时返回 `null`，由调用方用默认值。
 */
export function readStockOrderbookHeight(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STOCK_LEFT_ORDERBOOK_H_KEY);
  const n = raw === null ? NaN : Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < STOCK_ORDERBOOK_H_MIN || n > STOCK_ORDERBOOK_H_MAX) {
    return null;
  }
  return n;
}

/**
 * 步骤：将左栏五档区高度写入 `STOCK_LEFT_ORDERBOOK_H_KEY`；非浏览器或越界时静默忽略。
 *
 * @param px - 五档区域高度（px）
 */
export function writeStockOrderbookHeight(px: number): void {
  if (typeof window === "undefined") return;
  const n = Math.round(px);
  if (n < STOCK_ORDERBOOK_H_MIN || n > STOCK_ORDERBOOK_H_MAX) return;
  window.localStorage.setItem(STOCK_LEFT_ORDERBOOK_H_KEY, String(n));
}

/** A 股右栏：资金流向区高度（px），其下为逐笔（flex 占满剩余） */
export const STOCK_RIGHT_MONEY_FLOW_H_KEY = "react-ai-stock-right-moneyflow-h";

export const STOCK_RIGHT_MONEY_FLOW_H_DEFAULT = 265;
export const STOCK_RIGHT_MONEY_FLOW_H_MIN = 200;
export const STOCK_RIGHT_MONEY_FLOW_H_MAX = 520;

/**
 * 步骤：
 * 1. 读 `STOCK_RIGHT_MONEY_FLOW_H_KEY`，解析为整数。
 * 2. 非有限数或越界时返回 `null`。
 */
export function readStockRightMoneyFlowHeight(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STOCK_RIGHT_MONEY_FLOW_H_KEY);
  const n = raw === null ? NaN : Number.parseInt(raw, 10);
  if (
    !Number.isFinite(n) ||
    n < STOCK_RIGHT_MONEY_FLOW_H_MIN ||
    n > STOCK_RIGHT_MONEY_FLOW_H_MAX
  ) {
    return null;
  }
  return n;
}

/**
 * 步骤：写入右栏资金流向区高度；非浏览器或越界时静默忽略。
 *
 * @param px - 资金流向区域高度（px）
 */
export function writeStockRightMoneyFlowHeight(px: number): void {
  if (typeof window === "undefined") return;
  const n = Math.round(px);
  if (n < STOCK_RIGHT_MONEY_FLOW_H_MIN || n > STOCK_RIGHT_MONEY_FLOW_H_MAX) return;
  window.localStorage.setItem(STOCK_RIGHT_MONEY_FLOW_H_KEY, String(n));
}

/** CS2 看板左栏（五档占位）`localStorage` 键 */
export const CSGO_LAYOUT_LEFT_COL_KEY = "react-ai-csgo-left-col-w";

/** CS2 看板右栏（挂牌/逐笔/热门）`localStorage` 键 */
export const CSGO_LAYOUT_RIGHT_COL_KEY = "react-ai-csgo-right-col-w";

export const CSGO_LEFT_COL_DEFAULT = 180;
export const CSGO_LEFT_COL_MIN = 120;
export const CSGO_LEFT_COL_MAX = 380;

export const CSGO_RIGHT_COL_DEFAULT = 240;
export const CSGO_RIGHT_COL_MIN = 200;
export const CSGO_RIGHT_COL_MAX = 480;

/** 读 CS2 左栏宽度（px），非法返回 `null` */
export function readCsgoLeftColWidth(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(CSGO_LAYOUT_LEFT_COL_KEY);
  const n = raw === null ? NaN : Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < CSGO_LEFT_COL_MIN || n > CSGO_LEFT_COL_MAX) return null;
  return n;
}

/** 读 CS2 右栏宽度（px），非法返回 `null` */
export function readCsgoRightColWidth(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(CSGO_LAYOUT_RIGHT_COL_KEY);
  const n = raw === null ? NaN : Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < CSGO_RIGHT_COL_MIN || n > CSGO_RIGHT_COL_MAX) return null;
  return n;
}

/** 写 CS2 左栏宽度（px） */
export function writeCsgoLeftColWidth(widthPx: number): void {
  if (typeof window === "undefined") return;
  const n = Math.round(widthPx);
  if (n < CSGO_LEFT_COL_MIN || n > CSGO_LEFT_COL_MAX) return;
  window.localStorage.setItem(CSGO_LAYOUT_LEFT_COL_KEY, String(n));
}

/** 写 CS2 右栏宽度（px） */
export function writeCsgoRightColWidth(widthPx: number): void {
  if (typeof window === "undefined") return;
  const n = Math.round(widthPx);
  if (n < CSGO_RIGHT_COL_MIN || n > CSGO_RIGHT_COL_MAX) return;
  window.localStorage.setItem(CSGO_LAYOUT_RIGHT_COL_KEY, String(n));
}

/** CS2 左栏：盘口区高度（px） */
export const CSGO_LEFT_ORDERBOOK_H_KEY = "react-ai-csgo-left-orderbook-h";
/** CS2 左栏：逐笔占位区高度（px） */
export const CSGO_LEFT_TICKS_H_KEY = "react-ai-csgo-left-ticks-h";

export const CSGO_ORDERBOOK_H_DEFAULT = 200;
export const CSGO_ORDERBOOK_H_MIN = 100;
export const CSGO_ORDERBOOK_H_MAX = 380;

export const CSGO_TICKS_STUB_H_DEFAULT = 260;
export const CSGO_TICKS_STUB_H_MIN = 72;
export const CSGO_TICKS_STUB_H_MAX = 420;

export function readCsgoOrderbookHeight(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(CSGO_LEFT_ORDERBOOK_H_KEY);
  const n = raw === null ? NaN : Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < CSGO_ORDERBOOK_H_MIN || n > CSGO_ORDERBOOK_H_MAX) return null;
  return n;
}

export function readCsgoTicksStubHeight(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(CSGO_LEFT_TICKS_H_KEY);
  const n = raw === null ? NaN : Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < CSGO_TICKS_STUB_H_MIN || n > CSGO_TICKS_STUB_H_MAX) return null;
  return n;
}

export function writeCsgoOrderbookHeight(px: number): void {
  if (typeof window === "undefined") return;
  const n = Math.round(px);
  if (n < CSGO_ORDERBOOK_H_MIN || n > CSGO_ORDERBOOK_H_MAX) return;
  window.localStorage.setItem(CSGO_LEFT_ORDERBOOK_H_KEY, String(n));
}

export function writeCsgoTicksStubHeight(px: number): void {
  if (typeof window === "undefined") return;
  const n = Math.round(px);
  if (n < CSGO_TICKS_STUB_H_MIN || n > CSGO_TICKS_STUB_H_MAX) return;
  window.localStorage.setItem(CSGO_LEFT_TICKS_H_KEY, String(n));
}

/** CS2 右栏：挂牌概况区高度（px），其下为分时成交（flex 占满剩余） */
export const CSGO_RIGHT_LISTING_H_KEY = "react-ai-csgo-right-listing-h";

export const CSGO_RIGHT_LISTING_H_DEFAULT = 265;
export const CSGO_RIGHT_LISTING_H_MIN = 140;
export const CSGO_RIGHT_LISTING_H_MAX = 520;

/**
 * 步骤：
 * 1. 读 `CSGO_RIGHT_LISTING_H_KEY`，解析为整数。
 * 2. 非有限数或越界时返回 `null`，由调用方用默认值。
 */
export function readCsgoRightListingHeight(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(CSGO_RIGHT_LISTING_H_KEY);
  const n = raw === null ? NaN : Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < CSGO_RIGHT_LISTING_H_MIN || n > CSGO_RIGHT_LISTING_H_MAX) {
    return null;
  }
  return n;
}

/**
 * 步骤：将右栏挂牌区高度写入 `CSGO_RIGHT_LISTING_H_KEY`；非浏览器或越界时静默忽略。
 *
 * @param px - 挂牌概况区域高度（px）
 */
export function writeCsgoRightListingHeight(px: number): void {
  if (typeof window === "undefined") return;
  const n = Math.round(px);
  if (n < CSGO_RIGHT_LISTING_H_MIN || n > CSGO_RIGHT_LISTING_H_MAX) return;
  window.localStorage.setItem(CSGO_RIGHT_LISTING_H_KEY, String(n));
}

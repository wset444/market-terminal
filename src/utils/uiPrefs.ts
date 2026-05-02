/** `localStorage` 键：顶栏跑马灯是否使用横向滚动动画（`true` / `false` 字符串） */
export const UI_PREF_TICKER_ANIMATE_KEY = "react-ai-ui-ticker-animate";

/** `localStorage` 键：顶栏时钟是否显示秒（`true` / `false` 字符串） */
export const UI_PREF_CLOCK_SECONDS_KEY = "react-ai-ui-clock-seconds";

/**
 * 步骤：
 * 1. 在浏览器环境读取 `UI_PREF_TICKER_ANIMATE_KEY`。
 * 2. 值为 `"false"` 时返回 `false`，否则返回 `true`（含缺失、非法值）。
 *
 * @returns 是否启用跑马灯滚动动画
 */
export function readTickerAnimatePref(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(UI_PREF_TICKER_ANIMATE_KEY) !== "false";
}

/**
 * 步骤：
 * 1. 将布尔写入 `UI_PREF_TICKER_ANIMATE_KEY`，存 `"true"` 或 `"false"` 字符串。
 * 2. 非浏览器环境直接返回。
 *
 * @param enabled - 是否启用跑马灯滚动动画
 */
export function writeTickerAnimatePref(enabled: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(UI_PREF_TICKER_ANIMATE_KEY, enabled ? "true" : "false");
}

/**
 * 步骤：
 * 1. 在浏览器环境读取 `UI_PREF_CLOCK_SECONDS_KEY`。
 * 2. 值为 `"false"` 时返回 `false`，否则返回 `true`。
 *
 * @returns 顶栏时钟是否显示秒
 */
export function readClockSecondsPref(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(UI_PREF_CLOCK_SECONDS_KEY) !== "false";
}

/**
 * 步骤：
 * 1. 将布尔写入 `UI_PREF_CLOCK_SECONDS_KEY`。
 * 2. 非浏览器环境直接返回。
 *
 * @param show - 是否显示秒
 */
export function writeClockSecondsPref(show: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(UI_PREF_CLOCK_SECONDS_KEY, show ? "true" : "false");
}

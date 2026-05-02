import type { AppLocale } from "@/i18n/dictionaries";

/**
 * 1. 将应用内 `AppLocale` 映射为 `Intl` 使用的 BCP 47 区域标签。
 * 2. `zh` → `zh-CN`（与顶栏时钟、数字分组等一致）。
 * 3. 其余语言暂映射为 `en-US`。
 */
export function appLocaleToDateLocale(locale: AppLocale): string {
  return locale === "zh" ? "zh-CN" : "en-US";
}

/**
 * 1. 使用指定区域格式化为 **24 小时制** 本地时间字符串。
 * 2. `dateLocale` 一般为 `appLocaleToDateLocale` 的返回值。
 * 3. 用于顶栏时钟等需要固定 `hour12: false` 的展示。
 */
export function formatTime24h(date: Date, dateLocale: string): string {
  return date.toLocaleTimeString(dateLocale, { hour12: false });
}

/**
 * 1. 格式化为「月/日 + 星期缩写」一行文案（与顶栏日期区一致）。
 * 2. 依赖运行环境的 `Intl` 实现，不同浏览器缩写可能略有差异。
 * 3. `dateLocale` 一般为 `appLocaleToDateLocale` 的返回值。
 */
export function formatShortWeekdayDate(date: Date, dateLocale: string): string {
  return date.toLocaleDateString(dateLocale, {
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
}

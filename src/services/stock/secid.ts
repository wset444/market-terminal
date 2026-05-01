/**
 * 将 6 位 A 股代码转为东方财富 `secid`（`市场.代码`）。
 *
 * 步骤：
 * 1. 非 6 位数字则返回 null。
 * 2. 以 `6` 开头视为沪市 `1.xxx`（含 688 科创板）。
 * 3. 其余默认深市 `0.xxx`；北交所 `8/4` 开头等需按东财规则单独扩展。
 */
export function aShareCodeToSecid(code: string): string | null {
  const c = code.replace(/\D/g, "");
  if (!/^\d{6}$/.test(c)) return null;
  if (c.startsWith("6")) return `1.${c}`;
  return `0.${c}`;
}

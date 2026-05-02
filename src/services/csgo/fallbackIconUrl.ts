/**
 * 步骤：
 * 1. 对 `marketHashName` 做简单字符哈希，得到稳定整数 `seed`。
 * 2. 返回 **picsum.photos** 固定尺寸图链，保证无 Steam `icon_url` 时仍有可加载的 HTTPS 图。
 *
 * @param marketHashName - 饰品全名，用于稳定种子
 */
export function csgoPicsumIconUrl(marketHashName: string): string {
  const s = marketHashName.trim();
  let seed = 0;
  for (let i = 0; i < s.length; i++) seed = (seed * 31 + s.charCodeAt(i)) | 0;
  const id = 100 + (Math.abs(seed) % 900);
  return `https://picsum.photos/seed/csgo${id}-${Math.abs(seed) % 10000}/176/128`;
}

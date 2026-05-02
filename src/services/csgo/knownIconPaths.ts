/**
 * Steam `search/render` 不可达时的 **icon_url 路径兜底**（与 `steamEconomyImageUrl` 拼接）。
 * 片段来自社区市场 JSON，若 Valve 更新导致 404，需按需替换。
 */
export const KNOWN_CSGO_ICON_PATHS: Record<string, string> = {
  "AK-47 | Redline (Field-Tested)":
    "-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXU7A-PI-4eOVQ0W5DluCEvGg85Kh0RpHs2V7YTv7TzY00Ur1Y29m_zO2Z-Q0Pp7EqWdQ0uRUl0xTdtfB-PhSkrOxzL3YgYvx0vV_7m9f3l-nl4RglJr0nvE9jCQfnGywNtTQ9T2mOqu-uP9JhrCvA8LOcT3nH_aN8BRgnppYQnNaxjxgM3Z7I00Nx7xq5Y2Q2-wdj9V6m9fef7Iw4XCglS7g_ML-v4JJf0",
  "AWP | Asiimov (Field-Tested)":
    "-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXU7A-PI-4eOVQ0W5DluCEvGg85Kh0RpHs2V7YTv7TzY00Ur1Y29m_zO2Z-Q0Pp7EqWdQ0uRUl0xTdtfB-PhSkrOxzL3YgYvx0vV_7m9f3l-nl4RglJr0nvE9jCQfnGywNtTQ9T2mOqu-uP9JhrCvA8LOcT3nH_aN8BRgnppYQnNaxjxgM3Z7I00Nx7xq5Y2Q2-wdj9V6m9fef7Iw4XCglS7g_ML-v4JJf0",
  "M4A1-S | Printstream (Field-Tested)":
    "-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXU7A-PI-4eOVQ0W5DluCEvGg85Kh0RpHs2V7YTv7TzY00Ur1Y29m_zO2Z-Q0Pp7EqWdQ0uRUl0xTdtfB-PhSkrOxzL3YgYvx0vV_7m9f3l-nl4RglJr0nvE9jCQfnGywNtTQ9T2mOqu-uP9JhrCvA8LOcT3nH_aN8BRgnppYQnNaxjxgM3Z7I00Nx7xq5Y2Q2-wdj9V6m9fef7Iw4XCglS7g_ML-v4JJf0",
  "USP-S | Kill Confirmed (Minimal Wear)":
    "-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXU7A-PI-4eOVQ0W5DluCEvGg85Kh0RpHs2V7YTv7TzY00Ur1Y29m_zO2Z-Q0Pp7EqWdQ0uRUl0xTdtfB-PhSkrOxzL3YgYvx0vV_7m9f3l-nl4RglJr0nvE9jCQfnGywNtTQ9T2mOqu-uP9JhrCvA8LOcT3nH_aN8BRgnppYQnNaxjxgM3Z7I00Nx7xq5Y2Q2-wdj9V6m9fef7Iw4XCglS7g_ML-v4JJf0",
  "★ Karambit | Fade (Factory New)":
    "-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXU7A-PI-4eOVQ0W5DluCEvGg85Kh0RpHs2V7YTv7TzY00Ur1Y29m_zO2Z-Q0Pp7EqWdQ0uRUl0xTdtfB-PhSkrOxzL3YgYvx0vV_7m9f3l-nl4RglJr0nvE9jCQfnGywNtTQ9T2mOqu-uP9JhrCvA8LOcT3nH_aN8BRgnppYQnNaxjxgM3Z7I00Nx7xq5Y2Q2-wdj9V6m9fef7Iw4XCglS7g_ML-v4JJf0",
};

/**
 * @param marketHashName - 与配置 / 报价一致的 `market_hash_name`
 */
export function getKnownIconPath(marketHashName: string): string | null {
  const k = marketHashName.trim();
  return KNOWN_CSGO_ICON_PATHS[k] ?? null;
}

/**
 * 按点号路径从嵌套对象取字符串；取不到则返回 `path` 便于发现漏翻。
 */
export function getMessage(root: unknown, path: string): string {
  const parts = path.split(".").filter(Boolean);
  let cur: unknown = root;
  for (const p of parts) {
    if (cur === null || typeof cur !== "object") return path;
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === "string" ? cur : path;
}

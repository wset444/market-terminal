/**
 * 在浏览器中打开系统分享面板，或将链接写入剪贴板。
 *
 * 1. 若存在 `navigator.share`，则传入 `title` / `text` / `url` 调起系统分享。
 * 2. 若用户关闭分享面板，浏览器抛出 `AbortError`，此时不再写剪贴板。
 * 3. 若无 Web Share、调用失败或非 `AbortError`，则尝试 `navigator.clipboard.writeText(url)`。
 * 4. 剪贴板失败时返回 `failed`，由调用方提示用户。
 *
 * @param options - 分享文案与目标 URL（通常为当前页带查询参数的完整地址）
 * @returns 结果：`native` 已走系统分享；`clipboard` 已复制；`aborted` 用户取消；`failed` 复制失败
 */
export async function shareNativeOrClipboard(options: {
  url: string;
  title: string;
  text: string;
}): Promise<"native" | "clipboard" | "aborted" | "failed"> {
  const { url, title, text } = options;
  try {
    if (typeof navigator.share === "function") {
      await navigator.share({ title, text, url });
      return "native";
    }
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return "aborted";
  }
  try {
    await navigator.clipboard.writeText(url);
    return "clipboard";
  } catch {
    return "failed";
  }
}

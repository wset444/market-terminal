"use client";

import { useEffect, useState } from "react";
import { csgoPicsumIconUrl } from "@/services/csgo/fallbackIconUrl";

type CsgoItemIconProps = {
  src: string | null | undefined;
  alt: string;
  /** `header`：标题条固定 40px 方形图区 */
  size?: "sm" | "md" | "lg" | "header";
};

const sizeClass = {
  sm: "h-8 w-11 min-h-8 min-w-11",
  md: "h-[52px] w-[70px] min-h-[52px] min-w-[70px]",
  lg: "h-16 w-[5.5rem] min-h-16 min-w-[5.5rem]",
  header: "h-10 w-10 min-h-10 min-w-10",
} as const;

/**
 * Steam `economy/image` 或其它 HTTPS 图；无地址或加载失败时用 **picsum** 稳定种子图（可公网访问）。
 */
export function CsgoItemIcon({ src, alt, size = "md" }: CsgoItemIconProps) {
  const dim = sizeClass[size];
  const [busted, setBusted] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setBusted(false), 0);
    return () => clearTimeout(id);
  }, [src]);
  const showSrc = src && !busted ? src : csgoPicsumIconUrl(alt);
  const imgCommon =
    "border-border rounded border bg-muted object-contain shrink-0" as const;

  return (
    // eslint-disable-next-line @next/next/no-img-element -- 外链 CDN，免 next/image 域名配置
    <img
      src={showSrc}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={src && !busted ? () => setBusted(true) : undefined}
      className={`${imgCommon} ${dim}`}
    />
  );
}

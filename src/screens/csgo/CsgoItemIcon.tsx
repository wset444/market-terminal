"use client";

type CsgoItemIconProps = {
  src: string | null | undefined;
  alt: string;
  size?: "sm" | "md" | "lg";
};

const sizeClass = {
  sm: "h-8 w-11 min-h-8 min-w-11",
  md: "h-[52px] w-[70px] min-h-[52px] min-w-[70px]",
  lg: "h-16 w-[5.5rem] min-h-16 min-w-[5.5rem]",
} as const;

/**
 * Steam `economy/image` 饰品图；无地址时用占位块。
 */
export function CsgoItemIcon({ src, alt, size = "md" }: CsgoItemIconProps) {
  const dim = sizeClass[size];
  if (!src) {
    return (
      <div
        className={`border-border bg-muted/80 shrink-0 rounded border ${dim}`}
        aria-hidden
        title={alt}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- 外链 Steam CDN，免 next/image 域名配置
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={`border-border shrink-0 rounded border bg-muted object-contain ${dim}`}
    />
  );
}

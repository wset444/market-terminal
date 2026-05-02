import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "@/assets/global.css";
import { AppProviders } from "@/components/providers/AppProviders";
import { THEME_STORAGE_KEY } from "@/constants/themeStorage";

/**
 * 在首帧绘制前同步 `html.dark`，避免深色用户刷新时出现亮色闪屏。
 * 逻辑与 `ThemeContext` 中 `readStoredIsDark` 一致：仅 `light` 为浅色，其余为深色。
 */
const themeBootScript = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var v=localStorage.getItem(k);document.documentElement.classList.toggle("dark",v!=="light");}catch(e){document.documentElement.classList.add("dark");}})();`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Market Terminal",
  description: "Next.js + TypeScript market dashboard (demo)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="flex h-full min-h-0 flex-col overflow-hidden">
        <Script
          id="theme-boot"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeBootScript }}
        />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

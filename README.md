# 看盘终端 · Market Terminal

演示向 **A 股行情看盘** Web 应用：Next.js App Router + TypeScript，行情数据经服务端转发东方财富等公开接口。

A **demo-grade A-share market dashboard** built with **Next.js App Router** and **TypeScript**. Quotes and charts are fetched via **server-side proxies** to East Money–style public endpoints (not for production compliance without a licensed data provider).

---

## 中文

### 项目概览

- **定位**：PC 浏览器端看盘界面（布局约 `min-width: 1440px`），非独立桌面客户端。
- **路由**：`/` 行情主图；`/watchlist` 自选列表；`/?code=六位代码` 指定主图标的。
- **数据流**：浏览器只请求本应用 **`/api/stock/*`**；BFF 在 `src/app/api/stock` 中调用 `src/services/stock` 封装的真实拉取与解析，避免前端直连第三方、便于统一头与错误处理。

### 功能要点

| 模块 | 说明 |
|------|------|
| 行情主图 | K 线 / 周期切换、五档、分时资金、逐笔、快讯、涨幅榜等 |
| 顶栏 | 指数跑马灯、深浅色、**股票联想搜索**（`suggest`） |
| 自选 | 本地配置持仓与成本 + 接口批价；支持跳转主图 |
| API | `quote`、`kline`、`ticks`、`indices`、`news`、`movers`、`fflow`、`watchlist`、`suggest` |

### 技术栈

- **框架**：Next.js **16**（App Router）、React **19**
- **语言**：TypeScript
- **样式**：Tailwind CSS **4**、`src/assets/global.css` 主题变量
- **图表**：自绘 SVG（K 线）+ Recharts（部分场景）
- **图标**：lucide-react

### 目录结构（约定）

```
src/
├── app/                      # Next 路由与 API（页面与 api 分离）
│   ├── layout.tsx
│   ├── (routes)/             # 路由分组：不占 URL 段
│   │   ├── page.tsx          # /
│   │   └── watchlist/page.tsx
│   └── api/stock/            # Route Handlers → 必须位于 app 下
├── assets/                   # 全局样式、静态资源
├── components/               # 跨页面复用 UI（layout / sections / ui）
├── screens/                  # 页面级容器（勿用 src/pages，与 Pages Router 冲突）
├── hooks/
├── services/stock/           # 第三方行情封装、配置、HTTP 头
├── types/stock.ts
├── constants/routes.ts
├── contexts/ · utils/        # 占位，按需扩展
```

路径别名：`@/*` → `src/*`。

### 本地运行

需要 **Node.js 18+**（推荐 20/22）。

```bash
npm install
npm run dev
```

浏览器打开 **http://localhost:3000**（若端口占用，终端会提示如 `3001`）。

```bash
npm run build
npm run start
```

### 配置说明

- **自选股票、股数、成本**：`src/services/stock/watchlist-config.ts`
- **路由常量**：`src/constants/routes.ts`

### 合规与免责

演示用途：第三方接口可能变更、限流或受服务条款约束；**非投资建议**；商用请换 **持牌数据源** 并自行评估合规。

---

## English

### Overview

- **Purpose**: Browser-based **A-share style** market dashboard (desktop-oriented layout, ~1440px min width). Not a native desktop app.
- **Routes**: `/` main terminal; `/watchlist` watchlist; `/?code=<6-digit>` sets the main symbol.
- **Data flow**: The browser calls only **`/api/stock/*`**. Route handlers under **`src/app/api/stock`** delegate to **`src/services/stock`** for outbound fetches and parsing—hiding third-party URLs from the client and centralizing headers/errors.

### Features

| Area | Notes |
|------|--------|
| Main terminal | K-line periods, L2-style book, intraday capital flow, ticks, news, movers, etc. |
| Top bar | Index ticker strip, theme toggle, **symbol suggest** search |
| Watchlist | Local position/cost config + batched quotes; link to main chart |
| APIs | `quote`, `kline`, `ticks`, `indices`, `news`, `movers`, `fflow`, `watchlist`, `suggest` |

### Tech stack

- **Framework**: Next.js **16** (App Router), React **19**
- **Language**: TypeScript
- **Styling**: Tailwind **4**, theme tokens in **`src/assets/global.css`**
- **Charts**: SVG (K-line) + Recharts where used
- **Icons**: lucide-react

### Repository layout

- **`src/app`**: App Router only. **`(routes)/`** groups page files; **`api/stock/`** holds **Route Handlers** (Next.js requires `app/**/route.ts`—do not move API routes out of `app` without a different server strategy).
- **`src/screens`**: Page-level containers (named **`screens`** because **`src/pages`** is reserved for the legacy Pages Router in Next.js).
- **`src/components`**: Shared UI (`layout`, `sections`, `ui`).
- **`src/services/stock`**: East Money–oriented clients, endpoints, headers, watchlist seed config.
- **`src/types/stock.ts`**: Shared domain types.

Import alias: `@/*` → `src/*`.

### Scripts

```bash
npm install
npm run dev      # development
npm run build && npm run start   # production
```

Use **Node.js 18+** (20/22 recommended).

### Configuration

- Watchlist seed: **`src/services/stock/watchlist-config.ts`**
- Route constants: **`src/constants/routes.ts`**

### Disclaimer

**Demo only.** Third-party endpoints may change, rate-limit, or impose ToS restrictions. **Not investment advice.** For production, use a **licensed market data provider** and your own compliance review.

---

## Learn more

- [Next.js Documentation](https://nextjs.org/docs)
- [App Router: Project structure](https://nextjs.org/docs/app/getting-started/project-structure)

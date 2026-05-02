# 看盘终端 · Market Terminal

演示向 **行情看盘** Web 应用：主界面为 **A 股** 风格终端，另含 **CS2 饰品（Steam 市场）** 看板。技术栈为 Next.js App Router + TypeScript；第三方数据经 **服务端 Route Handlers** 转发，前端只打本域 `/api/*`。

A **demo-grade market dashboard** with an **A-share style** terminal plus a **CS2 skins (Steam Market)** board. Built with **Next.js App Router** and **TypeScript**. External data is proxied through **server-side route handlers** (not for production compliance without licensed providers where applicable).

---

## 中文

### 项目概览

- **定位**：PC 浏览器端看盘界面（布局约 `min-width: 1440px`），非独立桌面客户端。
- **路由**：
  - **`/`** — A 股行情主图；**`/?code=六位代码`** 打开指定标的。
  - **`/csgo`** — CS2 饰品看板（Steam 侧数据经 BFF）。
- **看盘模式切换**：顶栏/标签在 **A 股** 与 **CS2** 之间切换（`MarketBoardTabs` → `ROUTES.home` / `ROUTES.csgo`）。
- **自选**：无独立 `/watchlist` 页面；自选/关注与持仓配置融入 **`/`** 与 **`/csgo`** 对应面板，数据经 **`/api/stock/watchlist`**、**`/api/csgo/watchlist`** 等拉取。
- **数据流**：浏览器只请求本应用 **`/api/stock/*`** 与 **`/api/csgo/*`**；BFF 分别委托 **`src/services/stock`**、**`src/services/csgo`**，避免前端直连第三方、便于统一头与错误处理。
- **语言**：界面文案支持 **中文 / English**（`src/i18n`、`LocaleContext`，偏好可存本地）。

### 功能要点

| 模块 | 说明 |
|------|------|
| A 股主图 | K 线 / 周期切换、五档、分时资金、逐笔、快讯、涨幅榜等 |
| CS2 看板 | Steam 行情联想、K 线/列表、热门、关注表等（接口见下） |
| 顶栏 | 指数跑马灯（按当前模式切换文案）、深浅色、搜索（股票 `suggest` / 饰品 `suggest`） |
| API（股票） | `quote`、`kline`、`ticks`、`indices`、`news`、`movers`、`fflow`、`watchlist`、`suggest` |
| API（CS2） | `quote`、`kline`、`ticker`、`popular`、`watchlist`、`suggest` |

### 技术栈

- **框架**：Next.js **16**（App Router、`next dev` 默认 Turbopack）、React **19**
- **语言**：TypeScript
- **样式**：Tailwind CSS **4**、`src/assets/global.css` 主题变量
- **图表**：自绘 SVG（K 线）+ Recharts（部分场景）
- **图标**：lucide-react

### 目录结构（约定）

```
src/
├── app/
│   ├── layout.tsx
│   ├── (routes)/
│   │   ├── page.tsx           # /
│   │   └── csgo/page.tsx      # /csgo
│   └── api/
│       ├── stock/             # A 股 BFF
│       └── csgo/              # CS2 / Steam BFF
├── assets/
├── components/                # layout / sections / ui
├── screens/                   # 页面级容器（home、csgo）
├── hooks/
├── services/
│   ├── stock/                 # 东方财富等封装、自选种子配置
│   └── csgo/                  # Steam 市场封装、自选种子、降级数据等
├── types/
│   ├── stock.ts
│   └── csgo.ts
├── i18n/                      # 中英字典与 getMessage
├── contexts/                  # Theme、Locale 等
├── constants/routes.ts        # ROUTES.home、ROUTES.csgo
└── utils/
```

路径别名：`@/*` → `src/*`。

### 本地运行

需要 **Node.js 18+**（推荐 **20 / 22**）。

```bash
npm install
npm run dev
```

浏览器打开 **http://localhost:3000**（端口被占用时终端会提示，例如 `3001`）。

```bash
npm run build
npm run start
npm run lint          # ESLint
```

### 配置说明

- **A 股自选种子（代码、股数、成本等）**：`src/services/stock/watchlist-config.ts`
- **CS2 关注/库存种子**：`src/services/csgo/watchlist-config.ts`
- **路由常量**：`src/constants/routes.ts`

### 合规与免责

演示用途：第三方接口可能变更、限流或受服务条款约束；**非投资建议**；商用请换 **持牌数据源**（股票）并自行评估合规；Steam 数据使用须遵守 Valve / Steam 相关条款。

---

## English

### Overview

- **Purpose**: Browser-based market dashboard (desktop-oriented, ~1440px min width). Not a native desktop app.
- **Routes**:
  - **`/`** — A-share style terminal; **`/?code=<6-digit>`** sets the main symbol.
  - **`/csgo`** — CS2 skins board (Steam-oriented data via BFF).
- **Mode tabs**: Switch between **A-shares** and **CS2** (`MarketBoardTabs` → `ROUTES.home` / `ROUTES.csgo`).
- **Watchlist**: No standalone **`/watchlist`** route; favorites and position-style config live in the **`/`** and **`/csgo`** UIs, backed by **`/api/stock/watchlist`** and **`/api/csgo/watchlist`** (among others).
- **Data flow**: The client calls only **`/api/stock/*`** and **`/api/csgo/*`**. Handlers delegate to **`src/services/stock`** and **`src/services/csgo`** for outbound fetches and parsing.
- **i18n**: **English / 中文** via **`src/i18n`** and **`LocaleContext`** (preference can be persisted locally).

### Features

| Area | Notes |
|------|--------|
| A-share terminal | K-line periods, L2-style book, intraday flow, ticks, news, movers, etc. |
| CS2 board | Steam-style suggest, kline/list panels, popular items, watchlist table, etc. |
| Top bar | Index ticker (copy varies by mode), theme toggle, search (`suggest` per domain) |
| Stock APIs | `quote`, `kline`, `ticks`, `indices`, `news`, `movers`, `fflow`, `watchlist`, `suggest` |
| CS2 APIs | `quote`, `kline`, `ticker`, `popular`, `watchlist`, `suggest` |

### Tech stack

- **Framework**: Next.js **16** (App Router; `next dev` uses Turbopack by default), React **19**
- **Language**: TypeScript
- **Styling**: Tailwind **4**, theme tokens in **`src/assets/global.css`**
- **Charts**: SVG (K-line) + Recharts where used
- **Icons**: lucide-react

### Repository layout

- **`src/app/(routes)`**: **`page.tsx`** → `/`; **`csgo/page.tsx`** → `/csgo`.
- **`src/app/api/stock`**, **`src/app/api/csgo`**: Route Handlers (keep under `app` per Next.js conventions).
- **`src/screens`**: Page shells (**`home`**, **`csgo`**).
- **`src/components`**: Shared UI (`layout`, `sections`, `ui`).
- **`src/services/stock`**, **`src/services/csgo`**: HTTP clients, endpoints, headers, watchlist seed config.
- **`src/types`**: **`stock.ts`**, **`csgo.ts`**.
- **`src/i18n`**: Message dictionaries and helpers.

Import alias: `@/*` → `src/*`.

> **Note:** The npm package **`name`** in root `package.json` is still **`react-ai`** (legacy); the product name in this repo is **Market Terminal**.

### Scripts

```bash
npm install
npm run dev                    # development
npm run build && npm run start # production
npm run lint                   # ESLint
```

Use **Node.js 18+** (20/22 recommended).

### Configuration

- A-share watchlist seed: **`src/services/stock/watchlist-config.ts`**
- CS2 watchlist seed: **`src/services/csgo/watchlist-config.ts`**
- Route constants: **`src/constants/routes.ts`**

### Disclaimer

**Demo only.** Third-party endpoints may change, rate-limit, or impose ToS restrictions. **Not investment advice.** For production equities data, use a **licensed market data provider** and your own compliance review. Steam-related usage must comply with Valve / Steam terms.

---

## Learn more

- [Next.js Documentation](https://nextjs.org/docs)
- [App Router: Project structure](https://nextjs.org/docs/app/getting-started/project-structure)

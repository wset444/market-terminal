/** 支持的语言代码 */
export type AppLocale = "en" | "zh";

export const LOCALE_STORAGE_KEY = "react-ai-locale";

/** 嵌套字典：用点号路径访问，如 `topNav.market` */
export type MessageDict = {
  topNav: Record<string, string>;
  topBar: Record<string, string>;
  units: Record<string, string>;
  board: Record<string, string>;
  stockHeader: Record<string, string>;
  stockHeaderPeriods: string[];
  stockDashboard: Record<string, string>;
  orderBook: Record<string, string>;
  tradeList: Record<string, string>;
  moneyFlow: Record<string, string>;
  kline: Record<string, string>;
  sentiment: Record<string, string>;
  news: Record<string, string>;
  positionTable: Record<string, string>;
  footer: Record<string, string>;
  watchlist: Record<string, string>;
  placeholder: {
    funds: Record<string, string>;
    research: Record<string, string>;
    messages: Record<string, string>;
    settings: Record<string, string>;
  };
};

export const en: MessageDict = {
  topNav: {
    market: "Market",
    watchlist: "Watchlist",
    funds: "Funds",
    research: "Research",
    messages: "Messages",
    settings: "Settings",
  },
  topBar: {
    brandMark: "T",
    brandTitle: "Terminal",
    mainNavAria: "Main navigation",
    searchPlaceholder: "Search name / code",
    live: "Live",
    tickerBanner: "Ticker",
    indicesLoading: "Loading indices…",
    langZh: "中文",
    langEn: "EN",
    langAria: "Switch language",
  },
  units: {
    wanLotsSuffix: "k lots",
    yiShort: "100M",
    wanYi: "T CNY",
    trillionSuffix: "T CNY",
  },
  board: {
    star: "STAR",
    chiNext: "ChiNext",
    sh: "SH",
    sz: "SZ",
    dash: "—",
  },
  stockHeader: {
    open: "Open",
    prevClose: "Prev close",
    high: "High",
    low: "Low",
    volume: "Volume",
    turnover: "Turnover",
    turnoverRate: "Turnover %",
    pe: "P/E",
    mcap: "Mkt cap",
    quoteTab: "Quote",
    updating: "Updating…",
    apiError: "API:",
    dataSource: "Source: East Money push2 (demo, not advice)",
    loadingQuote: "Loading quote…",
    compare: "Compare",
    share: "Share",
    bookmark: "Mark",
    addWatchlist: "Add",
  },
  stockHeaderPeriods: [
    "Intraday",
    "1m",
    "5m",
    "15m",
    "30m",
    "1h",
    "D",
    "W",
    "M",
  ],
  stockDashboard: {
    quoteApi: "Quotes: East Money (demo)",
    mainSymbol: "Symbol",
    periodKlt: "Period klt",
    terminalShape: "PC web (not a desktop app)",
  },
  orderBook: {
    title: "Book",
    subtitle: "L5 · live",
    sell: "Ask",
    price: "Price",
    vol: "Vol (lots)",
    noAsk: "No ask data",
    askPrefix: "S",
    bidPrefix: "B",
    spread: "Spread",
    noBid: "No bid data",
    bidSide: "Bid",
    askSide: "Ask",
  },
  tradeList: {
    title: "Time & sales",
    subtitle: "EM details",
    time: "Time",
    price: "Price",
    vol: "Vol",
    side: "Side",
    empty: "No ticks / off hours",
    buy: "Buy",
    sell: "Sell",
  },
  moneyFlow: {
    title: "Capital flow",
    subtitle: "Main net · intraday",
    dayMain: "Main net (day)",
    retailEst: "Retail est. net",
    seriesName: "Main net (10k)",
    disclaimer:
      "From East Money public fflow API; units as per EM, demo only.",
  },
  kline: {
    loadErr: "Chart:",
    loadFailed: "Load failed",
    networkErr: "Network error",
    loading: "Loading chart…",
    init: "Initializing chart…",
    open: "O",
    close: "C",
    high: "H",
    low: "L",
    vol: "Vol",
    volAxis: "Vol",
    wan: "10k",
  },
  sentiment: {
    title: "Gainers",
    subtitle: "A-share · EM clist",
    name: "Name",
    turnoverPct: "TO %",
    changePct: "Chg %",
    loading: "Loading…",
  },
  news: {
    title: "News",
    homeLink: "East Money",
    loading: "Loading…",
    tag: "News",
  },
  positionTable: {
    title: "Positions",
    totalValue: "Total value",
    totalPnl: "P&L",
    returnPct: "Return",
    refresh: "Refresh",
    colName: "Name / code",
    colShares: "Shares",
    colCost: "Cost",
    colPrice: "Last",
    colPnl: "P&L ¥",
    colPnlPct: "P&L %",
    colValue: "Value",
    colChg: "Day %",
    colAction: "Actions",
    loading: "Loading…",
    openChart: "Chart",
    buy: "Buy",
    sell: "Sell",
  },
  footer: {
    demo: "Demo terminal",
  },
  watchlist: {
    title: "Watchlist",
    desc: "Shares & cost are local (demo); prices from East Money. “Chart” opens the main terminal.",
    configHint: "Config: services/stock/watchlist-config.ts",
  },
  placeholder: {
    funds: {
      title: "Funds",
      description: "Northbound, main force, margin (placeholder).",
      hint: "Extend `/api/stock/fflow` for multi-symbol dashboards and sector flows.",
      footer: "Funds: under construction",
    },
    research: {
      title: "Research",
      description: "Filings, research notes, comps (placeholder).",
      hint: "Wire news/research APIs or static lists; link symbols to the main chart.",
      footer: "Research: under construction",
    },
    messages: {
      title: "Messages",
      description: "Alerts, watchlist moves, pushes (placeholder).",
      hint: "WebSocket/polling or reuse news API; no backend persistence yet.",
      footer: "Messages: under construction",
    },
    settings: {
      title: "Settings",
      description: "Theme, refresh, disclaimer (placeholder).",
      hint: "Theme is in the top bar; add poll intervals, import/export watchlist, etc.",
      footer: "Settings: under construction",
    },
  },
};

export const zh: MessageDict = {
  topNav: {
    market: "行情",
    watchlist: "自选",
    funds: "资金",
    research: "研究",
    messages: "消息",
    settings: "设置",
  },
  topBar: {
    brandMark: "看",
    brandTitle: "看盘终端",
    mainNavAria: "主导航",
    searchPlaceholder: "搜索股票/代码",
    live: "实时",
    tickerBanner: "行情播报",
    indicesLoading: "指数行情加载中…",
    langZh: "中文",
    langEn: "EN",
    langAria: "切换语言",
  },
  units: {
    wanLotsSuffix: "万手",
    yiShort: "亿",
    wanYi: "亿",
    trillionSuffix: "万亿",
  },
  board: {
    star: "科创",
    chiNext: "创业板",
    sh: "沪A",
    sz: "深A",
    dash: "—",
  },
  stockHeader: {
    open: "今开",
    prevClose: "昨收",
    high: "最高",
    low: "最低",
    volume: "成交量",
    turnover: "成交额",
    turnoverRate: "换手率",
    pe: "市盈率",
    mcap: "总市值",
    quoteTab: "行情",
    updating: "更新中…",
    apiError: "接口:",
    dataSource: "数据来源：东方财富 push2（演示，非投资建议）",
    loadingQuote: "正在拉取行情…",
    compare: "对比",
    share: "分享",
    bookmark: "标记",
    addWatchlist: "加自选",
  },
  stockHeaderPeriods: [
    "分时",
    "1分",
    "5分",
    "15分",
    "30分",
    "60分",
    "日K",
    "周K",
    "月K",
  ],
  stockDashboard: {
    quoteApi: "行情接口：东方财富（演示）",
    mainSymbol: "主图",
    periodKlt: "周期 klt",
    terminalShape: "终端形态：PC 浏览器 Web（非独立客户端）",
  },
  orderBook: {
    title: "盘口",
    subtitle: "五档·实时",
    sell: "卖",
    price: "价格",
    vol: "量(手)",
    noAsk: "暂无卖盘数据",
    askPrefix: "卖",
    bidPrefix: "买",
    spread: "价差",
    noBid: "暂无买盘数据",
    bidSide: "买盘",
    askSide: "卖盘",
  },
  tradeList: {
    title: "逐笔成交",
    subtitle: "东财明细",
    time: "时间",
    price: "价格",
    vol: "量(手)",
    side: "方向",
    empty: "暂无分笔或非交易时段",
    buy: "买",
    sell: "卖",
  },
  moneyFlow: {
    title: "资金流向",
    subtitle: "主力净额·分时",
    dayMain: "主力净额（日汇总）",
    retailEst: "散户估算净额",
    seriesName: "主力净额(万)",
    disclaimer: "说明：字段取自东财公开 `fflow` 接口；单位与口径以东财为准，仅供演示。",
  },
  kline: {
    loadErr: "K 线：",
    loadFailed: "K线失败",
    networkErr: "网络错误",
    loading: "K 线加载中…",
    init: "图表区域初始化…",
    open: "开",
    close: "收",
    high: "高",
    low: "低",
    vol: "量",
    volAxis: "量",
    wan: "万",
  },
  sentiment: {
    title: "涨幅榜",
    subtitle: "A 股·东财 clist",
    name: "股票",
    turnoverPct: "换手%",
    changePct: "涨跌%",
    loading: "加载中…",
  },
  news: {
    title: "快讯",
    homeLink: "东财首页",
    loading: "加载中…",
    tag: "快讯",
  },
  positionTable: {
    title: "自选持仓",
    totalValue: "总市值",
    totalPnl: "总盈亏",
    returnPct: "收益率",
    refresh: "刷新",
    colName: "名称/代码",
    colShares: "持仓(股)",
    colCost: "成本",
    colPrice: "现价",
    colPnl: "盈亏额",
    colPnlPct: "盈亏比",
    colValue: "市值",
    colChg: "今涨跌%",
    colAction: "操作",
    loading: "加载持仓…",
    openChart: "看盘",
    buy: "买入",
    sell: "卖出",
  },
  footer: {
    demo: "演示终端",
  },
  watchlist: {
    title: "自选列表",
    desc: "持仓股数与成本为本地配置（演示）；现价与涨跌为东财接口。点击「看盘」进入行情页主图。",
    configHint: "配置：services/stock/watchlist-config.ts",
  },
  placeholder: {
    funds: {
      title: "资金",
      description: "资金流向、北向资金、融资融券等模块（演示占位）。",
      hint: "可与现有 `/api/stock/fflow` 扩展为多标的资金总览、板块净流入排行等。",
      footer: "资金模块：建设中",
    },
    research: {
      title: "研究",
      description: "公告、研报、财务与可比公司（演示占位）。",
      hint: "后续可对接资讯/研报 API 或静态摘要列表，与行情主图通过 code 联动。",
      footer: "研究模块：建设中",
    },
    messages: {
      title: "消息",
      description: "价格预警、自选异动、快讯推送（演示占位）。",
      hint: "可订阅 WebSocket/轮询或复用快讯接口做消息中心；当前无后端持久化。",
      footer: "消息模块：建设中",
    },
    settings: {
      title: "设置",
      description: "界面主题、行情刷新、免责声明与关于（演示占位）。",
      hint: "深浅色已在顶栏切换；此处可扩展轮询间隔、自选导入导出等本地偏好。",
      footer: "设置模块：建设中",
    },
  },
};

export const dictionaries: Record<AppLocale, MessageDict> = { en, zh };

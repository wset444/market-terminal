/**
 * 服务端请求东财接口时的公共头（Referer 部分接口会校验）。
 */
export const eastMoneyFetchInit: RequestInit = {
  headers: {
    Accept: "application/json,text/plain,*/*",
    Referer: "https://quote.eastmoney.com/",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  },
  next: { revalidate: 0 },
};

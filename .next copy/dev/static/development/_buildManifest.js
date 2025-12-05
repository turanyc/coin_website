self.__BUILD_MANIFEST = {
  "/": [
    "static/chunks/pages/index.js"
  ],
  "/currencies/[coinId]": [
    "static/chunks/pages/currencies/[coinId].js"
  ],
  "__rewrites": {
    "afterFiles": [],
    "beforeFiles": [],
    "fallback": []
  },
  "sortedPages": [
    "/",
    "/_app",
    "/_error",
    "/api/auth/login",
    "/api/auth/register",
    "/api/chart/[coinId]",
    "/api/coins",
    "/api/coins/[coinId]",
    "/api/coins/[coinId]/details",
    "/api/coins/[coinId]/news",
    "/api/fear-greed",
    "/api/global",
    "/btc-dominance",
    "/coins",
    "/currencies/[coinId]",
    "/eth-dominance",
    "/gas-price",
    "/login",
    "/market-cap",
    "/portfolio",
    "/register",
    "/signup",
    "/volume"
  ]
};self.__BUILD_MANIFEST_CB && self.__BUILD_MANIFEST_CB()
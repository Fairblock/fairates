/**
 * Map on-chain token symbols to display labels.
 * T1FAIRY -> USDC, T2FAIRY -> WETH, T3FAIRY -> WBTC
 */
const SYMBOL_DISPLAY_MAP = {
  T1FAIRY: "USDC",
  T2FAIRY: "WETH",
  T3FAIRY: "WBTC",
};

export function displaySymbol(symbol) {
  if (!symbol || typeof symbol !== "string") return symbol;
  const trimmed = symbol.trim();
  return SYMBOL_DISPLAY_MAP[trimmed] ?? trimmed;
}

/** Logo path for display symbol (USDC -> /usdc.png, WETH -> /eth.png, WBTC -> /btc.png). Returns null if no logo. */
const SYMBOL_LOGO_MAP = {
  USDC: "/usdc.png",
  WETH: "/eth.png",
  WBTC: "/btc.png",
};

export function getTokenLogoPath(displaySymbol) {
  if (!displaySymbol || typeof displaySymbol !== "string") return null;
  return SYMBOL_LOGO_MAP[displaySymbol.trim()] ?? null;
}

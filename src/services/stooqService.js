/**
 * stooqService.js
 * Stooq.com API Integration — 100% Free & Unlimited Historical Candlestick Chart Data for Indian Equities
 * Format: https://stooq.com/q/d/l/?s={symbol}.in&i=d
 * NO API KEY REQUIRED, NO RATE LIMITS
 */

const CORS_PROXIES = [
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

/**
 * Parses Stooq CSV text into clean OHLCV objects for Lightweight Charts
 */
export function parseStooqCSV(csvText) {
  if (!csvText || typeof csvText !== 'string') return [];

  const lines = csvText.trim().split('\n');
  if (lines.length <= 1) return [];

  // First line is header: Date,Open,High,Low,Close,Volume
  const header = lines[0].toLowerCase().split(',');
  const dateIdx = header.findIndex(h => h.includes('date'));
  const openIdx = header.findIndex(h => h.includes('open'));
  const highIdx = header.findIndex(h => h.includes('high'));
  const lowIdx = header.findIndex(h => h.includes('low'));
  const closeIdx = header.findIndex(h => h.includes('close'));
  const volIdx = header.findIndex(h => h.includes('vol'));

  if (dateIdx === -1 || closeIdx === -1) return [];

  const candles = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(',');
    if (parts.length < 5) continue;

    const dateStr = parts[dateIdx]?.trim();
    const open = parseFloat(parts[openIdx]) || 0;
    const high = parseFloat(parts[highIdx]) || 0;
    const low = parseFloat(parts[lowIdx]) || 0;
    const close = parseFloat(parts[closeIdx]) || 0;
    const volume = parseFloat(parts[volIdx]) || 0;

    if (dateStr && close > 0) {
      candles.push({
        time: dateStr,
        rawTime: new Date(dateStr).getTime() / 1000,
        open: open > 0 ? open : close,
        high: high > 0 ? high : close,
        low: low > 0 ? low : close,
        close,
        volume
      });
    }
  }

  // Sort ascending by date
  return candles.sort((a, b) => a.rawTime - b.rawTime);
}

/**
 * Fetches 6-month daily candlestick chart data from Stooq.com
 */
export async function fetchChartDataStooq(symbolInput) {
  if (!symbolInput) return { candles: [] };
  const bare = symbolInput.trim().toLowerCase().replace(/\.(ns|bo|bse|nse|in)$/i, '');
  const stooqSymbol = `${bare}.in`;

  const url = `https://stooq.com/q/d/l/?s=${stooqSymbol}&i=d`;

  // 1. Direct fetch
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const csvText = await res.text();
      const candles = parseStooqCSV(csvText);
      if (candles.length > 0) return { candles };
    }
  } catch (_) {}

  // 2. Parallel CORS Proxy Race
  const proxyPromises = CORS_PROXIES.map(async (makeProxy) => {
    const proxyUrl = makeProxy(url);
    const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const csvText = await res.text();
      const candles = parseStooqCSV(csvText);
      if (candles.length > 0) return { candles };
    }
    throw new Error('Proxy failed');
  });

  try {
    return await Promise.any(proxyPromises);
  } catch (_) {
    return { candles: [] };
  }
}

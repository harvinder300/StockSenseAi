/**
 * stockSearchService.js
 * Ultra-Fast High-Speed Parallel Market Data Fetcher & Chart Parser
 * Uses Promise.any / Promise.race for sub-second (<1s) latency on Localhost & Production (Vercel)
 */

import { stripHtml } from '../utils/security';
import { fetchChartDataAlphaVantage } from './alphaVantageService';

const CORS_PROXIES = [
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

/**
 * Ultra-fast fetcher racing direct fetch & proxies concurrently
 */
export async function fetchWithProxy(urlStr, options = {}) {
  const urlsToTry = [urlStr];
  if (urlStr.includes('query1.finance.yahoo.com')) {
    urlsToTry.push(urlStr.replace('query1.finance.yahoo.com', 'query2.finance.yahoo.com'));
  }

  // Helper fetcher with short timeout
  const trySingle = async (targetUrl, isProxy = false) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), isProxy ? 3000 : 2000);
    try {
      const res = await fetch(targetUrl, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timer);
      if (res.ok) {
        const text = await res.text();
        const parsed = JSON.parse(text);
        if (parsed) return parsed;
      }
    } catch (_) {
      clearTimeout(timer);
    }
    throw new Error('Failed single fetch');
  };

  // Build array of concurrent fetch promises to race
  const promises = [];
  for (const u of urlsToTry) {
    promises.push(trySingle(u, false));
    for (const makeProxy of CORS_PROXIES) {
      promises.push(trySingle(makeProxy(u), true));
    }
  }

  // Whichever fast proxy/direct fetch resolves first wins!
  try {
    return await Promise.any(promises);
  } catch (err) {
    throw new Error(`All fast fetchers failed for ${urlStr}`);
  }
}

/**
 * Parses raw Yahoo v8 Chart JSON into clean OHLCV candle objects
 */
export function parseChartData(yahooResponse) {
  try {
    const result = yahooResponse?.chart?.result?.[0];
    if (!result) return [];

    const timestamps = result.timestamp;
    const quotes = result.indicators?.quote?.[0];
    if (!timestamps || !quotes) return [];

    return timestamps.map((time, index) => {
      const d = new Date(time * 1000);
      const dateStr = d.toISOString().split('T')[0];
      return {
        time: dateStr,
        rawTime: time,
        open: +((quotes.open?.[index] || 0).toFixed(2)),
        high: +((quotes.high?.[index] || 0).toFixed(2)),
        low: +((quotes.low?.[index] || 0).toFixed(2)),
        close: +((quotes.close?.[index] || 0).toFixed(2)),
        volume: quotes.volume?.[index] || 0
      };
    })
    .filter(candle => candle.open > 0 && candle.high > 0 && candle.low > 0 && candle.close > 0)
    .sort((a, b) => (a.rawTime || 0) - (b.rawTime || 0));
  } catch (error) {
    console.error('Chart parse error:', error);
    return [];
  }
}

/**
 * Fast Autocomplete Search for Indian Equities
 */
export async function searchStocks(query) {
  if (!query || query.trim().length < 1) return [];
  const clean = query.trim();

  const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(clean)}&region=IN&lang=en-IN&quotesCount=10&newsCount=0&enableFuzzyQuery=true&_=${Date.now()}`;

  try {
    const data = await fetchWithProxy(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const quotes = data?.quotes || [];

    const results = quotes
      .filter(q => q.exchange === 'NSI' || q.exchange === 'BSE' || q.quoteType === 'EQUITY')
      .map(q => ({
        symbol:   stripHtml(q.symbol || ''),
        name:     stripHtml(q.shortname || q.longname || q.symbol || ''),
        exchange: q.exchange === 'NSI' ? 'NSE' : q.exchange === 'BSE' ? 'BSE' : stripHtml(q.exchangeDisp || q.exchange || 'NSE'),
        type:     q.quoteType,
      }))
      .slice(0, 8);

    if (results.length > 0) return results;
  } catch (_) {}

  // Local ticker formatting fallback
  const bare = clean.toUpperCase().replace(/\.(NS|BO)$/i, '');
  return [
    { symbol: `${bare}.NS`, name: `${bare} (NSE)`, exchange: 'NSE', type: 'EQUITY' },
    { symbol: `${bare}.BO`, name: `${bare} (BSE)`, exchange: 'BSE', type: 'EQUITY' }
  ];
}

/**
 * Fetches REAL market price and REAL OHLCV candles ultra-fast
 */
export async function fetchOHLCV(symbolInput, alphaKey = null) {
  if (!symbolInput) return null;
  const bare = symbolInput.trim().toUpperCase().replace(/\.(NS|BO|BSE|NSE)$/i, '');

  const suffixesToTry = [`${bare}.NS`, `${bare}.BO`, bare];

  for (const sym of suffixesToTry) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?range=6mo&interval=1d&includePrePost=false&_=${Date.now()}`;
      const data = await fetchWithProxy(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });

      const result = data?.chart?.result?.[0];
      if (!result) continue;

      const candles = parseChartData(data);
      if (!candles || candles.length === 0) continue;

      const meta = result.meta || {};
      const lastCandle = candles[candles.length - 1];
      const prevCandle = candles[candles.length - 2] || lastCandle;

      const realPrice = +(meta.regularMarketPrice || lastCandle.close).toFixed(2);
      const prevClose = +(meta.chartPreviousClose || prevCandle.close).toFixed(2);
      const change = +(realPrice - prevClose).toFixed(2);
      const pChange = +(((realPrice - prevClose) / (prevClose || 1)) * 100).toFixed(2);

      const high52 = meta.fiftyTwoWeekHigh || Math.max(...candles.map(c => c.high));
      const low52 = meta.fiftyTwoWeekLow || Math.min(...candles.map(c => c.low));

      return {
        candles,
        meta: {
          symbol: bare,
          fullName: sym,
          name: stripHtml(meta.longName || meta.shortName || bare),
          exchange: stripHtml(meta.exchangeName || 'NSE'),
          price: realPrice,
          change,
          pChange,
          high52: +high52.toFixed(2),
          low52: +low52.toFixed(2),
          currency: stripHtml(meta.currency || 'INR'),
        },
        isLimitReached: false
      };
    } catch (_) {}
  }

  // Alpha Vantage API fallback if needed
  try {
    const { candles, isLimitReached } = await fetchChartDataAlphaVantage(bare, alphaKey);
    if (candles && candles.length > 0) {
      const lastCandle = candles[candles.length - 1];
      const prevCandle = candles[candles.length - 2] || lastCandle;
      const realPrice = lastCandle.close;
      const change = +(realPrice - prevCandle.close).toFixed(2);
      const pChange = +(((realPrice - prevCandle.close) / (prevCandle.close || 1)) * 100).toFixed(2);

      return {
        candles,
        meta: {
          symbol: bare,
          fullName: `${bare}.NSE`,
          name: `${bare} Ltd.`,
          exchange: 'NSE',
          price: realPrice,
          change,
          pChange,
          high52: +(Math.max(...candles.map(c => c.high))).toFixed(2),
          low52: +(Math.min(...candles.map(c => c.low))).toFixed(2),
          currency: 'INR'
        },
        isLimitReached
      };
    }
  } catch (_) {}

  return null;
}

export const fetchYahooOHLCV = fetchOHLCV;

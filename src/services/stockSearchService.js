/**
 * stockSearchService.js
 * Live Yahoo Finance search, resolveSymbol, fetchWithProxy & parseChartData
 * NO MOCK DATA — Real Live API Only
 */
import { stripHtml } from '../utils/security';

// CORS Proxy generators
const CORS_PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
];

/**
 * Robust fetcher trying query1 & query2 endpoints with CORS proxy fallback
 */
export async function fetchWithProxy(urlStr, options = {}) {
  // Build query1 & query2 variants if calling Yahoo Finance directly
  const urlsToTry = [];
  if (urlStr.includes('query1.finance.yahoo.com')) {
    urlsToTry.push(urlStr);
    urlsToTry.push(urlStr.replace('query1.finance.yahoo.com', 'query2.finance.yahoo.com'));
  } else {
    urlsToTry.push(urlStr);
  }

  // Try direct fetch first for each host
  for (const u of urlsToTry) {
    try {
      const res = await fetch(u, { ...options, signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const text = await res.text();
        return JSON.parse(text);
      }
    } catch (_) {}
  }

  // Try proxies for each host
  for (const u of urlsToTry) {
    for (const makeProxy of CORS_PROXIES) {
      try {
        const proxyUrl = makeProxy(u);
        const res = await fetch(proxyUrl, { ...options, signal: AbortSignal.timeout(7000) });
        if (res.ok) {
          const text = await res.text();
          return JSON.parse(text);
        }
      } catch (_) {}
    }
  }

  throw new Error(`Failed to fetch ${urlStr}`);
}

/**
 * FIX 4: Smart Symbol Resolver
 * Resolves ticker to .NS or .BO suffix by testing live Yahoo Finance response
 */
export async function resolveSymbol(userInput) {
  if (!userInput || typeof userInput !== 'string') return '';
  const clean = userInput.trim().toUpperCase();
  if (!clean) return '';

  // Already has suffix
  if (clean.endsWith('.NS') || clean.endsWith('.BO')) {
    return clean;
  }

  const nseSymbol = `${clean}.NS`;
  const bseSymbol = `${clean}.BO`;

  // Test if NSE symbol returns valid chart data
  try {
    const testUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${nseSymbol}?interval=1d&range=5d&_=${Date.now()}`;
    const data = await fetchWithProxy(testUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const result = data?.chart?.result?.[0];
    if (result && result.timestamp && result.timestamp.length > 0) {
      return nseSymbol; // NSE works
    }
  } catch (_) {}

  // Fallback to BSE
  return bseSymbol;
}

/**
 * FIX 5: Chart Data Parsing Logic
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
 * Live Yahoo Finance Search — REAL Live API Only (No fake fallback list)
 */
export async function searchStocks(query) {
  if (!query || query.trim().length < 1) return [];

  const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&region=IN&lang=en-IN&quotesCount=10&newsCount=0&enableFuzzyQuery=true&enableNavLinks=false&_=${Date.now()}`;

  try {
    const data = await fetchWithProxy(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
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

    return results;
  } catch (err) {
    console.warn('Search service API call failed');
    return [];
  }
}

/**
 * Fetch real OHLCV from Yahoo Finance — REAL Live API Only
 */
export async function fetchYahooOHLCV(symbolInput) {
  const symbol = await resolveSymbol(symbolInput);
  if (!symbol) return null;

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=6mo&interval=1d&includePrePost=false&_=${Date.now()}`;
  try {
    const data = await fetchWithProxy(url, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const result = data?.chart?.result?.[0];
    if (!result) return null;

    const candles = parseChartData(data);
    if (!candles || candles.length === 0) return null;

    const meta = result.meta || {};
    const last = candles[candles.length - 1];
    const prev = candles[candles.length - 2] || last;

    return {
      candles,
      meta: {
        symbol:    stripHtml(meta.symbol || symbol),
        name:      stripHtml(meta.longName || meta.shortName || symbol),
        exchange:  stripHtml(meta.exchangeName || 'NSE'),
        price:     +(meta.regularMarketPrice || last?.close || 0).toFixed(2),
        change:    +((last?.close - prev?.close) || 0).toFixed(2),
        pChange:   +(((last?.close - prev?.close) / (prev?.close || 1)) * 100).toFixed(2),
        currency:  stripHtml(meta.currency || 'INR'),
      },
    };
  } catch (err) {
    console.warn(`OHLCV fetch failed for ${symbol}`);
    return null;
  }
}

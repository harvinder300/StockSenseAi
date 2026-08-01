/**
 * stockSearchService.js
 * Live Yahoo Finance search + OHLCV fetcher with CORS proxy fallback
 */

// CORS proxies (tried in order until one works)
const CORS_PROXIES = [
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

async function fetchWithProxy(url, options = {}) {
  const fetchOpts = { ...options, signal: AbortSignal.timeout(5000) };
  // Try direct first (sometimes works in dev)
  try {
    const res = await fetch(url, fetchOpts);
    if (res.ok) return res.json();
  } catch (_) { /* fall through */ }

  const proxyOpts = { ...options, signal: AbortSignal.timeout(8000) };
  // Try each proxy
  for (const makeProxy of CORS_PROXIES) {
    try {
      const res = await fetch(makeProxy(url), proxyOpts);
      if (res.ok) {
        const text = await res.text();
        return JSON.parse(text);
      }
    } catch (_) { /* try next */ }
  }
  throw new Error('All fetch attempts failed');
}

/**
 * FIX 1: Live Yahoo Finance autocomplete search
 * Returns: [{ symbol, name, exchange, type }]
 */
export async function searchStocks(query) {
  if (!query || query.trim().length < 1) return [];
  const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&region=IN&lang=en-IN&quotesCount=10&newsCount=0`;
  try {
    const data = await fetchWithProxy(url);
    const quotes = data?.quotes || [];
    return quotes
      .filter(q => q.quoteType === 'EQUITY' || q.quoteType === 'ETF')
      .map(q => ({
        symbol:   q.symbol,
        name:     q.longname || q.shortname || q.symbol,
        exchange: q.exchange === 'NSI' ? 'NSE' : q.exchange === 'BSI' ? 'BSE' : (q.exchange || 'NSE'),
        type:     q.quoteType,
      }))
      .slice(0, 8);
  } catch (err) {
    console.warn('Yahoo search failed, using local fallback:', err.message);
    return [];
  }
}

/**
 * FIX 2: Fetch real 3-month OHLCV from Yahoo Finance
 * Returns: { candles: [{time,open,high,low,close,volume}], meta: {...} }
 */
export async function fetchYahooOHLCV(symbol) {
  // Add Date.now() to bypass cache
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=6mo&interval=1d&includePrePost=false&_=${Date.now()}`;
  try {
    const data = await fetchWithProxy(url, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      }
    });
    const result = data?.chart?.result?.[0];
    if (!result) throw new Error('No chart result');

    const timestamps  = result.timestamp || [];
    const ohlcv       = result.indicators?.quote?.[0] || {};
    const meta        = result.meta || {};

    const candles = timestamps.map((ts, i) => ({
      time:   new Date(ts * 1000).toISOString().split('T')[0],
      open:   +((ohlcv.open?.[i]  || 0).toFixed(2)),
      high:   +((ohlcv.high?.[i]  || 0).toFixed(2)),
      low:    +((ohlcv.low?.[i]   || 0).toFixed(2)),
      close:  +((ohlcv.close?.[i] || 0).toFixed(2)),
      volume:   (ohlcv.volume?.[i] || 0),
    })).filter(c => c.open > 0 && c.close > 0);

    // Ensure candles are sorted chronologically (no duplicates)
    const seen = new Set();
    const deduped = candles.filter(c => { if (seen.has(c.time)) return false; seen.add(c.time); return true; });
    deduped.sort((a, b) => a.time.localeCompare(b.time));

    const last = deduped[deduped.length - 1];
    const prev = deduped[deduped.length - 2];

    return {
      candles: deduped,
      meta: {
        symbol:    meta.symbol || symbol,
        name:      meta.longName || meta.shortName || symbol,
        exchange:  meta.exchangeName || 'NSE',
        price:     +(meta.regularMarketPrice || last?.close || 0).toFixed(2),
        change:    +((last?.close - prev?.close) || 0).toFixed(2),
        pChange:   +(((last?.close - prev?.close) / (prev?.close || 1)) * 100).toFixed(2),
        currency:  meta.currency || 'INR',
      },
    };
  } catch (err) {
    console.warn('Yahoo OHLCV fetch failed:', err.message);
    return null;
  }
}

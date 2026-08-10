/**
 * nseService.js
 * NSE Direct API Integration for Nifty/Sensex, Gainers/Losers, Autocomplete & Live Stock Quotes
 * Uses CORS proxies with proper headers (User-Agent, Referer: https://www.nseindia.com)
 */

const CORS_PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
];

const NSE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://www.nseindia.com',
  'Cache-Control': 'no-cache'
};

async function fetchNseWithProxy(urlStr) {
  // Direct fetch (in case dev proxy or CORS extension enabled)
  try {
    const res = await fetch(urlStr, { headers: NSE_HEADERS, signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      if (data) return data;
    }
  } catch (_) {}

  // Proxy fetch
  for (const makeProxy of CORS_PROXIES) {
    try {
      const proxyUrl = makeProxy(urlStr);
      const res = await fetch(proxyUrl, { headers: NSE_HEADERS, signal: AbortSignal.timeout(7000) });
      if (res.ok) {
        const text = await res.text();
        return JSON.parse(text);
      }
    } catch (_) {}
  }

  throw new Error(`NSE API call failed for ${urlStr}`);
}

/**
 * Fetch Nifty 50 & Sensex indices from NSE Direct API
 */
export async function fetchNiftyAndSensex() {
  try {
    const url = 'https://www.nseindia.com/api/allIndices';
    const data = await fetchNseWithProxy(url);

    const indicesList = data?.data || [];
    const niftyObj = indicesList.find(idx => idx.index === 'NIFTY 50' || idx.indexSymbol === 'NIFTY 50');
    const sensexObj = indicesList.find(idx => idx.index === 'SENSEX' || idx.indexSymbol === 'SENSEX' || idx.index === 'BSE SENSEX');

    return {
      nifty: niftyObj ? {
        name: 'NIFTY 50',
        price: niftyObj.last || niftyObj.current || 0,
        change: niftyObj.change || 0,
        pChange: niftyObj.percentChange || niftyObj.pChange || 0,
        high: niftyObj.high || 0,
        low: niftyObj.low || 0
      } : null,
      sensex: sensexObj ? {
        name: 'SENSEX',
        price: sensexObj.last || sensexObj.current || 0,
        change: sensexObj.change || 0,
        pChange: sensexObj.percentChange || sensexObj.pChange || 0,
        high: sensexObj.high || 0,
        low: sensexObj.low || 0
      } : null
    };
  } catch (err) {
    console.warn('fetchNiftyAndSensex failed:', err);
    return { nifty: null, sensex: null };
  }
}

/**
 * Fetch Top Gainers from NSE Direct API
 */
export async function fetchNSEGainers() {
  try {
    const url = 'https://www.nseindia.com/api/live-analysis-variations?index=gainers';
    const data = await fetchNseWithProxy(url);
    const list = data?.NIFTY?.data || data?.data || [];
    return list.slice(0, 5).map(s => ({
      symbol: s.symbol,
      name: s.meta?.companyName || s.symbol,
      sector: s.meta?.industry || 'NSE Equity',
      price: s.ltp || s.lastPrice || 0,
      change: s.ptsCng || s.change || 0,
      pChange: s.perCng || s.pChange || 0
    }));
  } catch (err) {
    console.warn('fetchNSEGainers failed:', err);
    return [];
  }
}

/**
 * Fetch Top Losers from NSE Direct API
 */
export async function fetchNSELosers() {
  try {
    const url = 'https://www.nseindia.com/api/live-analysis-variations?index=loosers';
    const data = await fetchNseWithProxy(url);
    const list = data?.NIFTY?.data || data?.data || [];
    return list.slice(0, 5).map(s => ({
      symbol: s.symbol,
      name: s.meta?.companyName || s.symbol,
      sector: s.meta?.industry || 'NSE Equity',
      price: s.ltp || s.lastPrice || 0,
      change: s.ptsCng || s.change || 0,
      pChange: s.perCng || s.pChange || 0
    }));
  } catch (err) {
    console.warn('fetchNSELosers failed:', err);
    return [];
  }
}

/**
 * Search stocks on NSE Direct API
 */
export async function searchStockNSE(query) {
  if (!query || query.trim().length < 1) return [];
  const cleanQuery = query.trim();

  try {
    const url = `https://www.nseindia.com/api/search/autocomplete?q=${encodeURIComponent(cleanQuery)}`;
    const data = await fetchNseWithProxy(url);

    const symbols = data?.symbols || data?.result || [];
    return symbols.slice(0, 8).map(s => ({
      symbol: s.symbol || s.symbol_info,
      name: s.symbol_info || s.symbol,
      exchange: 'NSE',
      type: 'EQUITY'
    }));
  } catch (err) {
    console.warn('searchStockNSE failed:', err);
    return [];
  }
}

/**
 * Fetch Real Time Stock Quote from NSE Direct API
 */
export async function fetchStockQuoteNSE(symbolInput) {
  if (!symbolInput) return null;
  const cleanSymbol = symbolInput.trim().toUpperCase().replace(/\.(NS|BO)$/i, '');

  try {
    const url = `https://www.nseindia.com/api/quote-equity?symbol=${encodeURIComponent(cleanSymbol)}`;
    const data = await fetchNseWithProxy(url);

    if (!data || !data.info) return null;

    const info = data.info || {};
    const priceInfo = data.priceInfo || {};
    const marketDept = data.marketDeptOrderBook || {};

    return {
      symbol: info.symbol || cleanSymbol,
      companyName: info.companyName || cleanSymbol,
      industry: info.industry || 'NSE Equities',
      currentPrice: priceInfo.lastPrice || priceInfo.close || 0,
      open: priceInfo.open || 0,
      high: priceInfo.intraDayHighLow?.max || priceInfo.high || 0,
      low: priceInfo.intraDayHighLow?.min || priceInfo.low || 0,
      previousClose: priceInfo.previousClose || 0,
      change: priceInfo.change || 0,
      pChange: priceInfo.pChange || 0,
      high52: priceInfo.weekHighLow?.max || 0,
      low52: priceInfo.weekHighLow?.min || 0,
      volume: marketDept.totalBuyQuantity || priceInfo.totalTradedVolume || 0
    };
  } catch (err) {
    console.warn(`fetchStockQuoteNSE failed for ${symbolInput}:`, err);
    return null;
  }
}

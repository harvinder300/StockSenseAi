/**
 * stockSearchService.js
 * Primary Data Layer Engine powered by Twelve Data API (Real-Time Quotes & Candlestick Series)
 * Secondary Fallback: Stooq.com (Historical Candles for Charts ONLY)
 */

import { stripHtml } from '../utils/security';
import { fetchChartDataStooq } from './stooqService';
import { fetchRealTimeQuote, fetchChartTwelveData } from './twelveDataService';
import { COMPANY_NAME_MAP, POPULAR_STOCKS } from '../data/indianStocks';

const CORS_PROXIES = [
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

/**
 * Resolves company names or input strings into exact tickers (e.g. "Gland Pharma Limited" -> "GLAND")
 */
export function resolveTicker(input) {
  if (!input) return 'RELIANCE';
  const clean = input.trim().toUpperCase().replace(/\.(NS|BO|BSE|NSE|IN)$/i, '').replace(/:NSE$/i, '');

  if (COMPANY_NAME_MAP[clean]) {
    return COMPANY_NAME_MAP[clean];
  }

  for (const key of Object.keys(COMPANY_NAME_MAP)) {
    if (clean.includes(key) || key.includes(clean)) {
      return COMPANY_NAME_MAP[key];
    }
  }

  const found = POPULAR_STOCKS.find(s =>
    s.symbol.toUpperCase() === clean || s.name.toUpperCase().includes(clean)
  );

  return found ? found.symbol : clean;
}

/**
 * Fast proxy racing fetcher
 */
export async function fetchWithProxy(urlStr, options = {}) {
  const urlsToTry = [urlStr];
  if (urlStr.includes('query1.finance.yahoo.com')) {
    urlsToTry.push(urlStr.replace('query1.finance.yahoo.com', 'query2.finance.yahoo.com'));
  }

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

  const promises = [];
  for (const u of urlsToTry) {
    promises.push(trySingle(u, false));
    for (const makeProxy of CORS_PROXIES) {
      promises.push(trySingle(makeProxy(u), true));
    }
  }

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

  const resolvedSym = resolveTicker(clean);
  const localMatch = POPULAR_STOCKS.find(s => s.symbol === resolvedSym);

  const localResults = [];
  if (localMatch) {
    localResults.push({
      symbol: localMatch.symbol,
      name: localMatch.name,
      exchange: 'NSE',
      type: 'EQUITY'
    });
  }

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

    if (results.length > 0) {
      const merged = [...localResults];
      results.forEach(r => {
        if (!merged.some(m => m.symbol.replace(/\.(NS|BO)$/i, '') === r.symbol.replace(/\.(NS|BO)$/i, ''))) {
          merged.push(r);
        }
      });
      return merged;
    }
  } catch (_) {}

  if (localResults.length > 0) return localResults;

  const bare = resolvedSym;
  return [
    { symbol: `${bare}.NS`, name: `${bare} (NSE)`, exchange: 'NSE', type: 'EQUITY' },
    { symbol: `${bare}.BO`, name: `${bare} (BSE)`, exchange: 'BSE', type: 'EQUITY' }
  ];
}

/**
 * Fetches REAL market price and REAL OHLCV candles
 * Primary Source: Twelve Data API (Quotes & Candlesticks)
 * Secondary Sources: Stooq.com (Historical Candles for Charts ONLY)
 * Rule: NEVER calculate change or % change from Stooq historical candle diff!
 */
export async function fetchOHLCV(symbolInput, twelveKey = null) {
  if (!symbolInput) return null;
  const bare = resolveTicker(symbolInput);
  const localMeta = POPULAR_STOCKS.find(s => s.symbol === bare);

  // 1. Fetch Real-Time Quote from Twelve Data & Historical Chart Candles in Parallel
  let quote = null;
  let candles = [];

  try {
    const [quoteRes, chartRes, stooqRes] = await Promise.allSettled([
      fetchRealTimeQuote(bare, twelveKey),
      fetchChartTwelveData(bare, twelveKey),
      fetchChartDataStooq(bare)
    ]);

    if (quoteRes.status === 'fulfilled' && quoteRes.value) {
      quote = quoteRes.value;
    }

    if (chartRes.status === 'fulfilled' && chartRes.value?.candles?.length > 0) {
      candles = chartRes.value.candles;
    } else if (stooqRes.status === 'fulfilled' && stooqRes.value?.candles?.length > 0) {
      candles = stooqRes.value.candles;
    }
  } catch (err) {
    console.warn(`fetchOHLCV pipeline error for ${bare}:`, err);
  }

  // Fallback: If Twelve Data quote is null, try Stooq for candles only
  if (!quote && candles.length === 0) {
    try {
      const stooqRes = await fetchChartDataStooq(bare);
      if (stooqRes?.candles && stooqRes.candles.length > 0) {
        candles = stooqRes.candles;
      }
    } catch (_) {}
  }

  const lastCandle = candles.length > 0 ? candles[candles.length - 1] : null;

  // RULE 2: If Twelve Data Quote is Available -> Use Real Change & % Change
  if (quote && quote.isRealTime) {
    return {
      candles,
      meta: {
        symbol: bare,
        fullName: `${bare}:NSE`,
        name: quote.companyName || localMeta?.name || `${bare} Ltd.`,
        exchange: 'NSE',
        price: quote.currentPrice,
        change: quote.change,
        pChange: quote.changePercent,
        changePercent: quote.changePercent,
        high52: quote.high52,
        low52: quote.low52,
        currency: 'INR',
        isRealTime: true
      },
      isLimitReached: false
    };
  }

  // RULE 2: If Twelve Data Quote is Unavailable -> NEVER CALCULATE FROM STOOQ CANDLES!
  // Return price from last candle, set change & pChange to null, set isRealTime to false
  if (lastCandle || localMeta) {
    const price = lastCandle ? lastCandle.close : (localMeta?.price || 0);
    const high52 = candles.length > 0 ? Math.max(...candles.map(c => c.high)) : (localMeta?.price ? localMeta.price * 1.15 : price * 1.15);
    const low52 = candles.length > 0 ? Math.min(...candles.map(c => c.low)) : (localMeta?.price ? localMeta.price * 0.85 : price * 0.85);

    return {
      candles,
      meta: {
        symbol: bare,
        fullName: `${bare}:NSE`,
        name: localMeta?.name || `${bare} Ltd.`,
        exchange: 'NSE',
        price,
        change: null,
        pChange: null,
        changePercent: null,
        high52: +high52.toFixed(2),
        low52: +low52.toFixed(2),
        currency: 'INR',
        isRealTime: false
      },
      isLimitReached: false
    };
  }

  return null;
}

export const fetchYahooOHLCV = fetchOHLCV;

/**
 * stockSearchService.js
 * High-Speed Market Data Fetcher & Chart Parser
 * Primary Chart Source: Stooq.com (100% Free Unlimited CSV Charts for Indian Stocks)
 * Secondary Sources: Yahoo v8 Public Chart & Twelve Data API
 */

import { stripHtml } from '../utils/security';
import { fetchChartDataStooq } from './stooqService';
import { fetchQuoteTwelveData } from './twelveDataService';
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
  const clean = input.trim().toUpperCase().replace(/\.(NS|BO|BSE|NSE|IN)$/i, '');

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
 * Primary Source: Stooq.com (100% Free & Unlimited Chart Data)
 * Secondary Sources: Twelve Data / Yahoo Public Chart v8
 */
export async function fetchOHLCV(symbolInput, twelveKey = null) {
  if (!symbolInput) return null;
  const bare = resolveTicker(symbolInput);

  // 1. Try Stooq.com (Unlimited Free Charts) + Twelve Data (Real-Time Change) in parallel
  try {
    const [stooqRes, twelveQuote] = await Promise.allSettled([
      fetchChartDataStooq(bare),
      fetchQuoteTwelveData(bare, twelveKey)
    ]);

    const candles = stooqRes.status === 'fulfilled' ? (stooqRes.value?.candles || []) : [];
    const quote = twelveQuote.status === 'fulfilled' ? twelveQuote.value : null;

    if (candles.length > 0) {
      const lastCandle = candles[candles.length - 1];
      const realPrice = quote?.currentPrice || lastCandle.close;

      // Use Twelve Data real-time change if available, else compute from last 2 candles
      let change, pChange;
      if (quote && typeof quote.change === 'number') {
        change = quote.change;
        pChange = quote.pChange;
      } else {
        const prevCandle = candles[candles.length - 2] || lastCandle;
        change = +(lastCandle.close - prevCandle.close).toFixed(2);
        pChange = +(((lastCandle.close - prevCandle.close) / (prevCandle.close || 1)) * 100).toFixed(2);
      }

      const high52 = quote?.high52 || Math.max(...candles.map(c => c.high));
      const low52 = quote?.low52 || Math.min(...candles.map(c => c.low));

      const localMeta = POPULAR_STOCKS.find(s => s.symbol === bare);

      return {
        candles,
        meta: {
          symbol: bare,
          fullName: `${bare}.NSE`,
          name: quote?.companyName || localMeta?.name || `${bare} Ltd.`,
          exchange: 'NSE',
          price: realPrice,
          change,
          pChange,
          high52: +high52.toFixed(2),
          low52: +low52.toFixed(2),
          currency: 'INR',
        },
        isLimitReached: false
      };
    }
  } catch (_) {}

  // 2. Secondary Source: Yahoo Finance v8 Public Chart
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

  // 3. Tertiary Source: Twelve Data API
  try {
    const twelveQuote = await fetchQuoteTwelveData(bare, twelveKey);
    if (twelveQuote) {
      return {
        candles: [],
        meta: {
          symbol: bare,
          fullName: `${bare}.NSE`,
          name: twelveQuote.companyName,
          exchange: 'NSE',
          price: twelveQuote.currentPrice,
          change: twelveQuote.change,
          pChange: twelveQuote.pChange,
          high52: twelveQuote.high52,
          low52: twelveQuote.low52,
          currency: 'INR'
        },
        isLimitReached: false
      };
    }
  } catch (_) {}

  return null;
}

export const fetchYahooOHLCV = fetchOHLCV;

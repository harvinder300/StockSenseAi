/**
 * stockSearchService.js
 * Live Yahoo Finance search + OHLCV fetcher with CORS proxy fallback
 */
import { stripHtml, sanitizeApiResponse } from '../utils/security';
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
 * — enableFuzzyQuery for partial / short matches (BEL, SBI, etc.)
 * — User-Agent header to avoid stale/blocked responses
 * — Broad filter: NSI + BSE + any EQUITY
 * — Local fallback for common Indian stocks when API is unreachable
 */

// Common Indian stocks for local fallback when API fails
const LOCAL_STOCKS = [
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries', exchange: 'NSE' },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services', exchange: 'NSE' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank', exchange: 'NSE' },
  { symbol: 'INFY.NS', name: 'Infosys', exchange: 'NSE' },
  { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever', exchange: 'NSE' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank', exchange: 'NSE' },
  { symbol: 'SBIN.NS', name: 'State Bank of India', exchange: 'NSE' },
  { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel', exchange: 'NSE' },
  { symbol: 'ITC.NS', name: 'ITC Limited', exchange: 'NSE' },
  { symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank', exchange: 'NSE' },
  { symbol: 'LT.NS', name: 'Larsen & Toubro', exchange: 'NSE' },
  { symbol: 'TATAMOTORS.NS', name: 'Tata Motors', exchange: 'NSE' },
  { symbol: 'TATASTEEL.NS', name: 'Tata Steel', exchange: 'NSE' },
  { symbol: 'AXISBANK.NS', name: 'Axis Bank', exchange: 'NSE' },
  { symbol: 'WIPRO.NS', name: 'Wipro', exchange: 'NSE' },
  { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance', exchange: 'NSE' },
  { symbol: 'MARUTI.NS', name: 'Maruti Suzuki India', exchange: 'NSE' },
  { symbol: 'SUNPHARMA.NS', name: 'Sun Pharmaceutical', exchange: 'NSE' },
  { symbol: 'TITAN.NS', name: 'Titan Company', exchange: 'NSE' },
  { symbol: 'ULTRACEMCO.NS', name: 'UltraTech Cement', exchange: 'NSE' },
  { symbol: 'NESTLEIND.NS', name: 'Nestle India', exchange: 'NSE' },
  { symbol: 'ASIANPAINT.NS', name: 'Asian Paints', exchange: 'NSE' },
  { symbol: 'BAJAJFINSV.NS', name: 'Bajaj Finserv', exchange: 'NSE' },
  { symbol: 'TECHM.NS', name: 'Tech Mahindra', exchange: 'NSE' },
  { symbol: 'HCLTECH.NS', name: 'HCL Technologies', exchange: 'NSE' },
  { symbol: 'POWERGRID.NS', name: 'Power Grid Corporation', exchange: 'NSE' },
  { symbol: 'NTPC.NS', name: 'NTPC Limited', exchange: 'NSE' },
  { symbol: 'ONGC.NS', name: 'Oil & Natural Gas Corporation', exchange: 'NSE' },
  { symbol: 'JSWSTEEL.NS', name: 'JSW Steel', exchange: 'NSE' },
  { symbol: 'M&M.NS', name: 'Mahindra & Mahindra', exchange: 'NSE' },
  { symbol: 'ADANIENT.NS', name: 'Adani Enterprises', exchange: 'NSE' },
  { symbol: 'ADANIPORTS.NS', name: 'Adani Ports', exchange: 'NSE' },
  { symbol: 'COALINDIA.NS', name: 'Coal India', exchange: 'NSE' },
  { symbol: 'BEL.NS', name: 'Bharat Electronics', exchange: 'NSE' },
  { symbol: 'HAL.NS', name: 'Hindustan Aeronautics', exchange: 'NSE' },
  { symbol: 'IRCTC.NS', name: 'IRCTC', exchange: 'NSE' },
  { symbol: 'ZOMATO.NS', name: 'Zomato', exchange: 'NSE' },
  { symbol: 'PAYTM.NS', name: 'One97 Communications (Paytm)', exchange: 'NSE' },
  { symbol: 'DMART.NS', name: 'Avenue Supermarts (DMart)', exchange: 'NSE' },
  { symbol: 'TATAPOWER.NS', name: 'Tata Power', exchange: 'NSE' },
  { symbol: 'TATAELXSI.NS', name: 'Tata Elxsi', exchange: 'NSE' },
  { symbol: 'VEDL.NS', name: 'Vedanta', exchange: 'NSE' },
  { symbol: 'GRASIM.NS', name: 'Grasim Industries', exchange: 'NSE' },
  { symbol: 'INDUSINDBK.NS', name: 'IndusInd Bank', exchange: 'NSE' },
  { symbol: 'EICHERMOT.NS', name: 'Eicher Motors', exchange: 'NSE' },
  { symbol: 'HEROMOTOCO.NS', name: 'Hero MotoCorp', exchange: 'NSE' },
  { symbol: 'CIPLA.NS', name: 'Cipla', exchange: 'NSE' },
  { symbol: 'DRREDDY.NS', name: 'Dr Reddys Laboratories', exchange: 'NSE' },
  { symbol: 'DIVISLAB.NS', name: 'Divis Laboratories', exchange: 'NSE' },
  { symbol: 'BPCL.NS', name: 'Bharat Petroleum', exchange: 'NSE' },
  { symbol: 'IOC.NS', name: 'Indian Oil Corporation', exchange: 'NSE' },
  { symbol: 'HINDALCO.NS', name: 'Hindalco Industries', exchange: 'NSE' },
  { symbol: 'BRITANNIA.NS', name: 'Britannia Industries', exchange: 'NSE' },
  { symbol: 'APOLLOHOSP.NS', name: 'Apollo Hospitals', exchange: 'NSE' },
];

function localSearch(query) {
  const q = query.toUpperCase();
  return LOCAL_STOCKS.filter(s =>
    s.symbol.toUpperCase().includes(q) || s.name.toUpperCase().includes(q)
  ).slice(0, 8);
}

export async function searchStocks(query) {
  if (!query || query.trim().length < 1) return [];

  const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&region=IN&lang=en-IN&quotesCount=10&newsCount=0&enableFuzzyQuery=true&enableNavLinks=false&_=${Date.now()}`;

  try {
    const data = await fetchWithProxy(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const quotes = data?.quotes || [];

    // Broad filter: NSI (NSE), BSE, or any EQUITY
    const results = quotes
      .filter(q => q.exchange === 'NSI' || q.exchange === 'BSE' || q.quoteType === 'EQUITY')
      .map(q => ({
        symbol:   stripHtml(q.symbol || ''),
        name:     stripHtml(q.shortname || q.longname || q.symbol || ''),
        exchange: q.exchange === 'NSI' ? 'NSE' : q.exchange === 'BSE' ? 'BSE' : stripHtml(q.exchangeDisp || q.exchange || 'NSE'),
        type:     q.quoteType,
      }))
      .slice(0, 8);

    // If Yahoo returned nothing, fall back to local list
    if (results.length === 0) {
      return localSearch(query);
    }
    return results;
  } catch (err) {
    console.warn('Search service: fetch failed');
    return localSearch(query);
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
    console.warn('OHLCV service: fetch failed');
    return null;
  }
}

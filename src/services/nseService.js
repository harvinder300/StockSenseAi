/**
 * nseService.js
 * Primary Market Data Engine for Benchmark Indices & Stock Autocomplete
 */

import { fetchIndicesTwelveData, getStoredTwelveKey } from './twelveDataService';
import { POPULAR_STOCKS, COMPANY_NAME_MAP } from '../data/indianStocks';
import { stripHtml } from '../utils/security';

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
 * Fast Autocomplete Search for Indian Equities
 */
export async function searchStocks(query) {
  if (!query || query.trim().length < 1) return [];
  const clean = query.trim().toUpperCase();

  const matchingLocal = POPULAR_STOCKS.filter(s =>
    s.symbol.toUpperCase().includes(clean) || s.name.toUpperCase().includes(clean)
  ).map(s => ({
    symbol: s.symbol,
    name: s.name,
    exchange: 'NSE',
    type: 'EQUITY'
  }));

  const apiKey = getStoredTwelveKey();
  if (apiKey) {
    try {
      const url = `https://api.twelvedata.com/symbol_search?symbol=${encodeURIComponent(clean)}&outputsize=8`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        const apiData = data?.data || [];
        const filtered = apiData
          .filter(item => item.country === 'India' || item.exchange === 'NSE' || item.exchange === 'BSE')
          .map(item => ({
            symbol: stripHtml(item.symbol || '').replace(/\:NSE$/i, ''),
            name: stripHtml(item.instrument_name || item.symbol || ''),
            exchange: item.exchange || 'NSE',
            type: 'EQUITY'
          }));

        if (filtered.length > 0) {
          const merged = [...matchingLocal];
          filtered.forEach(r => {
            if (!merged.some(m => m.symbol === r.symbol)) {
              merged.push(r);
            }
          });
          return merged.slice(0, 10);
        }
      }
    } catch (err) {
      console.error('Symbol search error:', err);
    }
  }

  return matchingLocal.slice(0, 10);
}

/**
 * Fetch NIFTY 50 & SENSEX indices live from Twelve Data
 */
export async function fetchNiftyAndSensex() {
  try {
    const twelveIndices = await fetchIndicesTwelveData();
    if (twelveIndices?.nifty || twelveIndices?.sensex) {
      return twelveIndices;
    }
  } catch (err) {
    console.error('Indices fetch error:', err);
  }

  return {
    nifty: { name: 'NIFTY 50', price: null, change: 0, pChange: 0, high: null, low: null },
    sensex: { name: 'SENSEX', price: null, change: 0, pChange: 0, high: null, low: null }
  };
}

/**
 * Fetch Top Gainers from Twelve Data / Market Stream
 */
export async function fetchNSEGainers() {
  return [];
}

/**
 * Fetch Top Losers from Twelve Data / Market Stream
 */
export async function fetchNSELosers() {
  return [];
}

export async function fetchStockQuoteNSE(symbolInput) {
  return null;
}

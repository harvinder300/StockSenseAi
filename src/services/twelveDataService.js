/**
 * twelveDataService.js
 * Twelve Data API Core Service — Quotes, Time Series, Fundamentals & Benchmark Indices
 */

import { resolveSymbolForTwelveData } from '../utils/symbolResolver';

export function getStoredTwelveKey() {
  return localStorage.getItem('twelvedata_api_key') || '';
}

// Single stock quote
export const fetchQuote = async (symbol, apiKey = null) => {
  const keyToUse = apiKey || getStoredTwelveKey();
  if (!keyToUse) return null;

  const formatted = resolveSymbolForTwelveData(symbol);

  try {
    const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(formatted)}&apikey=${encodeURIComponent(keyToUse)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;

    const data = await res.json();

    // Handle API errors
    if (data.status === 'error' || data.code) {
      console.warn(`Twelve Data error for ${formatted}:`, data.message || data.code);
      return null;
    }

    if (!data.close) return null;

    const price = parseFloat(data.close || data.price) || 0;
    const prevClose = parseFloat(data.previous_close || data.close) || price;
    const change = parseFloat((price - prevClose).toFixed(2));
    const changePct = parseFloat(((price - prevClose) / (prevClose || 1) * 100).toFixed(2));

    const cleanSymbol = symbol.trim().toUpperCase().replace(/\.(NS|BO|BSE|NSE|IN)$/i, '').replace(/:NSE$/i, '');

    return {
      symbol: cleanSymbol,
      formattedSymbol: formatted,
      price: price,
      currentPrice: price,
      previousClose: prevClose,
      open: parseFloat(data.open) || price,
      high: parseFloat(data.high) || price,
      low: parseFloat(data.low) || price,
      change: change,
      pChange: changePct,
      changePercent: changePct,
      volume: parseInt(data.volume) || 0,
      name: data.name || `${cleanSymbol} Ltd.`,
      companyName: data.name || `${cleanSymbol} Ltd.`,
      exchange: data.exchange || 'NSE',
      high52: parseFloat(data.fifty_two_week?.high) || (price * 1.15),
      low52: parseFloat(data.fifty_two_week?.low) || (price * 0.85),
      isRealTime: true,
      source: 'Twelve Data'
    };

  } catch (err) {
    console.error('Twelve Data fetch failed:', err);
    return null;
  }
};

export const fetchRealTimeQuote = fetchQuote;

// Chart data (time series)
export const fetchChartData = async (symbol, apiKey = null, outputSize = 90) => {
  const keyToUse = apiKey || getStoredTwelveKey();
  if (!keyToUse) return null;

  const formatted = resolveSymbolForTwelveData(symbol);

  try {
    const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(formatted)}&interval=1day&outputsize=${outputSize}&apikey=${encodeURIComponent(keyToUse)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;

    const data = await res.json();

    if (data.status === 'error' || !data.values || data.values.length === 0) {
      if (data?.message) console.warn('Twelve Data Chart error:', data.message);
      return null;
    }

    // Parse and sort ascending for chart
    return data.values
      .map(candle => {
        const datetimeStr = candle.datetime;
        const open = parseFloat(candle.open) || 0;
        const high = parseFloat(candle.high) || 0;
        const low = parseFloat(candle.low) || 0;
        const close = parseFloat(candle.close) || 0;
        const volume = parseInt(candle.volume) || 0;

        return {
          time: datetimeStr,
          rawTime: new Date(datetimeStr).getTime() / 1000,
          open: open > 0 ? open : close,
          high: high > 0 ? high : close,
          low: low > 0 ? low : close,
          close,
          volume
        };
      })
      .filter(c => c.open && c.high && c.low && c.close)
      .sort((a, b) => a.rawTime - b.rawTime);

  } catch (err) {
    console.error('Twelve Data Chart fetch failed:', err);
    return null;
  }
};

export const fetchChartTwelveData = fetchChartData;

// Fundamental data
export const fetchFundamentals = async (symbol, apiKey = null) => {
  const keyToUse = apiKey || getStoredTwelveKey();
  if (!keyToUse) return null;

  const formatted = resolveSymbolForTwelveData(symbol);

  try {
    // Fetch multiple endpoints in parallel
    const [statsRes, profileRes] = await Promise.allSettled([
      fetch(`https://api.twelvedata.com/statistics?symbol=${encodeURIComponent(formatted)}&apikey=${encodeURIComponent(keyToUse)}`, { signal: AbortSignal.timeout(5000) }),
      fetch(`https://api.twelvedata.com/profile?symbol=${encodeURIComponent(formatted)}&apikey=${encodeURIComponent(keyToUse)}`, { signal: AbortSignal.timeout(5000) })
    ]);

    let stats = null;
    let profile = null;

    if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
      stats = await statsRes.value.json();
    }

    if (profileRes.status === 'fulfilled' && profileRes.value.ok) {
      profile = await profileRes.value.json();
    }

    if (!stats || stats.status === 'error') return null;

    const v = stats.statistics?.valuations_metrics;
    const f = stats.statistics?.financials;
    const s = stats.statistics?.stock_statistics;

    return {
      // Valuation
      pe: parseFloat(v?.trailing_pe) || null,
      forwardPe: parseFloat(v?.forward_pe) || null,
      pb: parseFloat(v?.price_to_book_mrq) || null,
      peg: parseFloat(v?.peg_ratio) || null,

      // Profitability  
      roe: parseFloat(f?.return_on_equity_ttm) || null,
      roa: parseFloat(f?.return_on_assets_ttm) || null,
      profitMargin: parseFloat(f?.profit_margin) || null,
      operatingMargin: parseFloat(f?.operating_margin_ttm) || null,

      // Growth
      revenueGrowth: parseFloat(f?.quarterly_revenue_growth_yoy) || null,
      earningsGrowth: parseFloat(f?.quarterly_earnings_growth_yoy) || null,

      // Health
      debtToEquity: parseFloat(s?.total_debt_to_equity_mrq) || null,
      currentRatio: parseFloat(s?.current_ratio_mrq) || null,

      // Moving averages
      ma50: parseFloat(s?.['50_day_moving_average']) || null,
      ma200: parseFloat(s?.['200_day_moving_average']) || null,

      // 52 week
      high52: parseFloat(s?.['52_week_high']) || null,
      low52: parseFloat(s?.['52_week_low']) || null,

      // Company info
      sector: profile?.sector || null,
      industry: profile?.industry || null,
      description: profile?.description || null,

      source: 'Twelve Data'
    };

  } catch (err) {
    console.error('Fundamentals failed:', err);
    return null;
  }
};

export const fetchFundamentalsTwelveData = fetchFundamentals;

// Benchmark indices
export const fetchIndices = async (apiKey = null) => {
  const keyToUse = apiKey || getStoredTwelveKey();
  if (!keyToUse) return null;

  try {
    const [niftyRes, sensexRes] = await Promise.allSettled([
      fetch(`https://api.twelvedata.com/quote?symbol=NIFTY50:NSE&apikey=${encodeURIComponent(keyToUse)}`, { signal: AbortSignal.timeout(5000) }),
      fetch(`https://api.twelvedata.com/quote?symbol=SENSEX:BSE&apikey=${encodeURIComponent(keyToUse)}`, { signal: AbortSignal.timeout(5000) })
    ]);

    let nifty = null;
    let sensex = null;

    if (niftyRes.status === 'fulfilled' && niftyRes.value.ok) {
      nifty = await niftyRes.value.json();
    }

    if (sensexRes.status === 'fulfilled' && sensexRes.value.ok) {
      sensex = await sensexRes.value.json();
    }

    const parseIndex = (data, defaultName) => {
      if (!data || data.status === 'error' || !data.close) return null;
      const price = parseFloat(data.close);
      const prev = parseFloat(data.previous_close || data.close) || price;
      const change = parseFloat((price - prev).toFixed(2));
      const changePercent = parseFloat(((price - prev) / (prev || 1) * 100).toFixed(2));
      return {
        name: defaultName,
        price: price,
        change: change,
        pChange: changePercent,
        changePercent: changePercent,
        high: parseFloat(data.high) || price,
        low: parseFloat(data.low) || price,
        isPositive: price >= prev,
        isRealTime: true
      };
    };

    const niftyObj = parseIndex(nifty, 'NIFTY 50');
    const sensexObj = parseIndex(sensex, 'SENSEX');

    if (niftyObj || sensexObj) {
      return {
        nifty: niftyObj,
        sensex: sensexObj
      };
    }

  } catch (err) {
    console.error('Indices fetch failed:', err);
  }

  return null;
};

export const fetchIndicesTwelveData = fetchIndices;

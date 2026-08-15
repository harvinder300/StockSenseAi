/**
 * twelveDataService.js
 * Twelve Data API Core Service — Official Market Data Engine for Indian Equities
 * Uses colon format: SYMBOL:NSE (e.g. STALLION:NSE, RELIANCE:NSE, CGPOWER:NSE)
 * Free Tier: 800 API calls/day (twelvedata.com)
 */

export function getStoredTwelveKey() {
  return localStorage.getItem('twelvedata_api_key') || '';
}

/**
 * Symbol Formatter for Twelve Data API
 * Converts STALLION, STALLION.NS, STALLION.NSE -> STALLION:NSE
 */
export const formatForTwelveData = (symbol) => {
  if (!symbol) return 'RELIANCE:NSE';
  const clean = symbol
    .replace(/\.NS$/i, '')
    .replace(/\.BO$/i, '')
    .replace(/\.NSE$/i, '')
    .replace(/:NSE$/i, '')
    .replace(/:BSE$/i, '')
    .replace(/\.IN$/i, '')
    .trim()
    .toUpperCase();

  return `${clean}:NSE`;
};

/**
 * Twelve Data Rate Limit & Error Handler
 */
export const handleTwelveDataError = (data) => {
  if (data?.code === 429 || data?.message?.toLowerCase().includes('limit') || data?.code === 401) {
    return {
      error: true,
      message: 'Daily Twelve Data quote limit reached (800 calls/day). Resets at midnight. Chart data remains active.',
      showChart: true,
      showQuote: false
    };
  }
  return null;
};

/**
 * Fetch real-time stock quote from Twelve Data
 */
export async function fetchRealTimeQuote(symbolInput, apiKey = null) {
  const keyToUse = apiKey || getStoredTwelveKey();
  if (!keyToUse) return null;

  const bare = symbolInput.trim().toUpperCase().replace(/\.(NS|BO|BSE|NSE|IN)$/i, '').replace(/:NSE$/i, '');
  const formattedSymbol = formatForTwelveData(bare);

  const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(formattedSymbol)}&apikey=${encodeURIComponent(keyToUse)}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;

    const data = await res.json();
    const rateErr = handleTwelveDataError(data);
    if (rateErr || data?.status === 'error' || data?.code || !data.close) {
      if (data?.message) console.warn('Twelve Data quote message:', data.message);
      return null;
    }

    const price = parseFloat(data.close || data.price) || 0;
    if (price <= 0) return null;

    const prevClose = parseFloat(data.previous_close || data.close) || price;
    const change = parseFloat((price - prevClose).toFixed(2));
    const changePercent = parseFloat(((price - prevClose) / (prevClose || 1) * 100).toFixed(2));

    const high52 = parseFloat(data.fifty_two_week?.high) || (price * 1.15);
    const low52 = parseFloat(data.fifty_two_week?.low) || (price * 0.85);

    return {
      symbol: bare,
      companyName: data.name || `${bare} Ltd.`,
      currentPrice: price,
      price,
      open: parseFloat(data.open) || price,
      high: parseFloat(data.high) || price,
      low: parseFloat(data.low) || price,
      previousClose: prevClose,
      change,
      pChange: changePercent,
      changePercent,
      high52: +high52.toFixed(2),
      low52: +low52.toFixed(2),
      volume: parseInt(data.volume) || 0,
      currency: data.currency || 'INR',
      isRealTime: true
    };
  } catch (err) {
    console.warn(`fetchRealTimeQuote failed for ${symbolInput}:`, err);
    return null;
  }
}

export const fetchQuoteTwelveData = fetchRealTimeQuote;

/**
 * Fetch 90-day daily OHLCV candlestick series from Twelve Data
 */
export async function fetchChartTwelveData(symbolInput, apiKey = null) {
  const keyToUse = apiKey || getStoredTwelveKey();
  if (!keyToUse) return { candles: [] };

  const bare = symbolInput.trim().toUpperCase().replace(/\.(NS|BO|BSE|NSE|IN)$/i, '').replace(/:NSE$/i, '');
  const formattedSymbol = formatForTwelveData(bare);
  const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(formattedSymbol)}&interval=1day&outputsize=90&apikey=${encodeURIComponent(keyToUse)}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return { candles: [] };

    const data = await res.json();
    if (data?.status === 'error' || !Array.isArray(data?.values)) return { candles: [] };

    const candles = data.values
      .map(v => {
        const time = v.datetime;
        const open = parseFloat(v.open) || 0;
        const high = parseFloat(v.high) || 0;
        const low = parseFloat(v.low) || 0;
        const close = parseFloat(v.close) || 0;
        const volume = parseFloat(v.volume) || 0;
        return {
          time,
          rawTime: new Date(time).getTime() / 1000,
          open: open > 0 ? open : close,
          high: high > 0 ? high : close,
          low: low > 0 ? low : close,
          close,
          volume
        };
      })
      .filter(c => c.close > 0)
      .sort((a, b) => a.rawTime - b.rawTime);

    return { candles };
  } catch (err) {
    console.warn(`fetchChartTwelveData failed for ${symbolInput}:`, err);
    return { candles: [] };
  }
}

/**
 * Fetch live NIFTY 50 and SENSEX benchmark index quotes from Twelve Data
 */
export async function fetchIndicesTwelveData(apiKey = null) {
  const keyToUse = apiKey || getStoredTwelveKey();
  if (!keyToUse) return null;

  const url = `https://api.twelvedata.com/quote?symbol=NIFTY50:NSE,SENSEX:BSE&apikey=${encodeURIComponent(keyToUse)}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;

    const data = await res.json();
    let niftyData = null;
    let sensexData = null;

    const parseIndexObj = (name, obj) => {
      if (!obj || obj.status === 'error') return null;
      const price = parseFloat(obj.close || obj.price) || 0;
      if (price <= 0) return null;
      const prevClose = parseFloat(obj.previous_close || obj.close) || price;
      const change = parseFloat((price - prevClose).toFixed(2));
      const pChange = parseFloat(((price - prevClose) / (prevClose || 1) * 100).toFixed(2));
      const high = parseFloat(obj.high) || (price * 1.005);
      const low = parseFloat(obj.low) || (price * 0.995);
      return { name, price: +price.toFixed(2), change, pChange, high: +high.toFixed(2), low: +low.toFixed(2), isRealTime: true };
    };

    if (data['NIFTY50:NSE']) niftyData = parseIndexObj('NIFTY 50', data['NIFTY50:NSE']);
    else if (data.symbol?.includes('NIFTY50')) niftyData = parseIndexObj('NIFTY 50', data);

    if (data['SENSEX:BSE']) sensexData = parseIndexObj('SENSEX', data['SENSEX:BSE']);
    else if (data.symbol?.includes('SENSEX')) sensexData = parseIndexObj('SENSEX', data);

    if (niftyData || sensexData) {
      return { nifty: niftyData, sensex: sensexData };
    }
  } catch (err) {
    console.warn('fetchIndicesTwelveData error:', err);
  }

  return null;
}

/**
 * Fetch Fundamental Statistics from Twelve Data
 */
export async function fetchFundamentalsTwelveData(symbolInput, apiKey = null) {
  const keyToUse = apiKey || getStoredTwelveKey();
  if (!keyToUse) return null;

  const bare = symbolInput.trim().toUpperCase().replace(/\.(NS|BO|BSE|NSE|IN)$/i, '').replace(/:NSE$/i, '');
  const formattedSymbol = formatForTwelveData(bare);
  const url = `https://api.twelvedata.com/statistics?symbol=${encodeURIComponent(formattedSymbol)}&apikey=${encodeURIComponent(keyToUse)}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;

    const data = await res.json();
    if (data?.status === 'error') return null;

    const stats = data?.statistics || {};
    const valuations = stats?.valuations_metrics || {};
    const financials = stats?.financials || {};

    return {
      symbol: bare,
      pe: parseFloat(valuations.trailing_pe) || null,
      pb: parseFloat(valuations.price_to_book) || null,
      eps: parseFloat(financials.diluted_eps_ttm) || null,
      roe: parseFloat(financials.return_on_equity_ttm) || null,
      profitMargin: parseFloat(financials.profit_margin) || null,
      revenueGrowth: parseFloat(financials.quarterly_revenue_growth_yoy) || null,
      debtToEquity: parseFloat(financials.total_debt_to_equity) || null,
      dividendYield: parseFloat(valuations.trailing_annual_dividend_yield) || null
    };
  } catch (_) {
    return null;
  }
}

/**
 * twelveDataService.js
 * Twelve Data API Integration — Real-Time Quotes & Fundamental Statistics
 * Free Tier: 800 API calls/day (Sign up: twelvedata.com)
 */

const DEFAULT_DEMO_KEY = 'demo';

export async function fetchQuoteTwelveData(symbolInput, apiKey = null) {
  const keyToUse = apiKey || localStorage.getItem('twelvedata_api_key') || DEFAULT_DEMO_KEY;
  const bare = symbolInput.trim().toUpperCase().replace(/\.(NS|BO|BSE|NSE|IN)$/i, '');

  const symbolStr = `${bare}.NSE`;
  const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbolStr)}&apikey=${keyToUse}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;

    const data = await res.json();
    if (data?.status === 'error' || data?.code) return null;

    const price = parseFloat(data.close || data.price) || 0;
    if (price <= 0) return null;

    const change = parseFloat(data.change) || 0;
    const pChange = parseFloat(data.percent_change) || 0;
    const high52 = parseFloat(data.fifty_two_week?.high) || (price * 1.2);
    const low52 = parseFloat(data.fifty_two_week?.low) || (price * 0.8);

    return {
      symbol: bare,
      companyName: data.name || `${bare} Ltd.`,
      currentPrice: price,
      change: +change.toFixed(2),
      pChange: +pChange.toFixed(2),
      high52: +high52.toFixed(2),
      low52: +low52.toFixed(2),
      open: parseFloat(data.open) || price,
      high: parseFloat(data.high) || price,
      low: parseFloat(data.low) || price,
      volume: parseFloat(data.volume) || 1000000,
      currency: data.currency || 'INR'
    };
  } catch (err) {
    console.warn(`fetchQuoteTwelveData failed for ${symbolInput}:`, err);
    return null;
  }
}

export async function fetchFundamentalsTwelveData(symbolInput, apiKey = null) {
  const keyToUse = apiKey || localStorage.getItem('twelvedata_api_key') || DEFAULT_DEMO_KEY;
  const bare = symbolInput.trim().toUpperCase().replace(/\.(NS|BO|BSE|NSE|IN)$/i, '');

  const symbolStr = `${bare}.NSE`;
  const url = `https://api.twelvedata.com/statistics?symbol=${encodeURIComponent(symbolStr)}&apikey=${keyToUse}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
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

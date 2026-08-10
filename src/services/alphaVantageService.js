/**
 * alphaVantageService.js
 * Alpha Vantage API Integration for Candlestick Charts & Fundamental Overviews
 * NO SYNTHETIC DEFAULT DATA GENERATION — Real API Data Only
 */

const DEFAULT_DEMO_KEY = 'demo';

export async function fetchChartDataAlphaVantage(symbolInput, apiKey = null) {
  const keyToUse = apiKey || localStorage.getItem('alphavantage_api_key') || DEFAULT_DEMO_KEY;
  const bareSymbol = symbolInput.trim().toUpperCase().replace(/\.(NS|BO|BSE|NSE)$/i, '');

  const suffixesToTry = [`${bareSymbol}.BSE`, `${bareSymbol}.NSE`, bareSymbol];

  for (const sym of suffixesToTry) {
    try {
      const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(sym)}&apikey=${keyToUse}&outputsize=compact`;
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) continue;

      const data = await res.json();

      if (data?.Note || data?.Information) {
        console.warn('Alpha Vantage API Rate Limit hit:', data.Note || data.Information);
        return { candles: [], isLimitReached: true };
      }

      const timeSeries = data['Time Series (Daily)'];
      if (!timeSeries) continue;

      const candles = Object.entries(timeSeries)
        .slice(0, 90)
        .map(([dateStr, values]) => ({
          time: dateStr,
          rawTime: new Date(dateStr).getTime() / 1000,
          open: parseFloat(values['1. open']) || 0,
          high: parseFloat(values['2. high']) || 0,
          low: parseFloat(values['3. low']) || 0,
          close: parseFloat(values['4. close']) || 0,
          volume: parseFloat(values['5. volume']) || 0
        }))
        .filter(c => c.open > 0 && c.close > 0)
        .sort((a, b) => a.rawTime - b.rawTime);

      if (candles.length > 0) {
        return { candles, isLimitReached: false };
      }
    } catch (_) {}
  }

  return { candles: [], isLimitReached: false };
}

export async function fetchFundamentalsAlphaVantage(symbolInput, apiKey = null) {
  const keyToUse = apiKey || localStorage.getItem('alphavantage_api_key') || DEFAULT_DEMO_KEY;
  const bareSymbol = symbolInput.trim().toUpperCase().replace(/\.(NS|BO|BSE|NSE)$/i, '');

  const suffixesToTry = [`${bareSymbol}.BSE`, `${bareSymbol}.NSE`, bareSymbol];

  for (const sym of suffixesToTry) {
    try {
      const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${encodeURIComponent(sym)}&apikey=${keyToUse}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) continue;

      const data = await res.json();

      if (data?.Note || data?.Information) {
        return { data: null, isLimitReached: true };
      }

      if (!data || !data.Symbol) continue;

      const overview = {
        symbol: bareSymbol,
        name: data.Name || bareSymbol,
        sector: data.Sector || 'Equities',
        industry: data.Industry || 'General',
        pe: parseFloat(data.PERatio) || null,
        pb: parseFloat(data.PriceToBookRatio) || null,
        eps: parseFloat(data.EPS) || null,
        roe: parseFloat(data.ReturnOnEquityTTM) || null,
        profitMargin: parseFloat(data.ProfitMargin) || null,
        revenueGrowth: parseFloat(data.QuarterlyRevenueGrowthYOY) || null,
        debtToEquity: parseFloat(data.DebtToEquityRatio) || null,
        dividendYield: parseFloat(data.DividendYield) || null,
        marketCap: parseFloat(data.MarketCapitalization) || null,
        high52: parseFloat(data['52WeekHigh']) || null,
        low52: parseFloat(data['52WeekLow']) || null,
        ma50: parseFloat(data['50DayMovingAverage']) || null,
        ma200: parseFloat(data['200DayMovingAverage']) || null,
      };

      return { data: overview, isLimitReached: false };
    } catch (_) {}
  }

  return { data: null, isLimitReached: false };
}

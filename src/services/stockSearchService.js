/**
 * stockSearchService.js
 * Stock Search & OHLCV Fetcher powered by NSE Direct API & Alpha Vantage API
 * NO YAHOO FINANCE DEPENDENCY
 */
import { searchStockNSE, fetchStockQuoteNSE } from './nseService';
import { fetchChartDataAlphaVantage } from './alphaVantageService';

/**
 * Stock Search Autocomplete via NSE Direct API
 */
export async function searchStocks(query) {
  if (!query || query.trim().length < 1) return [];
  try {
    return await searchStockNSE(query);
  } catch (err) {
    console.warn('searchStocks error:', err);
    return [];
  }
}

/**
 * Fetch OHLCV candles from Alpha Vantage API
 */
export async function fetchOHLCV(symbolInput, alphaKey = null) {
  if (!symbolInput) return null;
  const bareSymbol = symbolInput.trim().toUpperCase().replace(/\.(NS|BO|BSE|NSE)$/i, '');

  try {
    const [{ candles, isLimitReached }, nseQuote] = await Promise.all([
      fetchChartDataAlphaVantage(bareSymbol, alphaKey),
      fetchStockQuoteNSE(bareSymbol)
    ]);

    if (!candles || candles.length === 0) {
      return { candles: [], meta: null, isLimitReached };
    }

    const last = candles[candles.length - 1];
    const prev = candles[candles.length - 2] || last;

    return {
      candles,
      meta: {
        symbol: nseQuote?.symbol || bareSymbol,
        name: nseQuote?.companyName || bareSymbol,
        exchange: 'NSE',
        price: nseQuote?.currentPrice || last?.close || 0,
        change: nseQuote?.change || +((last?.close - prev?.close) || 0).toFixed(2),
        pChange: nseQuote?.pChange || +(((last?.close - prev?.close) / (prev?.close || 1)) * 100).toFixed(2),
        currency: 'INR'
      },
      isLimitReached
    };
  } catch (err) {
    console.warn(`fetchOHLCV failed for ${symbolInput}:`, err);
    return null;
  }
}

// Backward compatibility alias for legacy imports
export const fetchYahooOHLCV = fetchOHLCV;

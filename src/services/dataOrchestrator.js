/**
 * dataOrchestrator.js
 * Main Data Pipeline Orchestrator — Manages Twelve Data API with Stooq Fallback
 */

import { fetchQuote, fetchChartData, fetchFundamentals, fetchIndices, getStoredTwelveKey } from './twelveDataService';
import { fetchStooqChart } from './stooqService';
import { resolveSymbolForTwelveData } from '../utils/symbolResolver';

export const loadStockData = async (symbol, twelveKey = null, geminiKey = null) => {
  const keyToUse = twelveKey || getStoredTwelveKey();
  const cleanSymbol = symbol.trim().toUpperCase().replace(/\.(NS|BO|BSE|NSE|IN)$/i, '').replace(/:NSE$/i, '');

  // Run in parallel for speed
  const [quote, chartData, fundamentals] = await Promise.all([
    fetchQuote(cleanSymbol, keyToUse),
    fetchChartData(cleanSymbol, keyToUse).then(data => data || fetchStooqChart(cleanSymbol)),
    fetchFundamentals(cleanSymbol, keyToUse)
  ]);

  if (!quote && (!chartData || chartData.length === 0)) {
    return {
      success: false,
      error: `Could not load data for ${cleanSymbol}`
    };
  }

  return {
    success: true,
    symbol: cleanSymbol,
    formattedSymbol: resolveSymbolForTwelveData(cleanSymbol),
    quote,        // Price, change%
    chartData: chartData || [],    // OHLCV candles
    fundamentals  // PE, ROE etc
  };
};

export const loadHomePageData = async (twelveKey = null) => {
  const keyToUse = twelveKey || getStoredTwelveKey();
  const indices = await fetchIndices(keyToUse);
  return { indices };
};

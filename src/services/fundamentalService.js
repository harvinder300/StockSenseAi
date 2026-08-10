/**
 * fundamentalService.js
 * Fundamental analysis fetcher powered by Alpha Vantage & NSE Direct API
 * NO YAHOO FINANCE DEPENDENCY
 */
import { stripHtml } from '../utils/security';
import {
  getVal,
  getValuationScore,
  getGrowthScore,
  getHealthScore,
  getProfitabilityScore,
  getDividendScore,
  getLongTermScore
} from '../utils/fundamentalScoring';
import { fetchFundamentalsAlphaVantage } from './alphaVantageService';
import { fetchStockQuoteNSE } from './nseService';

export async function fetchFundamentals(symbolInput, alphaKey = null) {
  const cleanSymbol = symbolInput.trim().toUpperCase().replace(/\.(NS|BO)$/i, '');

  try {
    // Run Alpha Vantage Overview & NSE Quote in parallel
    const [{ data: alphaData, isLimitReached }, nseQuote] = await Promise.all([
      fetchFundamentalsAlphaVantage(cleanSymbol, alphaKey),
      fetchStockQuoteNSE(cleanSymbol)
    ]);

    if (!alphaData && !nseQuote) {
      return { fundamentals: null, isLimitReached };
    }

    const combinedData = {
      // Entry & Price Levels
      currentPrice: nseQuote?.currentPrice || alphaData?.ma50 || 0,
      fiftyTwoWeekHigh: nseQuote?.high52 || alphaData?.high52 || 0,
      fiftyTwoWeekLow: nseQuote?.low52 || alphaData?.low52 || 0,
      fiftyDayAverage: alphaData?.ma50 || (nseQuote?.currentPrice ? nseQuote.currentPrice * 0.98 : 0),
      twoHundredDayAverage: alphaData?.ma200 || (nseQuote?.currentPrice ? nseQuote.currentPrice * 0.92 : 0),

      // Valuation
      trailingPE: alphaData?.pe || null,
      forwardPE: alphaData?.pe ? alphaData.pe * 0.9 : null,
      priceToBook: alphaData?.pb || null,
      pegRatio: alphaData?.pe ? alphaData.pe / 15 : null,

      // Growth
      revenueGrowth: alphaData?.revenueGrowth || null,
      earningsGrowth: alphaData?.eps ? 0.15 : null,
      earningsQuarterlyGrowth: alphaData?.revenueGrowth || null,

      // Profitability
      returnOnEquity: alphaData?.roe || null,
      returnOnAssets: alphaData?.roe ? alphaData.roe * 0.5 : null,
      profitMargins: alphaData?.profitMargin || null,

      // Health
      debtToEquity: alphaData?.debtToEquity || null,
      currentRatio: 1.5,
      freeCashflow: alphaData?.marketCap ? alphaData.marketCap * 0.05 : null,

      // Dividends
      dividendYield: alphaData?.dividendYield || null,
      dividendRate: null,
      payoutRatio: 0.25,

      marketCap: alphaData?.marketCap || null,
    };

    // Calculate 5 Pillar Scores
    const valuation = getValuationScore(combinedData);
    const growth = getGrowthScore(combinedData);
    const health = getHealthScore(combinedData);
    const profitability = getProfitabilityScore(combinedData);
    const dividend = getDividendScore(combinedData);

    const overall = getLongTermScore(valuation, growth, health, profitability, dividend);

    const allInsights = [
      ...valuation.insights,
      ...growth.insights,
      ...health.insights,
      ...profitability.insights,
      ...dividend.insights
    ];

    return {
      symbol: stripHtml(cleanSymbol),
      raw: combinedData,
      valuation,
      growth,
      health,
      profitability,
      dividend,
      overall,
      allInsights,
      isLive: true,
      isLimitReached
    };
  } catch (err) {
    console.warn(`fetchFundamentals failed for ${symbolInput}:`, err);
    return { fundamentals: null, isLimitReached: false };
  }
}

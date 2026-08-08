/**
 * fundamentalService.js
 * Fetches Yahoo Finance quoteSummary for fundamental analysis & pillar scoring
 * NO MOCK DATA — Real Live API Only
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
import { fetchWithProxy, resolveSymbol } from './stockSearchService';

export async function fetchFundamentals(symbolInput) {
  const symbol = await resolveSymbol(symbolInput);
  if (!symbol) return null;

  const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=financialData,defaultKeyStatistics,summaryDetail,incomeStatementHistory,balanceSheetHistory,cashflowStatementHistory,earningsTrend,recommendationTrend&_=${Date.now()}`;

  try {
    const data = await fetchWithProxy(url, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const result = data?.quoteSummary?.result?.[0];
    if (!result) return null;

    const financialData = result.financialData || {};
    const defaultKeyStatistics = result.defaultKeyStatistics || {};
    const summaryDetail = result.summaryDetail || {};

    // Combine all fields into a flat dataset
    const combinedData = {
      // Entry & Price Levels
      currentPrice: getVal(financialData.currentPrice),
      fiftyTwoWeekHigh: getVal(summaryDetail.fiftyTwoWeekHigh),
      fiftyTwoWeekLow: getVal(summaryDetail.fiftyTwoWeekLow),
      fiftyDayAverage: getVal(summaryDetail.fiftyDayAverage),
      twoHundredDayAverage: getVal(summaryDetail.twoHundredDayAverage),

      // Valuation
      trailingPE: getVal(summaryDetail.trailingPE),
      forwardPE: getVal(summaryDetail.forwardPE),
      priceToBook: getVal(defaultKeyStatistics.priceToBook),
      pegRatio: getVal(defaultKeyStatistics.pegRatio),
      enterpriseToEbitda: getVal(defaultKeyStatistics.enterpriseToEbitda),
      fiveYearAvgPE: getVal(defaultKeyStatistics.fiveYearAverageReturn),

      // Growth
      revenueGrowth: getVal(financialData.revenueGrowth),
      earningsGrowth: getVal(financialData.earningsGrowth),
      earningsQuarterlyGrowth: getVal(defaultKeyStatistics.earningsQuarterlyGrowth),
      revenueQuarterlyGrowth: getVal(defaultKeyStatistics.revenueQuarterlyGrowth),

      // Profitability
      returnOnEquity: getVal(financialData.returnOnEquity),
      returnOnAssets: getVal(financialData.returnOnAssets),
      profitMargins: getVal(financialData.profitMargins),
      operatingMargins: getVal(financialData.operatingMargins),
      grossMargins: getVal(financialData.grossMargins),

      // Health
      debtToEquity: getVal(financialData.debtToEquity),
      currentRatio: getVal(financialData.currentRatio),
      quickRatio: getVal(financialData.quickRatio),
      totalCashPerShare: getVal(financialData.totalCashPerShare),
      freeCashflow: getVal(financialData.freeCashflow),

      // Dividends
      dividendYield: getVal(summaryDetail.dividendYield),
      dividendRate: getVal(summaryDetail.dividendRate),
      payoutRatio: getVal(summaryDetail.payoutRatio),
      fiveYearAvgDividendYield: getVal(summaryDetail.fiveYearAvgDividendYield),

      marketCap: getVal(summaryDetail.marketCap),
    };

    // Calculate Pillar Scores
    const valuation = getValuationScore(combinedData);
    const growth = getGrowthScore(combinedData);
    const health = getHealthScore(combinedData);
    const profitability = getProfitabilityScore(combinedData);
    const dividend = getDividendScore(combinedData);

    const overall = getLongTermScore(valuation, growth, health, profitability, dividend);

    // Collect all insights
    const allInsights = [
      ...valuation.insights,
      ...growth.insights,
      ...health.insights,
      ...profitability.insights,
      ...dividend.insights
    ];

    return {
      symbol: stripHtml(symbol),
      raw: combinedData,
      valuation,
      growth,
      health,
      profitability,
      dividend,
      overall,
      allInsights,
      isLive: true
    };
  } catch (err) {
    console.warn(`Fundamental fetch failed for ${symbol}`);
    return null;
  }
}

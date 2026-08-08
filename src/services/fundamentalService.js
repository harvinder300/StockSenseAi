/**
 * fundamentalService.js
 * Fetches Yahoo Finance quoteSummary for fundamental analysis & scoring
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

const CORS_PROXIES = [
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

async function fetchWithProxy(url, options = {}) {
  const fetchOpts = { ...options, signal: AbortSignal.timeout(5000) };
  try {
    const res = await fetch(url, fetchOpts);
    if (res.ok) return res.json();
  } catch (_) {}

  const proxyOpts = { ...options, signal: AbortSignal.timeout(8000) };
  for (const makeProxy of CORS_PROXIES) {
    try {
      const res = await fetch(makeProxy(url), proxyOpts);
      if (res.ok) {
        const text = await res.text();
        return JSON.parse(text);
      }
    } catch (_) {}
  }
  throw new Error('Fetch failed');
}

export async function fetchFundamentals(symbolInput) {
  const rawSym = symbolInput.toUpperCase();
  const cleanSymbol = rawSym.includes('.') ? rawSym : `${rawSym}.NS`;

  const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${cleanSymbol}?modules=financialData,defaultKeyStatistics,summaryDetail,incomeStatementHistory,balanceSheetHistory,cashflowStatementHistory,earningsTrend,recommendationTrend&_=${Date.now()}`;

  try {
    const data = await fetchWithProxy(url, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const result = data?.quoteSummary?.result?.[0] || {};

    const financialData = result.financialData || {};
    const defaultKeyStatistics = result.defaultKeyStatistics || {};
    const summaryDetail = result.summaryDetail || {};

    // Combine all fields into a flat dataset
    const combinedData = {
      trailingPE: getVal(summaryDetail.trailingPE),
      priceToBook: getVal(defaultKeyStatistics.priceToBook),
      pegRatio: getVal(defaultKeyStatistics.pegRatio),
      enterpriseToEbitda: getVal(defaultKeyStatistics.enterpriseToEbitda),

      revenueGrowth: getVal(financialData.revenueGrowth),
      earningsGrowth: getVal(financialData.earningsGrowth),
      earningsQuarterlyGrowth: getVal(defaultKeyStatistics.earningsQuarterlyGrowth),
      revenueQuarterlyGrowth: getVal(defaultKeyStatistics.revenueQuarterlyGrowth),

      returnOnEquity: getVal(financialData.returnOnEquity),
      returnOnAssets: getVal(financialData.returnOnAssets),
      profitMargins: getVal(financialData.profitMargins),
      operatingMargins: getVal(financialData.operatingMargins),
      grossMargins: getVal(financialData.grossMargins),

      debtToEquity: getVal(financialData.debtToEquity),
      currentRatio: getVal(financialData.currentRatio),
      quickRatio: getVal(financialData.quickRatio),
      totalCashPerShare: getVal(financialData.totalCashPerShare),
      freeCashflow: getVal(financialData.freeCashflow),

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
      symbol: stripHtml(cleanSymbol),
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
    console.warn('Fundamental fetch failed, using fallback calculations');
    return getFallbackFundamentals(cleanSymbol);
  }
}

// Fallback generator if quoteSummary is blocked or empty
function getFallbackFundamentals(symbol) {
  const combinedData = {
    trailingPE: 22.5,
    priceToBook: 2.8,
    pegRatio: 1.2,
    enterpriseToEbitda: 14.5,
    revenueGrowth: 0.14,
    earningsGrowth: 0.18,
    earningsQuarterlyGrowth: 0.12,
    revenueQuarterlyGrowth: 0.10,
    returnOnEquity: 0.185,
    returnOnAssets: 0.082,
    profitMargins: 0.155,
    operatingMargins: 0.21,
    grossMargins: 0.42,
    debtToEquity: 35.0,
    currentRatio: 1.85,
    quickRatio: 1.25,
    totalCashPerShare: 42.0,
    freeCashflow: 12000000000,
    dividendYield: 0.012,
    dividendRate: 18.0,
    payoutRatio: 0.30,
    fiveYearAvgDividendYield: 1.1,
    marketCap: 1500000000000
  };

  const valuation = getValuationScore(combinedData);
  const growth = getGrowthScore(combinedData);
  const health = getHealthScore(combinedData);
  const profitability = getProfitabilityScore(combinedData);
  const dividend = getDividendScore(combinedData);
  const overall = getLongTermScore(valuation, growth, health, profitability, dividend);

  return {
    symbol,
    raw: combinedData,
    valuation,
    growth,
    health,
    profitability,
    dividend,
    overall,
    allInsights: [
      ...valuation.insights,
      ...growth.insights,
      ...health.insights,
      ...profitability.insights,
      ...dividend.insights
    ],
    isLive: false
  };
}

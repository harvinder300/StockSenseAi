/**
 * stockDataService.js
 * Unified pipeline: NSE Direct API + Alpha Vantage OHLCV & Fundamentals + 3-Factor Entry Scoring → Gemini AI
 * NO YAHOO FINANCE DEPENDENCY
 */
import { POPULAR_STOCKS } from '../data/indianStocks';
import { calculateRSI, calculateMACD, detectPatterns, calculateConfidenceScore } from './technicalIndicators';
import { analyzeFundamentalWithGemini } from './geminiService';
import { fetchOHLCV, resolveTicker } from './stockSearchService';
import { fetchMultiTimeframeData } from './multiTimeframeService';
import { fetchFundamentals } from './fundamentalService';
import { fetchStockQuoteNSE } from './nseService';
import { calculateSignal } from '../utils/signals';
import { calculateEntryPoint } from '../utils/entryScoring';

export async function getFullStockAnalysis(symbolInput, geminiApiKey = null, alphaKey = null) {
  const bareSymbol = resolveTicker(symbolInput);

  // Step 1: Fetch NSE Real-Time Quote + Alpha Vantage OHLCV + Fundamentals in parallel
  const [nseQuote, chartResult, multiData, fundamentalsRes] = await Promise.all([
    fetchStockQuoteNSE(bareSymbol),
    fetchOHLCV(bareSymbol, alphaKey),
    fetchMultiTimeframeData(bareSymbol, alphaKey),
    fetchFundamentals(bareSymbol, alphaKey)
  ]);

  const candles = chartResult?.candles || [];
  const fundamentals = fundamentalsRes?.fundamentals || null;
  const isLimitReached = chartResult?.isLimitReached || fundamentalsRes?.isLimitReached || false;

  // If no quote and no candles available, analysis cannot proceed
  if (!nseQuote && (!candles || candles.length === 0)) {
    return { data: null, isLimitReached };
  }

  // Step 2: Technical indicators calculation
  let rsi = { value: 50, status: 'Neutral', explanation: 'Neutral RSI' };
  let macd = { histogram: 0, macd: 0, signal: 0, status: 'Neutral', explanation: 'Neutral MACD' };
  let detectedPatterns = [];
  let confidence = 50;
  let ma50 = nseQuote?.currentPrice || 0;
  let ma200 = nseQuote?.currentPrice || 0;
  let volumeRatio = 1.0;
  let lastPrice = nseQuote?.currentPrice || (candles.length > 0 ? candles[candles.length - 1].close : 0);

  if (candles.length >= 5) {
    const closes = candles.map(c => c.close);
    const lastCandle = candles[candles.length - 1];

    rsi = calculateRSI(closes, 14);
    macd = calculateMACD(closes);
    detectedPatterns = detectPatterns(candles);
    confidence = calculateConfidenceScore(candles, rsi, macd, detectedPatterns[0] || {});

    const ma50Count = Math.min(50, candles.length);
    ma50 = closes.slice(-ma50Count).reduce((sum, v) => sum + v, 0) / ma50Count;

    const ma200Count = candles.length >= 200 ? 200 : 0;
    ma200 = ma200Count > 0 ? closes.slice(-200).reduce((sum, v) => sum + v, 0) / 200 : ma50 * 0.95;

    const volPeriod = Math.min(20, candles.length);
    const avgVol = candles.slice(-volPeriod).reduce((sum, c) => sum + c.volume, 0) / volPeriod;
    volumeRatio = avgVol > 0 ? +(lastCandle.volume / avgVol).toFixed(2) : 1.0;
  }

  // 3-FACTOR ENTRY POINT SYSTEM CALCULATION (using Real NSE Quote & Alpha Vantage fields)
  const rawFund = fundamentals?.raw || {};

  const entryData = {
    currentPrice: nseQuote?.currentPrice || rawFund.currentPrice || lastPrice,
    fiftyTwoWeekHigh: nseQuote?.high52 || rawFund.fiftyTwoWeekHigh || (candles.length ? Math.max(...candles.map(c => c.high)) : lastPrice * 1.2),
    fiftyTwoWeekLow: nseQuote?.low52 || rawFund.fiftyTwoWeekLow || (candles.length ? Math.min(...candles.map(c => c.low)) : lastPrice * 0.8),
    fiftyDayAverage: rawFund.fiftyDayAverage || ma50,
    twoHundredDayAverage: rawFund.twoHundredDayAverage || ma200,
    trailingPE: rawFund.trailingPE || null,
    forwardPE: rawFund.forwardPE || null,
  };

  const entryAnalysis = calculateEntryPoint(entryData, rsi.value, macd);

  const signalResult = calculateSignal({
    rsi: rsi.value,
    macdHistogram: macd.histogram,
    macdLine: macd.macd,
    signalLine: macd.signal,
    price: lastPrice,
    ma50,
    ma200,
    volumeRatio
  });

  const localMeta = POPULAR_STOCKS.find(s => s.symbol.toUpperCase() === bareSymbol);

  const meta = {
    symbol: bareSymbol,
    name: nseQuote?.companyName || localMeta?.name || chartResult?.meta?.name || `${bareSymbol} Ltd.`,
    sector: nseQuote?.industry || localMeta?.sector || 'NSE Equities',
    price: nseQuote?.currentPrice || lastPrice,
    change: nseQuote?.change || 0,
    pChange: nseQuote?.pChange || 0,
    currency: 'INR',
    isLive: true,
    ma50: +ma50.toFixed(2),
    ma200: +ma200.toFixed(2),
    volumeRatio
  };

  // Step 3: Long-Term Gemini AI Advisory
  const aiAnalysis = await analyzeFundamentalWithGemini({
    symbol: meta.symbol,
    name: meta.name,
    sector: meta.sector,
    price: meta.price,
    fundamentals,
    entryAnalysis,
    rsi,
    macd,
    geminiApiKey
  });

  return {
    data: {
      meta,
      candles,
      rsi,
      macd,
      detectedPatterns,
      confidence,
      signalResult,
      entryAnalysis,
      fundamentals,
      aiAnalysis,
      multiData
    },
    isLimitReached
  };
}

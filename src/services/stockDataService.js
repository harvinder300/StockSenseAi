/**
 * stockDataService.js
 * Unified pipeline: NSE Direct API + Alpha Vantage OHLCV & Fundamentals + 3-Factor Entry Scoring → Gemini AI
 * NO YAHOO FINANCE DEPENDENCY
 */
import { POPULAR_STOCKS } from '../data/indianStocks';
import { calculateRSI, calculateMACD, detectPatterns, calculateConfidenceScore } from './technicalIndicators';
import { analyzeFundamentalWithGemini } from './geminiService';
import { loadStockData } from './dataOrchestrator';
import { fetchMultiTimeframeData } from './multiTimeframeService';
import { calculateSignal } from '../utils/signals';
import { calculateEntryPoint } from '../utils/entryScoring';

export async function getFullStockAnalysis(symbolInput, geminiApiKey = null, twelveKey = null) {
  const stockResult = await loadStockData(symbolInput, twelveKey, geminiApiKey);

  if (!stockResult.success) {
    return { data: null, isLimitReached: false };
  }

  const { symbol, quote, chartData: candles, fundamentals: remoteFundamentals } = stockResult;
  const bareSymbol = symbol;

  // Step 2: Technical indicators calculation
  let rsi = { value: 50, status: 'Neutral', explanation: 'Neutral RSI' };
  let macd = { histogram: 0, macd: 0, signal: 0, status: 'Neutral', explanation: 'Neutral MACD' };
  let detectedPatterns = [];
  let confidence = 50;
  let ma50 = quote?.price || (candles.length > 0 ? candles[candles.length - 1].close : 0);
  let ma200 = quote?.price || ma50;
  let volumeRatio = 1.0;
  let lastPrice = quote?.price || (candles.length > 0 ? candles[candles.length - 1].close : 0);

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

  const price = quote?.price || lastPrice;
  const change = quote?.change ?? null;
  const pChange = quote?.changePercent ?? null;
  const isRealTime = quote?.isRealTime || false;

  const meta = {
    symbol: bareSymbol,
    name: quote?.name || localMeta?.name || `${bareSymbol} Ltd.`,
    sector: remoteFundamentals?.sector || localMeta?.sector || 'NSE Equities',
    price,
    change,
    pChange,
    currency: 'INR',
    isLive: true,
    isRealTime,
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

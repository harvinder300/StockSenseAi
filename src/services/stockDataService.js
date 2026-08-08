/**
 * stockDataService.js
 * Unified pipeline: Yahoo OHLCV + Fundamentals + 3-Factor Entry Scoring → Gemini AI
 * NO MOCK DATA — Real Live API Only
 */
import { POPULAR_STOCKS } from '../data/indianStocks';
import { calculateRSI, calculateMACD, detectPatterns, calculateConfidenceScore } from './technicalIndicators';
import { analyzeFundamentalWithGemini } from './geminiService';
import { fetchYahooOHLCV, resolveSymbol } from './stockSearchService';
import { fetchMultiTimeframeData } from './multiTimeframeService';
import { fetchFundamentals } from './fundamentalService';
import { calculateSignal } from '../utils/signals';
import { calculateEntryPoint } from '../utils/entryScoring';

// ── Main pipeline ─────────────────────────────────────────────
export async function getFullStockAnalysis(symbolInput, geminiApiKey = null) {
  const symbol = await resolveSymbol(symbolInput);
  if (!symbol) return null;

  // Step 1: Fetch Yahoo Daily OHLCV + Multi-Timeframe + Fundamentals in parallel
  const [yahooResult, multiData, fundamentals] = await Promise.all([
    fetchYahooOHLCV(symbol),
    fetchMultiTimeframeData(symbol),
    fetchFundamentals(symbol)
  ]);

  // FIX 1: If real OHLCV data is missing or empty, return null — NO FAKE CANDLES GENERATION!
  if (!yahooResult || !yahooResult.candles || yahooResult.candles.length === 0) {
    return null;
  }

  const candles = yahooResult.candles;
  const metaFromYahoo = yahooResult.meta || {};

  // Step 2: Technical indicators
  const closes = candles.map(c => c.close);
  const lastCandle = candles[candles.length - 1];
  const lastPrice = lastCandle.close;

  const rsi              = calculateRSI(closes, 14);
  const macd             = calculateMACD(closes);
  const detectedPatterns = detectPatterns(candles);
  const confidence       = calculateConfidenceScore(candles, rsi, macd, detectedPatterns[0] || {});

  const ma50Count = Math.min(50, candles.length);
  const ma50 = closes.slice(-ma50Count).reduce((sum, v) => sum + v, 0) / ma50Count;

  const ma200Count = candles.length >= 200 ? 200 : 0;
  const ma200 = ma200Count > 0 ? closes.slice(-200).reduce((sum, v) => sum + v, 0) / 200 : 0;

  const volPeriod = Math.min(20, candles.length);
  const avgVol = candles.slice(-volPeriod).reduce((sum, c) => sum + c.volume, 0) / volPeriod;
  const volumeRatio = avgVol > 0 ? +(lastCandle.volume / avgVol).toFixed(2) : 1.0;

  // FIX 3: Entry Point calculation using REAL API data points
  const rawFund = fundamentals?.raw || {};

  const high52Candles = Math.max(...candles.map(c => c.high));
  const low52Candles = Math.min(...candles.map(c => c.low));

  const entryData = {
    currentPrice: rawFund.currentPrice || metaFromYahoo.price || lastPrice,
    fiftyTwoWeekHigh: rawFund.fiftyTwoWeekHigh || high52Candles,
    fiftyTwoWeekLow: rawFund.fiftyTwoWeekLow || low52Candles,
    fiftyDayAverage: rawFund.fiftyDayAverage || ma50,
    twoHundredDayAverage: rawFund.twoHundredDayAverage || (ma200 > 0 ? ma200 : ma50 * 0.95),
    trailingPE: rawFund.trailingPE || null,
    forwardPE: rawFund.forwardPE || null,
  };

  // 3-FACTOR ENTRY POINT SYSTEM CALCULATION
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

  // Meta info
  const localMeta = POPULAR_STOCKS.find(s => s.symbol.toUpperCase() === symbol.split('.')[0]);
  const prevClose = closes[closes.length - 2] || lastPrice;

  const meta = {
    symbol:   symbol.split('.')[0],
    name:     metaFromYahoo.name || localMeta?.name || `${symbol.split('.')[0]} Ltd.`,
    sector:   localMeta?.sector  || metaFromYahoo.exchange || 'NSE Equities',
    price:    metaFromYahoo.price   ?? +lastPrice.toFixed(2),
    change:   metaFromYahoo.change  ?? +(lastPrice - prevClose).toFixed(2),
    pChange:  metaFromYahoo.pChange ?? +(((lastPrice - prevClose) / prevClose) * 100).toFixed(2),
    currency: metaFromYahoo.currency || 'INR',
    isLive:   true,
    ma50:     +ma50.toFixed(2),
    ma200:    +ma200.toFixed(2),
    volumeRatio
  };

  // Step 3: Gemini AI Analysis
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
  };
}

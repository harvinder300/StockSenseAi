/**
 * stockDataService.js
 * Unified pipeline: Yahoo OHLCV + Fundamentals + 3-Factor Entry Scoring → Gemini AI
 */
import { POPULAR_STOCKS } from '../data/indianStocks';
import { calculateRSI, calculateMACD, detectPatterns, calculateConfidenceScore } from './technicalIndicators';
import { analyzeFundamentalWithGemini } from './geminiService';
import { fetchYahooOHLCV } from './stockSearchService';
import { fetchMultiTimeframeData } from './multiTimeframeService';
import { fetchFundamentals } from './fundamentalService';
import { calculateSignal } from '../utils/signals';
import { calculateEntryPoint } from '../utils/entryScoring';

// ── Seeded simulation fallback ────────────────────────────────
function generateSimulatedCandles(symbol) {
  const stockMeta = POPULAR_STOCKS.find(s => s.symbol.toUpperCase() === symbol.toUpperCase());
  let basePrice = stockMeta?.price || 1500;

  let seed = 0;
  for (const ch of symbol) seed += ch.charCodeAt(0);
  const rng = () => { const x = Math.sin(seed++) * 10000; return x - Math.floor(x); };

  const candles = [];
  const today   = new Date();
  const start   = new Date(); start.setDate(today.getDate() - 120);
  const vol     = basePrice * 0.015;
  let price     = basePrice * 0.85;
  const cursor  = new Date(start);

  while (cursor <= today) {
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) {
      const delta = (rng() - 0.47) * vol;
      const open  = +price.toFixed(2);
      const close = +(price + delta).toFixed(2);
      const high  = +(Math.max(open, close) + rng() * vol * 0.8).toFixed(2);
      const low   = +(Math.min(open, close) - rng() * vol * 0.8).toFixed(2);
      candles.push({ time: cursor.toISOString().split('T')[0], open, high, low, close, volume: Math.floor(500000 + rng() * 2000000) });
      price = close;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  if (stockMeta && candles.length) {
    const last = candles[candles.length - 1];
    last.close = stockMeta.price;
    last.high  = Math.max(last.high, stockMeta.price);
    last.low   = Math.min(last.low,  stockMeta.price);
  }
  return candles;
}

// ── Main pipeline ─────────────────────────────────────────────
export async function getFullStockAnalysis(symbolInput, geminiApiKey = null) {
  const symbol = symbolInput.toUpperCase();
  const fullSymbol = symbol.includes('.') ? symbol : `${symbol}.NS`;

  // Step 1: Run Yahoo Daily OHLCV + Multi-Timeframe + Fundamentals in parallel
  const [yahooResult, multiData, fundamentals] = await Promise.all([
    fetchYahooOHLCV(fullSymbol),
    fetchMultiTimeframeData(fullSymbol),
    fetchFundamentals(fullSymbol)
  ]);

  let candles, metaFromYahoo;
  if (yahooResult && yahooResult.candles.length >= 20) {
    candles       = yahooResult.candles;
    metaFromYahoo = yahooResult.meta;
  } else {
    candles       = generateSimulatedCandles(symbol);
    metaFromYahoo = null;
  }

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

  // Combine raw fundamental data for entry calculation
  const rawFund = fundamentals?.raw || {};
  const entryData = {
    currentPrice: rawFund.currentPrice || lastPrice,
    fiftyTwoWeekHigh: rawFund.fiftyTwoWeekHigh || Math.max(...candles.map(c => c.high)),
    fiftyTwoWeekLow: rawFund.fiftyTwoWeekLow || Math.min(...candles.map(c => c.low)),
    fiftyDayAverage: rawFund.fiftyDayAverage || ma50,
    twoHundredDayAverage: rawFund.twoHundredDayAverage || (ma200 > 0 ? ma200 : ma50 * 0.95),
    trailingPE: rawFund.trailingPE,
    forwardPE: rawFund.forwardPE,
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

  // Step 3: Meta info
  const localMeta = POPULAR_STOCKS.find(s => s.symbol.toUpperCase() === symbol.split('.')[0]);
  const prevClose = closes[closes.length - 2] || lastPrice;

  const meta = {
    symbol:   symbol.split('.')[0],
    name:     metaFromYahoo?.name || localMeta?.name || `${symbol.split('.')[0]} Ltd.`,
    sector:   localMeta?.sector  || metaFromYahoo?.exchange || 'NSE Equities',
    price:    metaFromYahoo?.price   ?? +lastPrice.toFixed(2),
    change:   metaFromYahoo?.change  ?? +(lastPrice - prevClose).toFixed(2),
    pChange:  metaFromYahoo?.pChange ?? +(((lastPrice - prevClose) / prevClose) * 100).toFixed(2),
    currency: metaFromYahoo?.currency || 'INR',
    isLive:   !!metaFromYahoo,
    ma50:     +ma50.toFixed(2),
    ma200:    +ma200.toFixed(2),
    volumeRatio
  };

  // Step 4: Long Term Gemini AI Analysis with Entry Point Analysis
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

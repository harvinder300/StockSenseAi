/**
 * stockDataService.js
 * Unified pipeline: Yahoo OHLCV → Real Indicators → Gemini AI
 * Falls back to seeded simulation if Yahoo Finance is unavailable
 */
import { POPULAR_STOCKS } from '../data/indianStocks';
import { calculateRSI, calculateMACD, detectPatterns, calculateConfidenceScore } from './technicalIndicators';
import { analyzeStockWithGemini } from './geminiService';
import { fetchYahooOHLCV } from './stockSearchService';

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

  // Pin last close to real known price
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

  // Step 1: Try real Yahoo Finance OHLCV
  let candles, metaFromYahoo;
  const yahooResult = await fetchYahooOHLCV(symbol.includes('.') ? symbol : `${symbol}.NS`);

  if (yahooResult && yahooResult.candles.length >= 20) {
    candles       = yahooResult.candles;
    metaFromYahoo = yahooResult.meta;
  } else {
    // Fallback to simulation
    candles       = generateSimulatedCandles(symbol);
    metaFromYahoo = null;
  }

  // Step 2: Calculate real indicators from closes
  const closes = candles.map(c => c.close);

  const rsi              = calculateRSI(closes, 14);
  const macd             = calculateMACD(closes);
  const detectedPatterns = detectPatterns(candles);
  const confidence       = calculateConfidenceScore(candles, rsi, macd, detectedPatterns[0] || {});

  // Step 3: Build meta from Yahoo or local DB fallback
  const localMeta = POPULAR_STOCKS.find(s => s.symbol.toUpperCase() === symbol.split('.')[0]);
  const lastClose = closes[closes.length - 1];
  const prevClose = closes[closes.length - 2] || lastClose;

  const meta = {
    symbol:   symbol.split('.')[0],
    name:     metaFromYahoo?.name || localMeta?.name || `${symbol.split('.')[0]} Ltd.`,
    sector:   localMeta?.sector  || metaFromYahoo?.exchange || 'NSE Equities',
    price:    metaFromYahoo?.price   ?? +lastClose.toFixed(2),
    change:   metaFromYahoo?.change  ?? +(lastClose - prevClose).toFixed(2),
    pChange:  metaFromYahoo?.pChange ?? +(((lastClose - prevClose) / prevClose) * 100).toFixed(2),
    currency: metaFromYahoo?.currency || 'INR',
    isLive:   !!metaFromYahoo,
  };

  // Step 4: Gemini AI analysis
  const aiAnalysis = await analyzeStockWithGemini({
    symbol:          meta.symbol,
    name:            meta.name,
    price:           meta.price,
    change:          meta.change,
    pChange:         meta.pChange,
    rsi,
    macd,
    detectedPatterns,
    confidence,
    geminiApiKey,
  });

  return { meta, candles, rsi, macd, detectedPatterns, confidence, aiAnalysis };
}

/**
 * technicalIndicators.js
 * FIX 2 — RSI + MACD using the "technicalindicators" npm library
 * + simple candlestick pattern detection
 */
import { RSI, MACD } from 'technicalindicators';

// ── RSI ──────────────────────────────────────────────────────
export function calculateRSI(closes, period = 14) {
  if (closes.length < period + 1) {
    return { value: 50, status: 'Insufficient data', explanation: 'Need more price data for RSI calculation.' };
  }

  try {
    const values = RSI.calculate({ period, values: closes });
    const rsiVal = Math.round(values[values.length - 1] * 10) / 10;

    let status, explanation;
    if (rsiVal >= 70) {
      status = 'Overbought';
      explanation = `RSI at ${rsiVal} — stock is overbought. Momentum may slow down. Avoid chasing.`;
    } else if (rsiVal <= 30) {
      status = 'Oversold';
      explanation = `RSI at ${rsiVal} — stock is oversold. Potential bounce possible. Watch for reversal.`;
    } else if (rsiVal >= 55) {
      status = 'Bullish Momentum';
      explanation = `RSI at ${rsiVal} — buyers are in control. Momentum is healthy and trending up.`;
    } else if (rsiVal <= 45) {
      status = 'Bearish Momentum';
      explanation = `RSI at ${rsiVal} — sellers have slight edge. Wait for RSI to recover above 50.`;
    } else {
      status = 'Neutral';
      explanation = `RSI at ${rsiVal} — balanced market. No strong directional bias yet.`;
    }

    return { value: rsiVal, status, explanation };
  } catch (err) {
    return { value: 50, status: 'Error', explanation: 'RSI calculation error.' };
  }
}

// ── MACD ─────────────────────────────────────────────────────
export function calculateMACD(closes) {
  if (closes.length < 35) {
    return { macd: 0, signal: 0, histogram: 0, status: 'Insufficient data', explanation: 'Need more price data for MACD.' };
  }

  try {
    const values = MACD.calculate({
      values:          closes,
      fastPeriod:      12,
      slowPeriod:      26,
      signalPeriod:    9,
      SimpleMAOscillator: false,
      SimpleMASignal:     false,
    });

    if (!values.length) throw new Error('Empty MACD result');
    const last = values[values.length - 1];
    const prev = values[values.length - 2];

    const macdLine  = +(last.MACD?.toFixed(3)       ?? 0);
    const sigLine   = +(last.signal?.toFixed(3)      ?? 0);
    const histogram = +(last.histogram?.toFixed(3)   ?? 0);

    let status, explanation;
    const prevHistogram = prev?.histogram ?? 0;

    if (macdLine > sigLine && prevHistogram <= 0) {
      status      = 'Bullish Crossover';
      explanation = 'MACD just crossed above signal line — fresh buy momentum. Good entry signal.';
    } else if (macdLine < sigLine && prevHistogram >= 0) {
      status      = 'Bearish Crossover';
      explanation = 'MACD just crossed below signal line — selling pressure building. Be cautious.';
    } else if (macdLine > sigLine) {
      status      = 'Bullish';
      explanation = 'MACD is above signal line — bullish trend is active. Momentum favors buyers.';
    } else {
      status      = 'Bearish';
      explanation = 'MACD is below signal line — bearish pressure dominant. Momentum favors sellers.';
    }

    return { macd: macdLine, signal: sigLine, histogram, status, explanation };
  } catch (err) {
    return { macd: 0, signal: 0, histogram: 0, status: 'Error', explanation: 'MACD calculation error.' };
  }
}

// ── Pattern Detection ────────────────────────────────────────
export function detectPatterns(candles) {
  if (!candles || candles.length < 3) {
    return [{ name: 'Insufficient Data', type: 'Neutral', verdictImpact: 'Neutral', simpleLanguage: 'Not enough candles for pattern detection.' }];
  }

  const patterns = [];
  const c  = candles[candles.length - 1]; // last candle
  const p1 = candles[candles.length - 2]; // second-to-last
  const p2 = candles[candles.length - 3]; // third-to-last

  const body    = (x) => Math.abs(x.close - x.open);
  const range   = (x) => x.high - x.low;
  const isBull  = (x) => x.close > x.open;
  const isBear  = (x) => x.close < x.open;

  // 1. Doji
  if (body(c) <= range(c) * 0.1 && range(c) > 0) {
    patterns.push({ name: 'Doji', type: 'Neutral', verdictImpact: 'Neutral', simpleLanguage: 'Buyers and sellers are equally matched. Market is undecided — wait for the next candle for direction.' });
  }

  // 2. Bullish Engulfing
  if (isBear(p1) && isBull(c) && c.open < p1.close && c.close > p1.open && body(c) > body(p1)) {
    patterns.push({ name: 'Bullish Engulfing', type: 'Bullish Reversal', verdictImpact: 'Bullish', simpleLanguage: 'Strong buyers overpowered sellers. Possible upward reversal forming. Watch for confirmation tomorrow.' });
  }

  // 3. Bearish Engulfing
  if (isBull(p1) && isBear(c) && c.open > p1.close && c.close < p1.open && body(c) > body(p1)) {
    patterns.push({ name: 'Bearish Engulfing', type: 'Bearish Reversal', verdictImpact: 'Bearish', simpleLanguage: 'Sellers overwhelmed buyers. A downward reversal could be starting. Avoid fresh buying.' });
  }

  // 4. Hammer (bullish)
  if (isBull(c) && (c.low < c.open - body(c) * 2) && (c.high - c.close) < body(c) * 0.5) {
    patterns.push({ name: 'Hammer', type: 'Bullish Reversal', verdictImpact: 'Bullish', simpleLanguage: 'Strong buying at lower levels rejected the dip. A potential trend reversal upward. Buyers are stepping in.' });
  }

  // 5. Shooting Star (bearish)
  if (isBear(c) && (c.high > c.close + body(c) * 2) && (c.open - c.low) < body(c) * 0.5) {
    patterns.push({ name: 'Shooting Star', type: 'Bearish Reversal', verdictImpact: 'Bearish', simpleLanguage: 'Price rallied sharply but sellers pushed it back down. Possible top forming. Be careful of a reversal.' });
  }

  // 6. Three White Soldiers (3 consecutive bullish)
  if (isBull(c) && isBull(p1) && isBull(p2) && c.close > p1.close && p1.close > p2.close) {
    patterns.push({ name: 'Three White Soldiers', type: 'Bullish Continuation', verdictImpact: 'Bullish', simpleLanguage: 'Three straight green candles in a row — strong bullish momentum. Trend likely to continue upward.' });
  }

  // 7. Three Black Crows (3 consecutive bearish)
  if (isBear(c) && isBear(p1) && isBear(p2) && c.close < p1.close && p1.close < p2.close) {
    patterns.push({ name: 'Three Black Crows', type: 'Bearish Continuation', verdictImpact: 'Bearish', simpleLanguage: 'Three straight red candles — strong selling pressure. Trend may continue downward. Avoid buying.' });
  }

  // 8. Morning Star (3-candle bullish reversal)
  if (isBear(p2) && body(p1) < body(p2) * 0.3 && isBull(c) && c.close > (p2.open + p2.close) / 2) {
    patterns.push({ name: 'Morning Star', type: 'Bullish Reversal', verdictImpact: 'Bullish', simpleLanguage: 'Classic 3-candle reversal — selling exhausted, small indecision, then strong buying. Potential bottom.' });
  }

  // 9. Evening Star (3-candle bearish reversal)
  if (isBull(p2) && body(p1) < body(p2) * 0.3 && isBear(c) && c.close < (p2.open + p2.close) / 2) {
    patterns.push({ name: 'Evening Star', type: 'Bearish Reversal', verdictImpact: 'Bearish', simpleLanguage: 'Classic 3-candle top reversal — buying exhausted, small indecision, then strong selling. Possible peak.' });
  }

  // 10. Default: single candle
  if (patterns.length === 0) {
    if (isBull(c)) {
      patterns.push({ name: 'Bullish Candle', type: 'Bullish', verdictImpact: 'Bullish', simpleLanguage: 'Last session closed higher than open. Buyers were in control today. Monitor for continuation.' });
    } else {
      patterns.push({ name: 'Bearish Candle', type: 'Bearish', verdictImpact: 'Bearish', simpleLanguage: 'Last session closed lower than open. Sellers were in control today. Wait for recovery before buying.' });
    }
  }

  return patterns;
}

// ── Confidence Score ─────────────────────────────────────────
export function calculateConfidenceScore(candles, rsi, macd, primaryPattern) {
  if (!candles || candles.length < 2) return { score: 0, level: 'Low Confidence ⚠️', color: '#ff4757', breakdown: [] };

  const lastCandle = candles[candles.length - 1];
  
  // Calculate 50-day MA
  let dma50 = 0;
  if (candles.length >= 50) {
    const sum = candles.slice(-50).reduce((acc, c) => acc + c.close, 0);
    dma50 = sum / 50;
  } else {
    // fallback if less than 50 candles
    const sum = candles.reduce((acc, c) => acc + c.close, 0);
    dma50 = sum / candles.length;
  }

  // Calculate Average Volume (last 20 days)
  const volPeriod = Math.min(20, candles.length);
  const avgVol = candles.slice(-volPeriod).reduce((acc, c) => acc + c.volume, 0) / volPeriod;
  const isHighVol = lastCandle.volume > avgVol * 1.5;

  // Determine technical bias (Bullish vs Bearish)
  let bullPoints = 0;
  let bearPoints = 0;

  if (rsi.value < 30) bullPoints += 20;
  if (rsi.value > 70) bearPoints += 20;
  
  if (macd.status === 'Bullish Crossover' || macd.status === 'Bullish') bullPoints += 25;
  if (macd.status === 'Bearish Crossover' || macd.status === 'Bearish') bearPoints += 25;

  if (primaryPattern.verdictImpact === 'Bullish') bullPoints += 25;
  if (primaryPattern.verdictImpact === 'Bearish') bearPoints += 25;

  const technicalVerdict = bullPoints >= bearPoints ? 'BUY' : 'SELL';
  
  let score = 0;
  const breakdown = [];

  // RSI
  if (rsi.value < 30 && technicalVerdict === 'BUY') {
    score += 20;
    breakdown.push({ text: 'RSI Oversold — Bullish signal confirmed', status: 'pos' });
  } else if (rsi.value > 70 && technicalVerdict === 'SELL') {
    score += 20;
    breakdown.push({ text: 'RSI Overbought — Bearish signal confirmed', status: 'pos' });
  } else if (rsi.value >= 40 && rsi.value <= 60) {
    score += 5;
    breakdown.push({ text: 'RSI Neutral — No strong momentum', status: 'neu' });
  } else {
    breakdown.push({ text: `RSI at ${rsi.value} — unaligned with trend`, status: 'neg' });
  }

  // MACD
  if ((macd.status === 'Bullish Crossover' || macd.status === 'Bullish') && technicalVerdict === 'BUY') {
    score += 25;
    breakdown.push({ text: `MACD ${macd.status} confirmed`, status: 'pos' });
  } else if ((macd.status === 'Bearish Crossover' || macd.status === 'Bearish') && technicalVerdict === 'SELL') {
    score += 25;
    breakdown.push({ text: `MACD ${macd.status} confirmed`, status: 'pos' });
  } else {
    breakdown.push({ text: 'MACD unaligned with primary trend', status: 'neg' });
  }

  // Pattern
  if (primaryPattern.verdictImpact === 'Bullish' && technicalVerdict === 'BUY') {
    score += 25;
    breakdown.push({ text: `${primaryPattern.name} pattern detected`, status: 'pos' });
  } else if (primaryPattern.verdictImpact === 'Bearish' && technicalVerdict === 'SELL') {
    score += 25;
    breakdown.push({ text: `${primaryPattern.name} pattern detected`, status: 'pos' });
  } else {
    breakdown.push({ text: 'No confirming candlestick pattern', status: 'neg' });
  }

  // Price vs 50 DMA
  if (lastCandle.close > dma50 && technicalVerdict === 'BUY') {
    score += 15;
    breakdown.push({ text: 'Price above 50-day moving average', status: 'pos' });
  } else if (lastCandle.close < dma50 && technicalVerdict === 'SELL') {
    score += 15;
    breakdown.push({ text: 'Price below 50-day moving average', status: 'pos' });
  } else {
    breakdown.push({ text: 'Moving average does not support trend', status: 'neg' });
  }

  // Volume
  if (isHighVol) {
    score += 15;
    breakdown.push({ text: "Volume > 1.5x average — strong confirmation", status: 'pos' });
  } else {
    breakdown.push({ text: 'Volume below average (weak confirmation)', status: 'neu' });
  }

  // Cap at 100
  score = Math.min(100, score);

  let level = 'Low Confidence ⚠️';
  let color = '#ff4757'; // red
  if (score >= 76) {
    level = 'Strong Confidence 💪';
    color = '#00ff88'; // green
  } else if (score >= 56) {
    level = 'Good Confidence ✅';
    color = '#00d4ff'; // blue
  } else if (score >= 31) {
    level = 'Moderate Confidence 🟡';
    color = '#f59e0b'; // yellow
  }

  return {
    score,
    level,
    color,
    breakdown,
    dma50: +dma50.toFixed(2),
    isHighVol,
    technicalVerdict
  };
}

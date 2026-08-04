/**
 * signals.js — Unified weighted scoring & trading signal logic for StockSense AI
 */

export const calculateSignal = (data = {}) => {
  const {
    rsi = 50,
    macdHistogram = 0,
    macdLine = 0,
    signalLine = 0,
    price = 0,
    ma50 = 0,
    ma200 = 0,
    volumeRatio = 1.0,
  } = data;

  let score = 0;
  const reasons = [];

  // 1. RSI SCORING (30 points max)
  if (rsi < 30) {
    score += 30;
    reasons.push('✅ RSI Oversold — Strong buy zone');
  } else if (rsi < 45) {
    score += 20;
    reasons.push('✅ RSI Low — Good entry zone');
  } else if (rsi < 60) {
    score += 15;
    reasons.push('✅ RSI Neutral — Stable range');
  } else if (rsi < 70) {
    score += 5;
    reasons.push('⚠️ RSI Elevated — Momentum high');
  } else {
    score += 0;
    reasons.push('🔴 RSI Overbought — Caution');
  }

  // 2. MACD SCORING (35 points max)
  if (macdHistogram > 0 && macdLine > signalLine) {
    score += 35;
    reasons.push('✅ MACD Bullish Crossover — Strong');
  } else if (macdHistogram > 0) {
    score += 20;
    reasons.push('✅ MACD Positive — Mild bullish');
  } else if (macdHistogram < 0 && macdLine < signalLine) {
    score += 0;
    reasons.push('🔴 MACD Bearish — Selling pressure');
  } else {
    score += 10;
    reasons.push('⚠️ MACD Mixed — Wait for clarity');
  }

  // 3. PRICE vs MOVING AVERAGE (20 points max)
  // If ma200 is 0 or unavailable, fall back gracefully to price > ma50
  const effectiveMa200 = ma200 > 0 ? ma200 : ma50;

  if (price > ma50 && price >= effectiveMa200) {
    score += 20;
    reasons.push('✅ Above 50 & 200 MA — Strong trend');
  } else if (price > ma50) {
    score += 12;
    reasons.push('✅ Above 50 MA — Short term bullish');
  } else if (ma200 > 0 && price > ma200) {
    score += 8;
    reasons.push('⚠️ Below 50 MA but above 200 MA');
  } else {
    score += 0;
    reasons.push('🔴 Below both MAs — Weak trend');
  }

  // 4. VOLUME CONFIRMATION (15 points max)
  if (volumeRatio > 1.5) {
    score += 15;
    reasons.push('✅ High volume — Move confirmed');
  } else if (volumeRatio > 1.0) {
    score += 8;
    reasons.push('✅ Normal volume');
  } else {
    score += 0;
    reasons.push('⚠️ Low volume — Weak confirmation');
  }

  // DETERMINE VERDICT
  let verdict = '';
  let action = '';
  let color = '';
  let emoji = '';

  if (score >= 75) {
    verdict = 'Strong Buy';
    action = 'BUY';
    color = '#00ff88';
    emoji = '💪';
  } else if (score >= 55) {
    verdict = 'Moderate Buy';
    action = 'WATCH TO BUY';
    color = '#00d4ff';
    emoji = '📈';
  } else if (score >= 40) {
    verdict = 'Neutral';
    action = 'HOLD';
    color = '#ffd700';
    emoji = '⚖️';
  } else if (score >= 25) {
    verdict = 'Weak — Wait';
    action = 'WAIT';
    color = '#ff9f43';
    emoji = '⏳';
  } else {
    verdict = 'Bearish — Avoid';
    action = 'AVOID';
    color = '#ff4757';
    emoji = '🔴';
  }

  return {
    score,
    verdict,
    action,
    color,
    emoji,
    reasons,
  };
};

/**
 * Compare Verdict logic for Compare Page
 */
export const getCompareVerdict = (stockA, stockB) => {
  const scoreA = stockA?.score ?? 0;
  const scoreB = stockB?.score ?? 0;
  const nameA = stockA?.name || stockA?.symbol || 'Stock A';
  const nameB = stockB?.name || stockB?.symbol || 'Stock B';

  if (scoreA > scoreB + 15) {
    return {
      winner: nameA,
      reason: `${nameA} scores ${scoreA}% vs ${nameB}'s ${scoreB}%. Technically stronger right now.`
    };
  } else if (scoreB > scoreA + 15) {
    return {
      winner: nameB,
      reason: `${nameB} scores ${scoreB}% vs ${nameA}'s ${scoreA}%. Better signals currently.`
    };
  } else {
    return {
      winner: 'Too Close',
      reason: `Both stocks have similar strength (${scoreA}% vs ${scoreB}%). Check your investment goal — long term or short term?`
    };
  }
};

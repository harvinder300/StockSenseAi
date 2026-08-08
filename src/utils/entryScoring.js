/**
 * entryScoring.js
 * 3-Factor Entry Point Detection System for Long-Term Investors in StockSense AI
 * Factor 1: Price Position in 52wk Range & MAs (33 pts)
 * Factor 2: Valuation & Forward P/E Comparison (34 pts)
 * Factor 3: Technical RSI + MACD Combined Signals (33 pts)
 */

export const calculateEntryPoint = (data = {}, rsiVal = 50, macdObj = {}) => {
  const currentPrice = data.currentPrice || data.price || 100;
  const high52 = data.fiftyTwoWeekHigh || currentPrice * 1.25;
  const low52 = data.fiftyTwoWeekLow || currentPrice * 0.8;
  const ma50 = data.fiftyDayAverage || currentPrice * 0.98;
  const ma200 = data.twoHundredDayAverage || currentPrice * 0.92;

  const trailingPE = data.trailingPE || null;
  const forwardPE = data.forwardPE || null;

  const rsi = typeof rsiVal === 'number' ? rsiVal : 50;
  const macd = {
    histogram: macdObj.histogram || 0,
    macdLine: macdObj.macd || 0,
    signalLine: macdObj.signal || 0,
    prevHistogram: macdObj.prevHistogram || 0
  };

  let factor1Score = 0;
  let factor2Score = 0;
  let factor3Score = 0;
  const entryInsights = [];

  // ─────────────────────────────────
  // FACTOR 1 — PRICE POSITION (33 pts max)
  // ─────────────────────────────────
  const weekRange = high52 - low52;
  const pricePosition = weekRange > 0
    ? ((currentPrice - low52) / weekRange) * 100
    : 50;

  if (pricePosition <= 20) {
    factor1Score += 33;
    entryInsights.push('💎 Price near 52-week low — Excellent entry zone');
  } else if (pricePosition <= 35) {
    factor1Score += 25;
    entryInsights.push('✅ Price in lower range — Good entry zone');
  } else if (pricePosition <= 50) {
    factor1Score += 18;
    entryInsights.push('✅ Price in middle range — Decent entry');
  } else if (pricePosition <= 70) {
    factor1Score += 8;
    entryInsights.push('⚠️ Price in upper range — Wait for dip');
  } else {
    factor1Score += 0;
    entryInsights.push('🔴 Price near 52-week high — Not good entry');
  }

  if (currentPrice < ma50) {
    factor1Score += 5;
    entryInsights.push('✅ Trading below 50-day MA — Discounted');
  }
  if (currentPrice < ma200) {
    factor1Score += 5;
    entryInsights.push('✅ Trading below 200-day MA — Long term value');
  }
  factor1Score = Math.min(33, factor1Score);

  // ─────────────────────────────────
  // FACTOR 2 — VALUATION (34 pts max)
  // ─────────────────────────────────
  if (forwardPE && forwardPE > 0) {
    if (forwardPE < 15) {
      factor2Score += 20;
      entryInsights.push(`💎 Forward P/E ${forwardPE.toFixed(1)}x — Very cheap on future earnings`);
    } else if (forwardPE < 20) {
      factor2Score += 15;
      entryInsights.push(`✅ Forward P/E ${forwardPE.toFixed(1)}x — Reasonably priced`);
    } else if (forwardPE < 30) {
      factor2Score += 8;
      entryInsights.push(`⚠️ Forward P/E ${forwardPE.toFixed(1)}x — Slightly expensive`);
    } else {
      factor2Score += 0;
      entryInsights.push(`🔴 Forward P/E ${forwardPE.toFixed(1)}x — Expensive on future earnings`);
    }
  } else {
    factor2Score += 10;
    entryInsights.push('ℹ️ Forward P/E unavailable — Using trailing valuation');
  }

  if (trailingPE && forwardPE && forwardPE > 0) {
    if (forwardPE < trailingPE) {
      factor2Score += 14;
      entryInsights.push('✅ Forward P/E lower than Trailing — Earnings expected to grow');
    } else if (forwardPE > trailingPE * 1.2) {
      factor2Score += 0;
      entryInsights.push('⚠️ Forward P/E higher — Earnings may slow down');
    } else {
      factor2Score += 7;
      entryInsights.push('✅ Stable P/E trend expected');
    }
  }
  factor2Score = Math.min(34, factor2Score);

  // ─────────────────────────────────
  // FACTOR 3 — TECHNICAL (33 pts max)
  // ─────────────────────────────────
  if (rsi < 30) {
    factor3Score += 18;
    entryInsights.push(`💎 RSI ${rsi.toFixed(1)} — Heavily oversold, strong bounce likely`);
  } else if (rsi < 40) {
    factor3Score += 14;
    entryInsights.push(`✅ RSI ${rsi.toFixed(1)} — Oversold zone, good technical entry`);
  } else if (rsi < 50) {
    factor3Score += 10;
    entryInsights.push(`✅ RSI ${rsi.toFixed(1)} — Neutral, acceptable entry`);
  } else if (rsi < 60) {
    factor3Score += 5;
    entryInsights.push(`⚠️ RSI ${rsi.toFixed(1)} — Slightly high, wait for pullback`);
  } else {
    factor3Score += 0;
    entryInsights.push(`🔴 RSI ${rsi.toFixed(1)} — Overbought, not good entry timing`);
  }

  if (macd.histogram > 0 && macd.macdLine > macd.signalLine) {
    factor3Score += 15;
    entryInsights.push('✅ MACD bullish crossover confirmed');
  } else if (macd.histogram > 0) {
    factor3Score += 8;
    entryInsights.push('✅ MACD turning positive — momentum building');
  } else if (macd.histogram < 0 && Math.abs(macd.histogram) < Math.abs(macd.prevHistogram || macd.histogram)) {
    factor3Score += 5;
    entryInsights.push('⚠️ MACD still bearish but weakening — watch for reversal');
  } else {
    factor3Score += 0;
    entryInsights.push('🔴 MACD bearish — selling pressure continues');
  }
  factor3Score = Math.min(33, factor3Score);

  // Total Entry Score (100 pts)
  const entryScore = Math.min(100, factor1Score + factor2Score + factor3Score);

  let entryVerdict = '';
  let entryColor = '';
  let entryEmoji = '';

  if (entryScore >= 80) {
    entryVerdict = 'Excellent Entry Point';
    entryColor = '#00ff88';
    entryEmoji = '💎';
  } else if (entryScore >= 60) {
    entryVerdict = 'Good Entry Point';
    entryColor = '#00d4ff';
    entryEmoji = '✅';
  } else if (entryScore >= 40) {
    entryVerdict = 'Decent Entry — Invest Partially';
    entryColor = '#ffd700';
    entryEmoji = '⚖️';
  } else if (entryScore >= 20) {
    entryVerdict = 'Wait for Better Entry';
    entryColor = '#ff9f43';
    entryEmoji = '⏳';
  } else {
    entryVerdict = 'Not Good Entry Point';
    entryColor = '#ff4757';
    entryEmoji = '🔴';
  }

  // Calculate Tranche Strategy
  const tranchePlan = getTrancheStrategy(
    { currentPrice, fiftyTwoWeekHigh: high52, fiftyTwoWeekLow: low52, fiftyDayAverage: ma50, twoHundredDayAverage: ma200 },
    entryScore
  );

  return {
    entryScore,
    factor1Score,
    factor2Score,
    factor3Score,
    pricePosition,
    entryVerdict,
    entryColor,
    entryEmoji,
    entryInsights,
    tranchePlan,
    keyLevels: {
      currentPrice: +currentPrice.toFixed(2),
      fiftyTwoWeekHigh: +high52.toFixed(2),
      fiftyTwoWeekLow: +low52.toFixed(2),
      fiftyDayAverage: +ma50.toFixed(2),
      twoHundredDayAverage: +ma200.toFixed(2),
      support1: +tranchePlan.support1.toFixed(2),
      support2: +tranchePlan.support2.toFixed(2),
      resistance: +high52.toFixed(2),
      reviewPrice: +tranchePlan.reviewPriceVal.toFixed(2)
    }
  };
};

export const getTrancheStrategy = (data, entryScore) => {
  const current = data.currentPrice || 100;
  const low52 = data.fiftyTwoWeekLow || current * 0.8;
  const high52 = data.fiftyTwoWeekHigh || current * 1.25;
  const ma50 = data.fiftyDayAverage || current * 0.95;
  const ma200 = data.twoHundredDayAverage || current * 0.90;

  // Calculate support levels ensures support1 > support2 logically
  const support1 = Math.min(ma50, current * 0.96);
  const support2 = Math.min(ma200, support1 * 0.95);
  const reviewPriceVal = low52 * 0.95;

  // Upside Targets
  const target1 = current * 1.15;
  const target2 = current * 1.30;
  const target3 = high52;

  if (entryScore >= 80) {
    return {
      strategy: 'Aggressive Entry — Invest 60% Now',
      support1,
      support2,
      reviewPriceVal,
      tranches: [
        { percent: '60%', price: `₹${current.toFixed(0)} (Now)`, reason: 'Excellent entry conditions' },
        { percent: '25%', price: `₹${support1.toFixed(0)}`, reason: 'If dips to 50-day MA support' },
        { percent: '15%', price: `₹${support2.toFixed(0)}`, reason: 'If deeper dip to 200-day MA' }
      ],
      targets: [
        `Target 1: ₹${target1.toFixed(0)} (+15%)`,
        `Target 2: ₹${target2.toFixed(0)} (+30%)`,
        `Target 3: ₹${target3.toFixed(0)} (52wk high)`
      ],
      reviewPrice: `₹${reviewPriceVal.toFixed(0)}`,
      reviewNote: 'Review investment thesis if price falls below this level'
    };
  } else if (entryScore >= 60) {
    return {
      strategy: 'SIP Approach — Invest Monthly',
      support1,
      support2,
      reviewPriceVal,
      tranches: [
        { percent: '33%', price: `₹${current.toFixed(0)} (Now)`, reason: 'Good entry conditions' },
        { percent: '33%', price: `₹${support1.toFixed(0)}`, reason: 'At 50-day MA support' },
        { percent: '34%', price: `₹${support2.toFixed(0)} or next month`, reason: 'Either price dip or time-based' }
      ],
      targets: [
        `Target 1: ₹${target1.toFixed(0)} (+15%)`,
        `Target 2: ₹${target2.toFixed(0)} (+30%)`
      ],
      reviewPrice: `₹${reviewPriceVal.toFixed(0)}`,
      reviewNote: 'Review thesis if falls below 52-week low'
    };
  } else if (entryScore >= 40) {
    return {
      strategy: 'Watchlist — Invest Only 25% Now',
      support1,
      support2,
      reviewPriceVal,
      tranches: [
        { percent: '25%', price: `₹${current.toFixed(0)} (Small position)`, reason: 'To track the stock' },
        { percent: '75%', price: `₹${support1.toFixed(0)} or below`, reason: 'Wait for better price' }
      ],
      targets: [
        `Target: ₹${target1.toFixed(0)} (+15%)`
      ],
      reviewPrice: `₹${reviewPriceVal.toFixed(0)}`,
      reviewNote: 'Add more only if fundamentals remain strong in next quarter'
    };
  } else {
    return {
      strategy: 'Wait — Do Not Invest Now',
      support1,
      support2,
      reviewPriceVal,
      tranches: [
        { percent: '0%', price: 'Do not enter now', reason: 'Poor entry conditions' },
        { percent: '100%', price: `₹${support2.toFixed(0)} or below`, reason: 'Wait for significant dip' }
      ],
      targets: [],
      reviewPrice: `₹${reviewPriceVal.toFixed(0)}`,
      reviewNote: 'Only consider if RSI drops below 35 AND price near 52wk low'
    };
  }
};

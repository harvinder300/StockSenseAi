/**
 * Scans OHLC candles array and returns array of detected candlestick patterns
 * with retail-friendly explanations.
 */
export function detectCandlestickPatterns(candles) {
  if (!candles || candles.length < 3) {
    return [];
  }

  const detected = [];
  const n = candles.length;
  const curr = candles[n - 1];
  const prev1 = candles[n - 2];
  const prev2 = candles[n - 3];

  const getMetrics = (c) => {
    const body = Math.abs(c.close - c.open);
    const range = c.high - c.low;
    const isGreen = c.close >= c.open;
    const isRed = c.close < c.open;
    const upperWick = isGreen ? c.high - c.close : c.high - c.open;
    const lowerWick = isGreen ? c.open - c.low : c.close - c.low;
    return { body, range, isGreen, isRed, upperWick, lowerWick };
  };

  const currM = getMetrics(curr);
  const prev1M = getMetrics(prev1);
  const prev2M = getMetrics(prev2);

  // 1. Hammer (Current candle)
  if (
    currM.lowerWick >= currM.body * 2 &&
    currM.upperWick <= currM.body * 0.5 &&
    currM.body > 0
  ) {
    detected.push({
      name: 'Hammer Pattern',
      type: 'Bullish Reversal',
      reliability: 'High',
      simpleLanguage: 'Sellers tried to crash the stock during the day, but strong buyers pushed price right back up before market close.',
      verdictImpact: 'Bullish'
    });
  }

  // 2. Shooting Star
  if (
    currM.upperWick >= currM.body * 2 &&
    currM.lowerWick <= currM.body * 0.5 &&
    currM.body > 0
  ) {
    detected.push({
      name: 'Shooting Star Pattern',
      type: 'Bearish Reversal',
      reliability: 'High',
      simpleLanguage: 'Bulls pushed price higher early on, but heavy profit taking dragged price down near open. Shows exhaustion of buyers.',
      verdictImpact: 'Bearish'
    });
  }

  // 3. Doji
  if (currM.body <= currM.range * 0.1 && currM.range > 0) {
    detected.push({
      name: 'Doji (Indecision)',
      type: 'Neutral Reversal',
      reliability: 'Medium',
      simpleLanguage: 'Opening and closing prices are virtually equal. Indicates extreme indecision between buyers and sellers.',
      verdictImpact: 'Neutral'
    });
  }

  // 4. Bullish Engulfing (prev1 red, curr green engulfing)
  if (
    prev1M.isRed &&
    currM.isGreen &&
    curr.open <= prev1.close &&
    curr.close >= prev1.open
  ) {
    detected.push({
      name: 'Bullish Engulfing',
      type: 'Bullish Reversal',
      reliability: 'Very High',
      simpleLanguage: 'A strong green candle completely covers the previous red candle. Indicates buyers taking fierce command.',
      verdictImpact: 'Bullish'
    });
  }

  // 5. Bearish Engulfing (prev1 green, curr red engulfing)
  if (
    prev1M.isGreen &&
    currM.isRed &&
    curr.open >= prev1.close &&
    curr.close <= prev1.open
  ) {
    detected.push({
      name: 'Bearish Engulfing',
      type: 'Bearish Reversal',
      reliability: 'Very High',
      simpleLanguage: 'A big red candle completely swallows yesterday\'s green body. Sellers have taken control from buyers.',
      verdictImpact: 'Bearish'
    });
  }

  // 6. Morning Star (3-candle pattern)
  if (
    prev2M.isRed &&
    prev1M.body < prev2M.body * 0.4 &&
    currM.isGreen &&
    curr.close > (prev2.open + prev2.close) / 2
  ) {
    detected.push({
      name: 'Morning Star Pattern',
      type: 'Bullish Reversal',
      reliability: 'Very High',
      simpleLanguage: 'Classic 3-candle sunrise reversal pattern. Downtrend has exhausted and strong fresh upward momentum is starting.',
      verdictImpact: 'Bullish'
    });
  }

  // 7. Evening Star (3-candle pattern)
  if (
    prev2M.isGreen &&
    prev1M.body < prev2M.body * 0.4 &&
    currM.isRed &&
    curr.close < (prev2.open + prev2.close) / 2
  ) {
    detected.push({
      name: 'Evening Star Pattern',
      type: 'Bearish Reversal',
      reliability: 'Very High',
      simpleLanguage: 'Classic 3-candle top reversal pattern. Uptrend has lost power and selling pressure is mounting.',
      verdictImpact: 'Bearish'
    });
  }

  // 8. Piercing Line
  if (
    prev1M.isRed &&
    currM.isGreen &&
    curr.open < prev1.low &&
    curr.close > (prev1.open + prev1.close) / 2 &&
    curr.close < prev1.open
  ) {
    detected.push({
      name: 'Piercing Line Pattern',
      type: 'Bullish Reversal',
      reliability: 'Medium-High',
      simpleLanguage: 'Price opened lower but buyers stormed in to close higher than 50% of previous day\'s loss.',
      verdictImpact: 'Bullish'
    });
  }

  // 9. Dark Cloud Cover
  if (
    prev1M.isGreen &&
    currM.isRed &&
    curr.open > prev1.high &&
    curr.close < (prev1.open + prev1.close) / 2 &&
    curr.close > prev1.open
  ) {
    detected.push({
      name: 'Dark Cloud Cover',
      type: 'Bearish Reversal',
      reliability: 'Medium-High',
      simpleLanguage: 'Price gapped up but heavy dumping pushed it back deep into yesterday\'s gains.',
      verdictImpact: 'Bearish'
    });
  }

  // If no specific multi-candle pattern detected, return default trend structure pattern
  if (detected.length === 0) {
    if (currM.isGreen) {
      detected.push({
        name: 'Bullish Continuation Candle',
        type: 'Trend Following',
        reliability: 'Medium',
        simpleLanguage: 'Price closed higher than open with solid buying support.',
        verdictImpact: 'Bullish'
      });
    } else {
      detected.push({
        name: 'Consolidation / Pullback Candle',
        type: 'Trend Following',
        reliability: 'Medium',
        simpleLanguage: 'Minor selling pressure causing price consolidation near recent support.',
        verdictImpact: 'Neutral'
      });
    }
  }

  return detected;
}

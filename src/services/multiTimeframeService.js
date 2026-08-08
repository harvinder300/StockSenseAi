/**
 * multiTimeframeService.js
 * Multi-Timeframe Analysis (Weekly + Daily + Hourly) for StockSense AI
 * Real Live Yahoo Finance API Data Only
 */
import { RSI, MACD, SMA } from 'technicalindicators';
import { stripHtml } from '../utils/security';
import { calculateSignal } from '../utils/signals';
import { fetchWithProxy, resolveSymbol, parseChartData } from './stockSearchService';

export async function fetchChartData(symbolInput, interval = '1d', range = '3mo') {
  const symbol = await resolveSymbol(symbolInput);
  if (!symbol) return { candles: [], meta: {} };

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}&includePrePost=false&_=${Date.now()}`;

  try {
    const data = await fetchWithProxy(url, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const result = data?.chart?.result?.[0];
    if (!result) return { candles: [], meta: {} };

    const candles = parseChartData(data);
    const meta = result.meta || {};

    return {
      candles,
      meta: {
        symbol: stripHtml(meta.symbol || symbol),
        price: meta.regularMarketPrice || candles[candles.length - 1]?.close || 0
      }
    };
  } catch (err) {
    console.warn(`Chart fetch failed for ${symbol} (${interval}/${range})`);
    return { candles: [], meta: {} };
  }
}

export function analyzeTimeframe(candles, name = 'Daily') {
  if (!candles || candles.length < 5) {
    return {
      name,
      trend: 'Neutral',
      rsiVal: 50,
      rsiSignal: 'Neutral',
      macdSignal: 'Neutral',
      macdText: 'Neutral',
      verdict: 'Neutral',
      color: '#00d4ff',
      score: 50
    };
  }

  const closes = candles.map(c => c.close);
  const lastCandle = candles[candles.length - 1];
  const lastPrice = lastCandle.close;

  const ma50Count = Math.min(50, candles.length);
  const ma50 = closes.slice(-ma50Count).reduce((sum, v) => sum + v, 0) / ma50Count;

  const ma200Count = candles.length >= 200 ? 200 : 0;
  const ma200 = ma200Count > 0 ? closes.slice(-200).reduce((sum, v) => sum + v, 0) / 200 : 0;

  let trend = 'Neutral';
  if (lastPrice > ma50 * 1.005) trend = 'Bullish';
  else if (lastPrice < ma50 * 0.995) trend = 'Bearish';

  let rsiVal = 50;
  try {
    const rsiPeriod = Math.min(14, closes.length - 1);
    if (rsiPeriod > 2) {
      const rsiValues = RSI.calculate({ period: rsiPeriod, values: closes });
      rsiVal = Math.round((rsiValues[rsiValues.length - 1] || 50) * 10) / 10;
    }
  } catch (_) {}

  let macdLine = 0;
  let signalLine = 0;
  let macdHistogram = 0;
  let macdText = 'Neutral';
  try {
    if (closes.length >= 15) {
      const macdValues = MACD.calculate({
        values: closes,
        fastPeriod: Math.min(12, Math.floor(closes.length * 0.4)),
        slowPeriod: Math.min(26, Math.floor(closes.length * 0.8)),
        signalPeriod: Math.min(9, Math.floor(closes.length * 0.3)),
        SimpleMAOscillator: false,
        SimpleMASignal: false
      });
      const lastMACD = macdValues[macdValues.length - 1];
      if (lastMACD) {
        macdLine = lastMACD.MACD || 0;
        signalLine = lastMACD.signal || 0;
        macdHistogram = lastMACD.histogram || 0;
        macdText = macdLine > signalLine ? 'Bullish' : 'Bearish';
      }
    } else {
      macdText = lastPrice >= closes[0] ? 'Bullish' : 'Bearish';
    }
  } catch (_) {}

  const volPeriod = Math.min(20, candles.length);
  const avgVol = candles.slice(-volPeriod).reduce((sum, c) => sum + c.volume, 0) / volPeriod;
  const volumeRatio = avgVol > 0 ? lastCandle.volume / avgVol : 1.0;

  const signalResult = calculateSignal({
    rsi: rsiVal,
    macdHistogram,
    macdLine,
    signalLine,
    price: lastPrice,
    ma50,
    ma200,
    volumeRatio
  });

  const verdict = signalResult.score >= 55 ? 'Bullish' : signalResult.score <= 35 ? 'Bearish' : 'Neutral';

  return {
    name,
    trend,
    rsiVal,
    rsiSignal: rsiVal < 30 ? 'Oversold' : rsiVal > 70 ? 'Overbought' : 'Neutral',
    macdSignal: macdText,
    macdText,
    verdict,
    score: signalResult.score,
    color: signalResult.color,
    signalResult,
    candlesCount: candles.length
  };
}

export function getAgreementScore(weekly, daily, hourly) {
  let bullishCount = 0;
  let bearishCount = 0;

  [weekly, daily, hourly].forEach(tf => {
    if (tf.verdict === 'Bullish') bullishCount++;
    if (tf.verdict === 'Bearish') bearishCount++;
  });

  if (bullishCount === 3) return { score: 95, label: 'Very Strong Bullish Signal 💪', color: '#00ff88', action: 'BUY' };
  if (bullishCount === 2) return { score: 67, label: 'Moderate Bullish Signal 📈', color: '#00d4ff', action: 'WATCH' };
  if (bearishCount === 3) return { score: 95, label: 'Very Strong Bearish Signal 🔴', color: '#ff4757', action: 'AVOID' };
  if (bearishCount === 2) return { score: 67, label: 'Moderate Bearish Signal 📉', color: '#ff6b6b', action: 'WAIT' };
  return { score: 33, label: 'Mixed Signals — No Clear Direction ⚠️', color: '#ffd700', action: 'WAIT' };
}

export async function fetchMultiTimeframeData(symbolInput) {
  try {
    const [weeklyRes, dailyRes, hourlyRes] = await Promise.all([
      fetchChartData(symbolInput, '1wk', '1y'),
      fetchChartData(symbolInput, '1d', '3mo'),
      fetchChartData(symbolInput, '1h', '5d')
    ]);

    const weekly = analyzeTimeframe(weeklyRes.candles, 'Weekly');
    const daily = analyzeTimeframe(dailyRes.candles, 'Daily');
    const hourly = analyzeTimeframe(hourlyRes.candles, 'Hourly');

    const agreement = getAgreementScore(weekly, daily, hourly);

    return {
      weekly,
      daily,
      hourly,
      agreement,
      rawCandles: {
        weekly: weeklyRes.candles,
        daily: dailyRes.candles,
        hourly: hourlyRes.candles
      }
    };
  } catch (err) {
    console.warn(`Multi-timeframe fetch failed for ${symbolInput}`);
    return null;
  }
}

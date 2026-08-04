/**
 * multiTimeframeService.js
 * Multi-Timeframe Analysis (Weekly + Daily + Hourly) for StockSense AI
 */
import { RSI, MACD, SMA } from 'technicalindicators';
import { stripHtml } from '../utils/security';
import { calculateSignal, getCompareVerdict } from '../utils/signals';

const CORS_PROXIES = [
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

async function fetchWithProxy(url, options = {}) {
  const fetchOpts = { ...options, signal: AbortSignal.timeout(5000) };
  try {
    const res = await fetch(url, fetchOpts);
    if (res.ok) return res.json();
  } catch (_) {}

  const proxyOpts = { ...options, signal: AbortSignal.timeout(8000) };
  for (const makeProxy of CORS_PROXIES) {
    try {
      const res = await fetch(makeProxy(url), proxyOpts);
      if (res.ok) {
        const text = await res.text();
        return JSON.parse(text);
      }
    } catch (_) {}
  }
  throw new Error('Fetch failed');
}

export async function fetchChartData(symbol, interval = '1d', range = '3mo') {
  const cleanSymbol = symbol.includes('.') ? symbol : `${symbol}.NS`;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${cleanSymbol}?interval=${interval}&range=${range}&includePrePost=false&_=${Date.now()}`;

  try {
    const data = await fetchWithProxy(url, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const result = data?.chart?.result?.[0];
    if (!result) return { candles: [], meta: {} };

    const timestamps = result.timestamp || [];
    const ohlcv = result.indicators?.quote?.[0] || {};
    const meta = result.meta || {};

    const candles = timestamps.map((ts, i) => {
      const d = new Date(ts * 1000);
      const timeStr = interval === '1h'
        ? `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`
        : d.toISOString().split('T')[0];
      return {
        time: timeStr,
        timestamp: ts,
        open: +((ohlcv.open?.[i] || 0).toFixed(2)),
        high: +((ohlcv.high?.[i] || 0).toFixed(2)),
        low: +((ohlcv.low?.[i] || 0).toFixed(2)),
        close: +((ohlcv.close?.[i] || 0).toFixed(2)),
        volume: (ohlcv.volume?.[i] || 0)
      };
    }).filter(c => c.open > 0 && c.close > 0);

    // Deduplicate
    const seen = new Set();
    const deduped = candles.filter(c => {
      if (seen.has(c.time)) return false;
      seen.add(c.time);
      return true;
    });

    return {
      candles: deduped,
      meta: {
        symbol: stripHtml(meta.symbol || cleanSymbol),
        price: meta.regularMarketPrice || deduped[deduped.length - 1]?.close || 0
      }
    };
  } catch (err) {
    console.warn(`Chart fetch failed for ${interval}/${range}`);
    return { candles: [], meta: {} };
  }
}

/**
 * Calculate indicators for a specific timeframe:
 * 1. Trend Direction: Price vs 50-period MA (or 20-period if <50 candles)
 * 2. RSI (14)
 * 3. MACD (12, 26, 9)
 * 4. Timeframe Verdict based on calculateSignal()
 */
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

  // 1. Moving Averages
  const ma50Count = Math.min(50, candles.length);
  const ma50 = closes.slice(-ma50Count).reduce((sum, v) => sum + v, 0) / ma50Count;

  const ma200Count = candles.length >= 200 ? 200 : 0;
  const ma200 = ma200Count > 0 ? closes.slice(-200).reduce((sum, v) => sum + v, 0) / 200 : 0;

  let trend = 'Neutral';
  if (lastPrice > ma50 * 1.005) trend = 'Bullish';
  else if (lastPrice < ma50 * 0.995) trend = 'Bearish';

  // 2. RSI (14)
  let rsiVal = 50;
  try {
    const rsiPeriod = Math.min(14, closes.length - 1);
    if (rsiPeriod > 2) {
      const rsiValues = RSI.calculate({ period: rsiPeriod, values: closes });
      rsiVal = Math.round((rsiValues[rsiValues.length - 1] || 50) * 10) / 10;
    }
  } catch (_) {}

  // 3. MACD (12, 26, 9)
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

  // Volume ratio
  const volPeriod = Math.min(20, candles.length);
  const avgVol = candles.slice(-volPeriod).reduce((sum, c) => sum + c.volume, 0) / volPeriod;
  const volumeRatio = avgVol > 0 ? lastCandle.volume / avgVol : 1.0;

  // 4. Calculate signal score using weighted scoring system
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

  if (bullishCount === 3) return {
    score: 95,
    label: 'Very Strong Bullish Signal 💪',
    color: '#00ff88',
    action: 'BUY'
  };
  if (bullishCount === 2) return {
    score: 67,
    label: 'Moderate Bullish Signal 📈',
    color: '#00d4ff',
    action: 'WATCH'
  };
  if (bearishCount === 3) return {
    score: 95,
    label: 'Very Strong Bearish Signal 🔴',
    color: '#ff4757',
    action: 'AVOID'
  };
  if (bearishCount === 2) return {
    score: 67,
    label: 'Moderate Bearish Signal 📉',
    color: '#ff6b6b',
    action: 'WAIT'
  };
  return {
    score: 33,
    label: 'Mixed Signals — No Clear Direction ⚠️',
    color: '#ffd700',
    action: 'WAIT'
  };
}

export async function fetchMultiTimeframeData(symbol) {
  try {
    const [weeklyRes, dailyRes, hourlyRes] = await Promise.all([
      fetchChartData(symbol, '1wk', '1y'),
      fetchChartData(symbol, '1d', '3mo'),
      fetchChartData(symbol, '1h', '5d')
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
    console.warn('Multi-timeframe service error');
    // Default safe fallback
    const fallbackTf = (name) => ({
      name,
      trend: 'Neutral',
      rsiVal: 50,
      rsiSignal: 'Neutral',
      macdSignal: 'Neutral',
      macdText: 'Neutral',
      verdict: 'Neutral',
      color: '#00d4ff',
      score: 50
    });
    const w = fallbackTf('Weekly');
    const d = fallbackTf('Daily');
    const h = fallbackTf('Hourly');
    return {
      weekly: w,
      daily: d,
      hourly: h,
      agreement: getAgreementScore(w, d, h),
      rawCandles: { weekly: [], daily: [], hourly: [] }
    };
  }
}

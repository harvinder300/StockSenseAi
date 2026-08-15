/**
 * stooqService.js
 * Stooq.com Integration — 100% Free Historical Chart Fallback
 */

import { resolveSymbolForStooq } from '../utils/symbolResolver';

/**
 * Parses Stooq CSV text into clean OHLCV objects for Lightweight Charts
 */
export function parseStooqCSV(csvText) {
  if (!csvText || typeof csvText !== 'string') return [];

  const lines = csvText.trim().split('\n');
  if (lines.length <= 1) return [];

  const header = lines[0].toLowerCase().split(',');
  const dateIdx = header.findIndex(h => h.includes('date'));
  const openIdx = header.findIndex(h => h.includes('open'));
  const highIdx = header.findIndex(h => h.includes('high'));
  const lowIdx = header.findIndex(h => h.includes('low'));
  const closeIdx = header.findIndex(h => h.includes('close'));
  const volIdx = header.findIndex(h => h.includes('vol'));

  if (dateIdx === -1 || closeIdx === -1) return [];

  const candles = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(',');
    if (parts.length < 5) continue;

    const dateStr = parts[dateIdx]?.trim();
    const open = parseFloat(parts[openIdx]) || 0;
    const high = parseFloat(parts[highIdx]) || 0;
    const low = parseFloat(parts[lowIdx]) || 0;
    const close = parseFloat(parts[closeIdx]) || 0;
    const volume = parseFloat(parts[volIdx]) || 0;

    if (dateStr && close > 0 && open > 0 && high > 0 && low > 0) {
      candles.push({
        time: dateStr,
        rawTime: new Date(dateStr).getTime() / 1000,
        open,
        high,
        low,
        close,
        volume
      });
    }
  }

  return candles.sort((a, b) => a.rawTime - b.rawTime);
}

/**
 * Fetches 90-day daily candlestick chart data from Stooq.com
 */
export async function fetchStooqChart(symbol) {
  if (!symbol) return null;
  const stooqSymbol = resolveSymbolForStooq(symbol);
  const url = `https://stooq.com/q/d/l/?s=${stooqSymbol}&i=d`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const csvText = await res.text();
      const candles = parseStooqCSV(csvText);
      if (candles.length > 0) return candles.slice(-90);
    }
  } catch (err) {
    console.error(`Stooq fetch error for ${symbol}:`, err);
  }

  return null;
}

export const fetchChartDataStooq = async (symbol) => {
  const candles = await fetchStooqChart(symbol);
  return { candles: candles || [] };
};

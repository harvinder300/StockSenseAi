import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts';
import { Layers } from 'lucide-react';

export default function StockChart({ candles, symbol, timeframe = '3 Months' }) {
  const containerRef = useRef(null);
  const chartRef     = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !candles?.length) return;

    if (chartRef.current) {
      try { chartRef.current.remove(); } catch (_) {}
      chartRef.current = null;
    }

    try {
      const chart = createChart(containerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: '#4a5568',
          fontSize: 12,
          fontFamily: 'JetBrains Mono, monospace',
        },
        grid: {
          vertLines: { color: 'rgba(255,255,255,0.03)' },
          horzLines: { color: 'rgba(255,255,255,0.03)' },
        },
        crosshair: {
          vertLine: { color: '#00d4ff', width: 1, style: 2 },
          horzLine: { color: '#00d4ff', width: 1, style: 2 },
        },
        rightPriceScale: { borderColor: 'rgba(255,255,255,0.05)', textColor: '#4a5568' },
        timeScale:       { borderColor: 'rgba(255,255,255,0.05)', timeVisible: true, secondsVisible: false },
        height: 400,
      });

      const seriesOpts = {
        upColor:        '#00ff88',
        downColor:      '#ff4757',
        borderUpColor:  '#00ff88',
        borderDownColor:'#ff4757',
        wickUpColor:    '#00ff88',
        wickDownColor:  '#ff4757',
      };

      let series;
      if (typeof chart.addSeries === 'function' && CandlestickSeries) {
        series = chart.addSeries(CandlestickSeries, seriesOpts);
      } else {
        series = chart.addCandlestickSeries(seriesOpts);
      }

      series.setData(candles.map(c => ({ time: c.time, open: c.open, high: c.high, low: c.low, close: c.close })));
      chart.timeScale().fitContent();
      chartRef.current = chart;
    } catch (err) {
      console.error('Chart error:', err);
    }

    const onResize = () => {
      if (containerRef.current && chartRef.current) {
        try { chartRef.current.applyOptions({ width: containerRef.current.clientWidth }); } catch (_) {}
      }
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      if (chartRef.current) {
        try { chartRef.current.remove(); } catch (_) {}
        chartRef.current = null;
      }
    };
  }, [candles, symbol]);

  return (
    <div className="ss-chart-card">
      <div className="ss-chart-header">
        <div className="ss-chart-title">
          <Layers size={16} color="#00d4ff" />
          {symbol} — Daily Candlestick
          <span className="ss-chart-badge">{timeframe}</span>
        </div>
        <div className="ss-chart-legend">
          <span><span className="ss-chart-swatch" style={{ background: '#00ff88' }} />Bullish</span>
          <span><span className="ss-chart-swatch" style={{ background: '#ff4757' }} />Bearish</span>
        </div>
      </div>
      <div ref={containerRef} style={{ minHeight: 400, width: '100%' }} />
      {candles && candles.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: '#8892a4', fontWeight: 600 }}>
          Data as of: {candles[candles.length - 1].time} | 15 min delayed | Source: Yahoo Finance
        </div>
      )}
    </div>
  );
}

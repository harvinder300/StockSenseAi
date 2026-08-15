import React, { useState, useEffect, useRef } from 'react';
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts';
import { Layers } from 'lucide-react';
import { fetchChartData } from '../services/twelveDataService';

const TIMEFRAME_TABS = [
  { id: '1H', label: '1H', interval: '1h', range: '5d', desc: 'Hourly (5D)' },
  { id: '1D', label: '1D', interval: '1d', range: '3mo', desc: 'Daily (3M)' },
  { id: '1W', label: '1W', interval: '1wk', range: '1y', desc: 'Weekly (1Y)' },
  { id: '1M', label: '1M', interval: '1mo', range: '2y', desc: 'Monthly (2Y)' },
];

export default function StockChart({ candles: initialCandles, symbol, timeframe = '3 Months', rawCandles = null }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  const [activeTab, setActiveTab] = useState('1D');
  const [currentCandles, setCurrentCandles] = useState(initialCandles || []);
  const [loadingTf, setLoadingTf] = useState(false);

  // Sync initial candles when symbol changes
  useEffect(() => {
    setActiveTab('1D');
    setCurrentCandles(initialCandles || []);
  }, [initialCandles, symbol]);

  // Handle Tab Switch
  const handleTabClick = async (tab) => {
    if (tab.id === activeTab && currentCandles?.length) return;
    setActiveTab(tab.id);

    // If rawCandles has pre-fetched mapped candles
    if (rawCandles) {
      if (tab.id === '1W' && rawCandles.weekly?.length) {
        setCurrentCandles(rawCandles.weekly);
        return;
      }
      if (tab.id === '1D' && rawCandles.daily?.length) {
        setCurrentCandles(rawCandles.daily);
        return;
      }
      if (tab.id === '1H' && rawCandles.hourly?.length) {
        setCurrentCandles(rawCandles.hourly);
        return;
      }
    }

    // Fetch dynamic timeframe data
    setLoadingTf(true);
    try {
      const res = await fetchChartData(symbol, tab.interval, tab.range);
      if (res.candles && res.candles.length > 0) {
        setCurrentCandles(res.candles);
      }
    } catch (_) {
    } finally {
      setLoadingTf(false);
    }
  };

  // Re-create chart on candles / tab / symbol change with 100ms destroy-recreate safety delay
  useEffect(() => {
    if (!containerRef.current || !currentCandles?.length) return;

    // 1. Destroy existing chart instance
    if (chartRef.current) {
      try { chartRef.current.remove(); } catch (_) {}
      chartRef.current = null;
    }

    let isMounted = true;

    // 2. 100ms delay between destroy and recreate
    const timer = setTimeout(() => {
      if (!isMounted || !containerRef.current) return;

      try {
        const chart = createChart(containerRef.current, {
          layout: {
            background: { type: ColorType.Solid, color: 'transparent' },
            textColor: '#8892a4',
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
          rightPriceScale: { borderColor: 'rgba(255,255,255,0.05)', textColor: '#8892a4' },
          timeScale: { borderColor: 'rgba(255,255,255,0.05)', timeVisible: activeTab === '1H', secondsVisible: false },
          height: 400,
          width: containerRef.current.clientWidth,
        });

        const seriesOpts = {
          upColor: '#00ff88',
          downColor: '#ff4757',
          borderUpColor: '#00ff88',
          borderDownColor: '#ff4757',
          wickUpColor: '#00ff88',
          wickDownColor: '#ff4757',
        };

        let series;
        if (typeof chart.addSeries === 'function' && CandlestickSeries) {
          series = chart.addSeries(CandlestickSeries, seriesOpts);
        } else {
          series = chart.addCandlestickSeries(seriesOpts);
        }

        // Set data
        series.setData(currentCandles.map(c => ({
          time: c.time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close
        })));

        // Auto-fit candles
        chart.timeScale().fitContent();
        chartRef.current = chart;
      } catch (err) {
        console.error('Chart init error:', err);
      }
    }, 100);

    // Window resize handler
    const onResize = () => {
      if (containerRef.current && chartRef.current) {
        try {
          chartRef.current.applyOptions({
            width: containerRef.current.clientWidth
          });
        } catch (_) {}
      }
    };
    window.addEventListener('resize', onResize);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      window.removeEventListener('resize', onResize);
      if (chartRef.current) {
        try { chartRef.current.remove(); } catch (_) {}
        chartRef.current = null;
      }
    };
  }, [currentCandles, symbol, activeTab]);

  const activeTabObj = TIMEFRAME_TABS.find(t => t.id === activeTab);

  return (
    <div className="ss-chart-card" style={{ position: 'relative' }}>
      {/* Chart Header + Timeframe Tabs */}
      <div className="ss-chart-header" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div className="ss-chart-title">
          <Layers size={16} color="#00d4ff" />
          {symbol} — {activeTabObj ? activeTabObj.desc : 'Candlestick Chart'}
        </div>

        {/* Timeframe Tab Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.3)', padding: 4, borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
          {TIMEFRAME_TABS.map(tab => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                style={{
                  background: isActive ? '#00d4ff' : 'transparent',
                  color: isActive ? '#0a0f1e' : '#8892a4',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: 12,
                  padding: '4px 12px',
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isActive ? '0 0 12px rgba(0, 212, 255, 0.4)' : 'none'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="ss-chart-legend">
          <span><span className="ss-chart-swatch" style={{ background: '#00ff88' }} />Bullish</span>
          <span><span className="ss-chart-swatch" style={{ background: '#ff4757' }} />Bearish</span>
        </div>
      </div>

      {/* Loading Overlay when switching timeframes */}
      {loadingTf && (
        <div style={{
          position: 'absolute',
          top: 60,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(10, 15, 30, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          color: '#00d4ff',
          fontSize: 13,
          fontWeight: 700,
          gap: 8
        }}>
          <div style={{ width: 14, height: 14, border: '2px solid #00d4ff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          Loading {activeTab} candles...
        </div>
      )}

      {/* Chart Container */}
      <div ref={containerRef} style={{ minHeight: 400, width: '100%' }} />

      {/* Footer Info */}
      {currentCandles && currentCandles.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: '#8892a4', fontWeight: 600 }}>
          Data as of: {currentCandles[currentCandles.length - 1].time} | Timeframe: {activeTab} | Source: Stooq.com (Unlimited Free Charts) & Twelve Data
        </div>
      )}
    </div>
  );
}
